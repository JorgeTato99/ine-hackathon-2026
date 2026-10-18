"""Ejercita contratos de plugins opcionales en un proyecto temporal aislado."""

import importlib.metadata
import json

# Los comandos se forman como argv interno; no se utiliza shell.
import subprocess  # nosec B404
import sys
import tempfile
from pathlib import Path

TESTS = """import math
import pytest
import pytest_asyncio
from hypothesis import given, strategies as st

@pytest_asyncio.fixture(scope="module", loop_scope="module")
async def shared():
    yield {"ready": True}

@pytest.mark.asyncio(loop_scope="module")
async def test_shared_loop_one(shared):
    assert shared["ready"]

@pytest.mark.asyncio(loop_scope="module")
async def test_shared_loop_two(shared):
    assert shared["ready"]

def test_module_patch(mocker):
    mocked = mocker.patch("math.sqrt", return_value=4)
    assert math.sqrt(16) == 4
    mocked.assert_called_once_with(16)

@given(st.lists(st.integers(min_value=-1000, max_value=1000), max_size=20))
def test_sum_reordering(values):
    assert sum(values) == sum(reversed(values))

def test_pedantic(benchmark):
    result = benchmark.pedantic(sum, setup=lambda: (([1, 2, 3],), {}), iterations=1, rounds=2)
    assert result == 6
"""


def main() -> int:
    """Comprueba dependencias y ejecuta cinco contratos con dos workers."""
    names = [
        "pytest-asyncio",
        "pytest-xdist",
        "pytest-benchmark",
        "hypothesis",
        "pytest-mock",
        "pytest-timeout",
    ]
    versions = {name: importlib.metadata.version(name) for name in names}
    with tempfile.TemporaryDirectory(prefix="python-template-plugins-") as directory:
        folder = Path(directory)
        (folder / "test_capabilities.py").write_text(TESTS, encoding="utf-8")
        (folder / "pytest.ini").write_text(
            "[pytest]\nasyncio_mode = strict\nasyncio_default_fixture_loop_scope = function\nasyncio_default_test_loop_scope = function\nfilterwarnings = error\n",
            encoding="utf-8",
        )
        command = [
            sys.executable,
            "-m",
            "pytest",
            "-q",
            "-n",
            "2",
            "--benchmark-disable",
            "--timeout=30",
            "--timeout-method=thread",
            "--import-mode=importlib",
            "--strict-config",
            "--strict-markers",
        ]
        result = subprocess.run(command, cwd=folder, check=False)  # nosec B603
        if result.returncode == 0:
            serial = [
                sys.executable,
                "-m",
                "pytest",
                "-q",
                "-k",
                "test_pedantic",
                "--benchmark-max-time=0.01",
            ]
            result = subprocess.run(serial, cwd=folder, check=False)  # nosec B603
        print(json.dumps({"versions": versions, "returncode": result.returncode}, sort_keys=True))
        return result.returncode


if __name__ == "__main__":
    raise SystemExit(main())
