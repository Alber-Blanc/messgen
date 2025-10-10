import json

from dataclasses import asdict
from pathlib import Path

from protocol_version import version_hash
from model import (
    MessgenType,
    Protocol,
    TypeClass,
)


class JsonGenerator:
    _FILE_EXT = ".json"

    def __init__(self, options):
        self._options = options

    def generate(self, out_dir: Path, types: dict[str, MessgenType], protocols: dict[str, Protocol]) -> None:
        self.generate_types(out_dir, types)
        self.generate_protocols(out_dir, protocols)

    def generate_types(self, out_dir: Path, types: dict[str, MessgenType]) -> None:
        combined: list = []

        for type_name in sorted(types.keys()):
            type_def = types[type_name]
            if type_def.type_class in [TypeClass.struct, TypeClass.enum, TypeClass.bitset]:
                combined.append(asdict(type_def))

        self._write_file(out_dir, "types", combined)

    def generate_protocols(self, out_dir: Path, protocols: dict[str, Protocol]) -> None:
        combined: list = []

        for proto_name in sorted(protocols.keys()):
            proto_def = protocols[proto_name]
            proto_dict = asdict(proto_def)
            proto_dict["version"] = version_hash(proto_dict)
            combined.append(proto_dict)

        self._write_file(out_dir, "protocols", combined)

    def _write_file(self, out_dir: Path, name: str, data: list) -> None:
        file_name = out_dir / (name + self._FILE_EXT)
        file_name.parent.mkdir(parents=True, exist_ok=True)

        with open(file_name, "w", encoding="utf-8") as f: json.dump(data, f, indent=2)
