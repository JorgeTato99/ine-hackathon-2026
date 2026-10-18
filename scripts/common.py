"""Descarga verificable y extracción de archivos públicos dentro de data/."""

import hashlib
import json
import shutil
import stat
import tempfile
import time
import urllib.request
import zipfile
import zlib
from datetime import UTC, datetime
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]


def now_utc() -> str:
    return datetime.now(UTC).isoformat()


def sha256(path: Path) -> str:
    with path.open("rb") as stream:
        return hashlib.file_digest(stream, "sha256").hexdigest()


def crc32_file(path: Path) -> int:
    checksum = 0
    with path.open("rb") as stream:
        while chunk := stream.read(1024 * 1024):
            checksum = zlib.crc32(chunk, checksum)
    return checksum


def write_json(path: Path, value: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_text(
        json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n"
    )
    temporary.replace(path)


def download(url: str, target: Path) -> Path:
    """Reutiliza el archivo local; publica nuevas descargas solo al completarlas."""
    parsed = urlsplit(url)
    if parsed.scheme != "https" or parsed.hostname not in {"ine.mx", "gaia.inegi.org.mx"}:
        raise ValueError("Las descargas requieren HTTPS y una fuente oficial configurada.")
    if target.exists():
        print(f"Archivo local: {target.relative_to(ROOT)}", flush=True)
        return target
    target.parent.mkdir(parents=True, exist_ok=True)
    partial = target.with_suffix(target.suffix + ".part")
    for attempt in range(1, 4):
        try:
            request = urllib.request.Request(url, headers={"User-Agent": "INE-Hackathon-2026/0.1"})
            with (
                urllib.request.urlopen(request, timeout=120) as response,  # nosec B310: HTTPS y host validados arriba.
                partial.open("wb") as out,
            ):
                if response.headers.get_content_type() == "text/html":
                    raise ValueError("El servidor devolvió HTML en lugar del archivo de datos")
                expected = response.headers.get("Content-Length")
                shutil.copyfileobj(response, out, length=1024 * 1024)
            if expected is not None and partial.stat().st_size != int(expected):
                raise OSError("La descarga no coincide con Content-Length")
            partial.replace(target)
            print(f"Descargado: {target.name} ({target.stat().st_size:,} bytes)", flush=True)
            return target
        except (OSError, ValueError) as exc:
            print(f"Intento {attempt}/3: {exc}", flush=True)
            if attempt == 3:
                raise
            time.sleep(attempt * 2)
    raise RuntimeError("Descarga incompleta")


def archive_inventory(archive: zipfile.ZipFile) -> list[zipfile.ZipInfo]:
    """Rechaza rutas externas, enlaces y colisiones de nombres en Windows."""
    entries = []
    names: set[str] = set()
    for entry in archive.infolist():
        name = entry.filename.replace("\\", "/")
        components = name.rstrip("/").split("/")
        if name.startswith("/") or any(
            p in {"", ".", ".."} or ":" in p or p.endswith((".", " ")) for p in components
        ):
            raise ValueError(f"Ruta ZIP insegura: {name}")
        if stat.S_ISLNK(entry.external_attr >> 16):
            raise ValueError(f"Enlace simbólico no permitido: {name}")
        key = name.rstrip("/").casefold()
        if key in names:
            raise ValueError(f"Ruta ZIP duplicada: {name}")
        names.add(key)
        if not entry.is_dir():
            entries.append(entry)
    return entries


def extract_verified(zip_path: Path, destination: Path) -> list[dict]:
    """Comprueba CRC de todos los miembros antes de reutilizar o extraer el ZIP."""
    with zipfile.ZipFile(zip_path) as archive:
        entries = archive_inventory(archive)
        invalid = archive.testzip()
        if invalid:
            raise ValueError(f"CRC incorrecto: {invalid}")
        required = sum(e.file_size for e in entries)
        if destination.exists():
            expected = {e.filename.replace("\\", "/"): e.file_size for e in entries}
            actual = {
                p.relative_to(destination).as_posix(): p.stat().st_size
                for p in destination.rglob("*")
                if p.is_file()
            }
            if actual != expected:
                raise ValueError(f"Extracción local incompleta o modificada: {destination}")
            for entry in entries:
                if crc32_file(destination / entry.filename) != entry.CRC:
                    raise ValueError(f"CRC local incorrecto: {entry.filename}")
        else:
            if shutil.disk_usage(destination.parent).free < required + 100 * 1024**2:
                raise OSError("Espacio insuficiente para extraer el ZIP")
            # El temporal siempre pertenece al directorio del año; su limpieza es local.
            with tempfile.TemporaryDirectory(prefix=".extract-", dir=destination.parent) as temp:
                temporary = Path(temp)
                archive.extractall(temporary)
                for entry in entries:
                    if (temporary / entry.filename).stat().st_size != entry.file_size:
                        raise OSError(f"Tamaño incorrecto: {entry.filename}")
                temporary.rename(destination)
        return [{"path": e.filename, "bytes": e.file_size, "crc32": e.CRC} for e in entries]
