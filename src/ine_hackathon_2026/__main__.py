"""Punto de entrada de ejemplo para verificar la instalación del paquete."""

import argparse

from ine_hackathon_2026 import get_version


def main() -> None:
    """Presenta la ayuda o la versión del proyecto instalado."""
    parser = argparse.ArgumentParser(description="Proyecto Python listo para personalizar.")
    parser.add_argument("--version", action="version", version=get_version())
    parser.parse_args()
    parser.print_help()


if __name__ == "__main__":
    main()
