"""Descarga los seis ZIP de CCPC, verifica su CRC y extrae los CSV originales."""

import argparse
import csv
import json
from pathlib import Path
from urllib.parse import urlparse

from scripts.common import ROOT, download, extract_verified, now_utc, sha256, write_json


def prepare(year: str, url: str) -> dict:
    directory = ROOT / "data" / "raw" / year
    path = download(url, directory / Path(urlparse(url).path).name)
    files = extract_verified(path, directory / "extracted")
    csv_files = sorted((directory / "extracted").rglob("*.csv"))
    if len(csv_files) != 32:
        raise ValueError(f"{year}: se esperaban 32 CSV, hay {len(csv_files)}")
    headers = {}
    for csv_path in csv_files:
        with csv_path.open(encoding="utf-8-sig", newline="") as stream:
            header = next(csv.reader(stream, delimiter=",", quotechar='"'))
        required = {"AELEC", "EDOCVE", "MPIOCVE", "MPIONOM", "LN", "SV", "NV", "NS"}
        if not required.issubset(header):
            raise ValueError(f"Esquema inesperado en {csv_path.name}: {header}")
        headers[csv_path.name] = header
    manifest = {
        "source_url": url,
        "election_year": int(year),
        "verified_at_utc": now_utc(),
        "zip_file": path.name,
        "zip_bytes": path.stat().st_size,
        "zip_sha256": sha256(path),
        "crc_verified": True,
        "extraction_directory": "extracted",
        "extracted_bytes": sum(f["bytes"] for f in files),
        "file_count": len(files),
        "csv_count": len(csv_files),
        "headers": headers,
        "files": files,
    }
    write_json(directory / "descarga.json", manifest)
    print(f"{year}: {len(csv_files)} CSV listos; CRC correcto", flush=True)
    return manifest


def main() -> None:
    sources = json.loads((ROOT / "config" / "sources.json").read_text(encoding="utf-8"))
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--years", nargs="+", choices=list(sources["elections"]))
    args = parser.parse_args()
    for year in args.years or sources["elections"]:
        prepare(year, sources["elections"][year])


if __name__ == "__main__":
    main()
