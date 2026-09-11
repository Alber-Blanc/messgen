"""Regenerate the committed JS test references using the Python implementation."""
import os
from pathlib import Path
import shutil
import subprocess
import sys
from tempfile import TemporaryDirectory

fixtures = Path(__file__).resolve().parent
root = fixtures.parents[3]
environment = dict(os.environ, PYTHONDONTWRITEBYTECODE="1")


def run(script, *args, cwd=None):
    subprocess.run(
        [sys.executable, str(script), *map(str, args)],
        cwd=cwd,
        env=environment,
        check=True,
    )


with TemporaryDirectory(prefix="messgen-js-fixtures-") as directory:
    temporary = Path(directory)
    binary = temporary / "tests/data/serialized/bin"
    binary.mkdir(parents=True)
    # The existing Python fixture generator uses paths relative to its cwd.
    shutil.copytree(root / "tests/msg", temporary / "tests/msg")
    run(root / "tests/python/generate_serialized_data.py", cwd=temporary)

    schema = temporary / "schema"
    run(
        root / "messgen-generate.py",
        "--types", root / "tests/msg/types",
        "--protocol", f"{root}/tests/msg/protocols:mynamespace/proto/test_proto",
        "--protocol", f"{root}/tests/msg/protocols:mynamespace/proto/subspace/another_proto",
        "--lang", "json", "--outdir", schema,
    )
    extra = temporary / "extra"
    run(
        root / "messgen-generate.py",
        "--types", fixtures / "types",
        "--lang", "json", "--outdir", extra,
    )

    reference = fixtures / "reference"
    reference.mkdir(exist_ok=True)
    shutil.copy2(schema / "types.json", reference / "types.json")
    shutil.copy2(schema / "protocols.json", reference / "protocols.json")
    shutil.copy2(extra / "types.json", reference / "fixture-types.json")
    shutil.copytree(binary, reference / "bin", dirs_exist_ok=True)

print(f"Updated reference fixtures in {reference}")
