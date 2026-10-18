"""Paquete inicial de la plantilla Python."""

from importlib.metadata import version


def get_version() -> str:
    """Obtiene la versión de la distribución instalada."""
    return version("ine-hackathon-2026")
