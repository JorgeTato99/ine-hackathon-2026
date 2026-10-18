"""Casos que protegen la extracción y evitan cruces municipales incorrectos."""

import csv
import io
import tempfile
import unittest
import zipfile
from pathlib import Path

from scripts.build_crosswalk import match_municipality, normalize_name
from scripts.common import archive_inventory, download, extract_verified


def source_row(code="01001", name="Municipio Uno"):
    return {"clave_ine": code, "cve_ent_ine": code[:2], "municipio_ine": name, "nombres_ine": name}


def target_row(code="01001", name="Municipio Uno"):
    return {"CVEGEO": code, "CVE_ENT": code[:2], "NOMGEO": name}


class CrosswalkTests(unittest.TestCase):
    def test_accents_and_punctuation(self):
        self.assertEqual(normalize_name("Álvaro  Obregón."), "ALVARO OBREGON")

    def test_code_collision_uses_name_in_same_state(self):
        wrong = target_row("01001", "Municipio Dos")
        right = target_row("01002", "Municipio Uno")
        result = match_municipality(
            source_row(), {"01001": wrong, "01002": right}, {("01", "MUNICIPIO UNO"): [right]}, {}
        )
        self.assertEqual(result["cvegeo"], "01002")
        self.assertEqual(result["metodo"], "nombre_unico_en_entidad")

    def test_same_name_in_other_state_does_not_match(self):
        other = target_row("02001")
        result = match_municipality(
            source_row(), {"02001": other}, {("02", "MUNICIPIO UNO"): [other]}, {}
        )
        self.assertEqual(result["cvegeo"], "")

    def test_ambiguous_name_is_not_assigned(self):
        candidates = [target_row("01002"), target_row("01003")]
        result = match_municipality(source_row(), {}, {("01", "MUNICIPIO UNO"): candidates}, {})
        self.assertEqual(result["cvegeo"], "")
        self.assertEqual(result["metodo"], "nombre_ambiguo")


class ArchiveTests(unittest.TestCase):
    def test_unapproved_download_sources_are_rejected(self):
        for url in ["file:///etc/passwd", "http://ine.mx/file.zip", "https://example.com/file.zip"]:
            with self.subTest(url=url), self.assertRaises(ValueError):
                download(url, Path("unused.zip"))

    def test_unsafe_paths_are_rejected(self):
        for name in ["../escape.csv", "/absolute.csv", "C:/escape.csv", "folder/file. "]:
            with self.subTest(name=name):
                data = io.BytesIO()
                with zipfile.ZipFile(data, "w") as archive:
                    archive.writestr(name, "test")
                data.seek(0)
                with zipfile.ZipFile(data) as archive, self.assertRaises(ValueError):
                    archive_inventory(archive)

    def test_extract_is_repeatable_and_keeps_original(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder)
            zip_path = path / "source.zip"
            with zipfile.ZipFile(zip_path, "w") as archive:
                archive.writestr("nested/data.csv", "a,b\n1,2\n")
            first = extract_verified(zip_path, path / "extracted")
            second = extract_verified(zip_path, path / "extracted")
            self.assertEqual(first, second)
            self.assertTrue(zip_path.exists())

    def test_modified_extracted_file_is_rejected_even_with_same_size(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder)
            zip_path = path / "source.zip"
            with zipfile.ZipFile(zip_path, "w") as archive:
                archive.writestr("data.csv", "a,b\n1,2\n")
            extract_verified(zip_path, path / "extracted")
            (path / "extracted/data.csv").write_text("a,b\n1,3\n", encoding="utf-8")
            with self.assertRaises(ValueError):
                extract_verified(zip_path, path / "extracted")


class CsvTests(unittest.TestCase):
    def test_quoted_comma_and_zero_filter_after_aggregation(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "sample.csv"
            with path.open("w", newline="", encoding="utf-8") as stream:
                writer = csv.writer(stream)
                writer.writerow(
                    [
                        "AELEC",
                        "FELECCION",
                        "EDOCVE",
                        "EDONOM",
                        "MPIOCVE",
                        "MPIONOM",
                        "SECCION",
                        "TIPOSEC",
                        "DEF",
                        "DEL",
                        "SEXO",
                        "EDAD",
                        "LN",
                        "SV",
                        "NV",
                        "NS",
                    ]
                )
                for municipality, name, sv, nv in [
                    (1, "Nombre, con coma", 0, 0),
                    (1, "Nombre, con coma", 2, 3),
                    (2, "Sin observaciones", 0, 0),
                ]:
                    writer.writerow(
                        [
                            2024,
                            "2024-06-02",
                            1,
                            "Entidad",
                            municipality,
                            name,
                            1,
                            "U",
                            "",
                            "",
                            0,
                            18,
                            sv + nv,
                            sv,
                            nv,
                            0,
                        ]
                    )
            from ine_hackathon_2026.ccpc import scan_typed
            from scripts.prepare_catalogs import municipal_table

            result = municipal_table(scan_typed([path], 2024))
            eligible = result.filter(result["elegible"])
            self.assertEqual(eligible["clave_ine"].to_list(), ["01001"])
            self.assertEqual(eligible["municipio_ine"].to_list(), ["Nombre, con coma"])
            self.assertEqual(eligible["sv"].to_list(), [2])
            self.assertEqual(eligible["nv"].to_list(), [3])


if __name__ == "__main__":
    unittest.main()
