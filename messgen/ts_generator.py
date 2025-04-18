import re
import textwrap
from pathlib import Path
from typing import Dict, Optional, Set, cast

from .common import SEPARATOR
from .model import MessgenType, EnumType, StructType, Protocol, TypeClass
from .validation import validate_protocol


_ARRAY_PATTERN = re.compile(r"(?P<base>[^\[{]+)(?P<dims>(?:\[[^\]]*\])*)$")
_MAP_PATTERN = re.compile(r"^(?P<base>[^\{]+)\{(?P<key>[^\}]+)\}$")


class TypeScriptTypes:

    TYPE_MAP: Dict[str, str] = {
        "bool": "boolean",
        "char": "string",
        "int8": "number",
        "uint8": "number",
        "int16": "number",
        "uint16": "number",
        "int32": "number",
        "uint32": "number",
        "int64": "bigint",
        "uint64": "bigint",
        "dec64": "Decimal",
        "float32": "number",
        "float64": "number",
        "string": "string",
        "bytes": "Uint8Array",
    }

    TYPED_ARRAY_MAP: Dict[str, str] = {
        "int8": "Int8Array",
        "uint8": "Uint8Array",
        "int16": "Int16Array",
        "uint16": "Uint16Array",
        "int32": "Int32Array",
        "uint32": "Uint32Array",
        "int64": "BigInt64Array",
        "uint64": "BigUint64Array",
        "float32": "Float32Array",
        "float64": "Float64Array",
    }

    @classmethod
    def get_type(cls, type_name: str) -> str:
        """Return the TypeScript counterpart for a *messgen* primitive."""
        return cls.TYPE_MAP.get(type_name, type_name)

    @classmethod
    def get_typed_array(cls, type_name: str) -> Optional[str]:
        """Return the typed‑array class for *type_name* if it exists."""
        return cls.TYPED_ARRAY_MAP.get(type_name)


# Generator --------------------------------------------------------------------

