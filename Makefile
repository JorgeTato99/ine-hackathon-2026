# Atajos opcionales; los comandos uv funcionan también directamente en PowerShell.
.DEFAULT_GOAL := help
.PHONY: help install check test format lint type-check security audit build watch hooks
help:
	@echo "install check test format lint type-check security audit build watch hooks"
install:
	uv sync --locked
check:
	uv run --locked python scripts/check.py
test:
	uv run --locked python -m pytest
format:
	uv run --locked ruff format src scripts tests
lint:
	uv run --locked ruff check src scripts tests
type-check:
	uv run --locked mypy
security:
	uv run --locked bandit -c pyproject.toml -r src scripts
audit:
	uv run --locked pip-audit --skip-editable
build:
	uv build
watch:
	uv run --locked --group watch ptw --now .
hooks:
	uv run --locked --group hooks prek install
