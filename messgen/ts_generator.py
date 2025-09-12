import re
import textwrap
from pathlib import Path
from typing import Dict, Set, cast

from .common import SEPARATOR
from .model import MessgenType, EnumType, StructType, Protocol, TypeClass
from .validation import validate_protocol


# Helper regex patterns
_ARRAY_RE = re.compile(r"(?P<base>[^\[{]+)(?P<dims>(?:\[[^\]]*\])*)$")
_MAP_RE = re.compile(r"^(?P<base>[^\{]+)\{(?P<key>[^\}]+)\}$")


def indent(lines: str, level: int = 1, width: int = 2) -> str:
    prefix = ' ' * (level * width)
    return '\n'.join(prefix + line if line else '' for line in lines.splitlines())


def comment_block(*parts: str) -> str:
    """Join parts into a single-line JSDoc comment if any part exists."""
    text = ' '.join(p for p in parts if p)
    return f"/** {text} */\n" if text else ''


def camel(name: str) -> str:
    return ''.join(word.capitalize() for word in re.split(f"[{SEPARATOR}_]", name) if word)


def enum_key(name: str) -> str:
    segments = re.split(f"[{SEPARATOR}_]", name)
    return '_'.join(seg.upper() for seg in segments if seg)


class TypeScriptTypes:
    PRIMITIVES = {
        'bool': 'boolean', 'char': 'string', 'string': 'string', 'bytes': 'Uint8Array',
        'int8': 'number', 'uint8': 'number', 'int16': 'number', 'uint16': 'number',
        'int32': 'number', 'uint32': 'number', 'float32': 'number', 'float64': 'number',
        'int64': 'bigint', 'uint64': 'bigint', 'dec64': 'Decimal',
    }
    ARRAYS = {
        'int8': 'Int8Array', 'uint8': 'Uint8Array', 'int16': 'Int16Array', 'uint16': 'Uint16Array',
        'int32': 'Int32Array', 'uint32': 'Uint32Array', 'int64': 'BigInt64Array', 'uint64': 'BigUint64Array',
        'float32': 'Float32Array', 'float64': 'Float64Array',
    }

    @classmethod
    def resolve(cls, t: str) -> str:
        map_match = _MAP_RE.match(t)
        if map_match:
            base = cls.resolve(map_match.group('base'))
            key = cls.resolve(map_match.group('key'))
            return f"Map<{key}, {base}>"

        arr_match = _ARRAY_RE.match(t)
        if arr_match:
            base, dims = arr_match.group('base'), arr_match.group('dims')
            count = dims.count('[')
            typed = cls.ARRAYS.get(base)
            if typed and count:
                return typed + '[]' * (count - 1)
            core = cls.PRIMITIVES.get(base, camel(base))
            return core + '[]' * count

        return cls.PRIMITIVES.get(t, camel(t))


class TypeScriptGenerator:
    TYPES_FILE = 'types.ts'
    PROTOCOLS_FILE = 'protocols.ts'

    def __init__(self, options):
        self.options = options

    def generate(self, output_dir: Path, types: Dict[str, MessgenType], protocols: Dict[str, Protocol]) -> None:
        for proto in protocols.values():
            validate_protocol(proto, types)
        output_dir.mkdir(parents=True, exist_ok=True)
        self.generate_types(output_dir, types)
        self.generate_protocols(output_dir, protocols)

    def generate_types(self, out_dir: Path, types: Dict[str, MessgenType]) -> None:
        needs_decimal = any(
            t.type_class is TypeClass.struct and
            any(field.type == 'dec64' for field in cast(StructType, t).fields or [])
            for t in types.values()
        )

        blocks: list[str] = []
        if needs_decimal:
            blocks.append("import type { Decimal } from 'messgen';")

        for name, t in types.items():
            if t.type_class is TypeClass.struct:
                blocks.append(self._emit_struct(name, cast(StructType, t)))

        for name, t in types.items():
            if t.type_class is TypeClass.enum:
                blocks.append(self._emit_enum(name, cast(EnumType, t)))

        blocks.append(self._emit_type_name_enum(types))
        content = '\n'.join(blocks)
        self._write(out_dir / self.TYPES_FILE, content)

    def generate_protocols(self, out_dir: Path, protocols: Dict[str, Protocol]) -> None:
        used: Set[str] = set()
        parts: list[str] = [self._emit_protocol_enum(protocols)]

        for proto in protocols.values():
            name = camel(proto.name)
            parts.append(self._emit_message_enum(proto, name))
            parts.append(self._emit_map_interface(used, proto))

        union = textwrap.dedent(f"""
            export type Message = {' | '.join(camel(p.name) for p in protocols.values())};
            export type ProtocolMap = {' & '.join(camel(p.name) + 'ProtocolMap' for p in protocols.values())};
        """).strip()

        imports = self._build_imports(used)
        content = '\n'.join([imports, *parts, union])
        self._write(out_dir / self.PROTOCOLS_FILE, content)

    def _emit_struct(self, name: str, struct: StructType) -> str:
        header = comment_block(struct.comment or '', f"Size: {struct.size}" if struct.size is not None else '')
        body: list[str] = []
        for f in struct.fields or []:
            if f.comment:
                body.append(f"/** {f.comment} */")
            body.append(f"{f.name}: {TypeScriptTypes.resolve(f.type)};")
        block = indent('\n'.join(body))
        return f"{header}export interface {camel(name)} {{\n{block}\n}}"

    def _emit_enum(self, name: str, enum: EnumType) -> str:
        lines: list[str] = []
        for v in enum.values or []:
            lines.append(f"{enum_key(v.name)} = {v.value},")
        body = indent('\n'.join(lines))
        return f"export enum {camel(name)} {{\n{body}\n}}"

    def _emit_type_name_enum(self, types: Dict[str, MessgenType]) -> str:
        entries = [f"{enum_key(n)} = '{n}'," for n, t in types.items() if t.type_class is TypeClass.struct]
        body = indent('\n'.join(entries))
        return f"export enum TypeName {{\n{body}\n}}"

    def _emit_protocol_enum(self, protocols: Dict[str, Protocol]) -> str:
        entries = [f"{p.name.upper()} = {p.proto_id}," for p in protocols.values()]
        body = indent('\n'.join(entries))
        return f"export enum Protocol {{\n{body}\n}}"

    def _emit_message_enum(self, proto: Protocol, name: str) -> str:
        lines = [f"{m.name.upper()} = {m.message_id}," for m in proto.messages.values()]
        body = indent('\n'.join(lines))
        return f"export enum {name} {{\n{body}\n}}"

    def _emit_map_interface(self, used: Set[str], proto: Protocol) -> str:
        name = camel(proto.name)
        lines: list[str] = [f"export interface {name}Map {{"]
        lines.append(indent(f"[Protocol.{proto.name.upper()}]: {{", level=1))

        for m in proto.messages.values():
            tname = camel(m.type)
            used.add(tname)
            lines.append(indent(f"[{name}.{m.name.upper()}]: {tname};", level=2))
        lines.append(indent("};", level=1, width=2))
        lines.append("}")
        return '\n'.join(lines)

    def _write(self, path: Path, content: str) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content + '\n', encoding='utf-8')

    @staticmethod
    def _build_imports(types: Set[str]) -> str:
        if not types:
            return ''
        imports = [f"import type {{ {t} }} from './types';" for t in sorted(types)]
        return '\n'.join(imports) + '\n'