class TypeScriptGenerator:
    TYPES_FILE = "types.ts"
    PROTOCOLS_FILE = "protocols.ts"

    INDENT = "  "

    def __init__(self, options):
        self._options = options

    def generate(self, out_dir: Path, types: Dict[str, MessgenType], protocols: Dict[str, Protocol],) -> None:
        for proto in protocols.values():
            validate_protocol(proto, types)

        out_dir.mkdir(parents=True, exist_ok=True)
        self.generate_types(out_dir, types)
        self.generate_protocols(out_dir, protocols)

    def generate_types(self, out_dir: Path, types: Dict[str, MessgenType]) -> None:

        structs = [
            self._to_struct(name, cast(StructType, descriptor))
            for name, descriptor in types.items()
            if descriptor.type_class is TypeClass.struct
        ]

        enums = [
            self._to_enum(name, cast(EnumType, descriptor))
            for name, descriptor in types.items()
            if descriptor.type_class is TypeClass.enum
        ]

        type_enum: str = self._type_name_enum(types)

        file_content = "\n".join(structs + enums + [type_enum])
        self._write(out_dir / self.TYPES_FILE, file_content)

    def generate_protocols(self, out_dir: Path, protocols: Dict[str, Protocol]) -> None:
        used_types: Set[str] = set()

        proto_enum = self._proto_to_enum(protocols)
        message_enums, map_ifaces = [], []

        for proto in protocols.values():
            camel = self._camel(proto.name)
            message_enums.append(self._message_to_enum(proto, camel))
            map_ifaces.append(self._map_interface_block(
                proto, camel, used_types))

        union_types = textwrap.dedent(
            f"""
            export type Message = {' | '.join(self._camel(p.name) for p in protocols.values())};

            export type ProtocolMap = {' & '.join(self._camel(p.name) + 'Map' for p in protocols.values())};
            """
        ).strip()

        imports = self._protocol_imports(used_types)

        content = "\n\n".join(
            [imports, proto_enum, *message_enums, *map_ifaces, union_types])
        self._write(out_dir / self.PROTOCOLS_FILE, content)

    def _to_struct(self, name: str, td: StructType) -> str:
        indent = self.INDENT

        body_lines = []
        for field in getattr(td, "fields", []) or []:
            if field.comment:
                body_lines.append(f"/** {field.comment} */")
            body_lines.append(
                f"{indent}{field.name}: {self._to_ts_type(field.type)};")
        body = "\n".join(body_lines)

        header_parts = [p for p in (
            td.comment, f"Size: {td.size}" if td.size is not None else None) if p]
        header = f"/** {' '.join(header_parts)} */\n" if header_parts else ""

        return (
            f"{header}"
            f"export interface {self._camel(name)} {{\n"
            f"{textwrap.indent(body, indent) if body else ''}\n"
            f"}}"
        ).strip()

    def _to_enum(self, name: str, td: EnumType) -> str:
        value_lines = []
        for val in td.values or []:
            comment = f"/** {val.comment} */\n" if val.comment else ""
            value_lines.append(
                f"{comment}{self.INDENT}{self._enum_key(val.name)} = {val.value},")

        body = "\n".join(value_lines)
        comment = f"/** {td.comment} */\n" if td.comment else ""
        return textwrap.dedent(
            f"""{comment}export enum {self._camel(name)} {{
            {body}
            }}"""
        ).strip()

    @staticmethod
    def _type_name_enum(types: Dict[str, MessgenType]) -> str:
        body = "\n".join(
            f"  {TypeScriptGenerator._enum_key(name)} = '{name}',"
            for name, td in types.items() if td.type_class is TypeClass.struct
        )
        return textwrap.dedent(
            f"""export enum TypeName {{
            {body}
            }}"""
        ).strip()

    @staticmethod
    def _proto_to_enum(protocols: Dict[str, Protocol]) -> str:
        body = "\n".join(
            f"  {proto.name.upper()} = {proto.proto_id}," for proto in protocols.values()
        )
        return textwrap.dedent(
            f"""export enum Protocol {{
            {body}
            }}"""
        ).strip()

    @staticmethod
    def _message_to_enum(proto: Protocol, camel: str) -> str:
        body = "\n".join(
            f"  {msg.name.upper()} = {msg.message_id}," for msg in proto.messages.values()
        )
        return textwrap.dedent(
            f"""export enum {camel} {{
            {body}
            }}"""
        ).strip()

    def _map_interface_block(self, proto: Protocol, camel: str, used: Set[str]) -> str:
        mapping_lines = []
        for msg in proto.messages.values():
            struct = self._camel(msg.type)
            used.add(struct)
            mapping_lines.append(
                f"    [{camel}.{msg.name.upper()}]: {struct};")

        mappings = "\n".join(mapping_lines)
        return textwrap.dedent(
            f"""export interface {camel}Map {{
              [Protocol.{proto.name.upper()}]: {{
            {mappings}
              }}
            }}"""
        ).strip()

    @staticmethod
    def _protocol_imports(types: Set[str]) -> str:
        if not types:
            return ""  # avoid empty import blocks
        sorted_types = sorted(types)
        body = "\n".join(f"  {t}," for t in sorted_types)
        return textwrap.dedent(
            f"""import type {{
            {body}
            }} from './types';"""
        ).strip()

    def _to_ts_type(self, field_type: str) -> str:
        map_match = _MAP_PATTERN.match(field_type)
        if map_match:  # Map<K, V>
            base, key = map_match.group("base"), map_match.group("key")
            return f"Map<{self._to_ts_type(key)}, {self._to_ts_type(base)}>"

        arr_match = _ARRAY_PATTERN.match(field_type)
        if arr_match:  # Arrays – possibly typed arrays
            base, dims = arr_match.group("base"), arr_match.group("dims")
            dims_count = len(re.findall(r'\[[^\]]*\]', dims))
            typed_arr = TypeScriptTypes.get_typed_array(base)
            if typed_arr and dims_count:
                return typed_arr + '[]' * (dims_count - 1)

            ts_base = (
                TypeScriptTypes.get_type(base)
                if base in TypeScriptTypes.TYPE_MAP
                else self._camel(base)
            )
            return ts_base + '[]' * dims_count

        # Primitive or struct‑reference
        return (
            TypeScriptTypes.get_type(field_type)
            if field_type in TypeScriptTypes.TYPE_MAP
            else self._camel(field_type)
        )

    @staticmethod
    def _enum_key(name: str) -> str:
        parts = [seg for seg in re.split(f"[{SEPARATOR}_]", name) if seg]
        return "_".join(seg.upper() for seg in parts)

    @staticmethod
    def _camel(s: str) -> str:
        return "".join(part.capitalize() for part in re.split(f"[{SEPARATOR}_]", s) if part)

    @staticmethod
    def _write(path: Path, content: str) -> None:
        """Write *content* to *path* (mkdir‑p beforehand)."""
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content + "\n", encoding="utf‑8")
