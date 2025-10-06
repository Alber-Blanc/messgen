import posixpath
import re
import textwrap
from pathlib import Path
from typing import Dict, Set, List, DefaultDict, cast
from collections import defaultdict

from .common import SEPARATOR
from .model import MessgenType, EnumType, StructType, Protocol, TypeClass, BitsetType
from .validation import validate_protocol

_ARRAY_RE = re.compile(r"(?P<base>[^\[{]+)(?P<dims>(?:\[[^\]]*\])*)$")
_MAP_RE = re.compile(r"^(?P<base>[^\{]+)\{(?P<key>[^\}]+)\}$")


def indent(lines: str, level: int = 1, width: int = 2) -> str:
    prefix = ' ' * (level * width)
    return '\n'.join(prefix + line if line else '' for line in lines.splitlines())


def comment_block(*parts: str) -> str:
    text = ' '.join(p for p in parts if p)
    return f"/** {text} */\n" if text else ""


def normalize(name: str) -> str:
    last = name.split('/')[-1]
    return ''.join(w.capitalize() for w in last.split('_') if w)


def enum_key(name: str) -> str:
    segments = re.split(f"[{SEPARATOR}_/]", name)
    return '_'.join(seg.upper() for seg in segments if seg)


def _proto_dir_from_type_path(tname: str) -> str:
    return tname.rpartition('/')[0] or tname


def _pascal_from_path(path: str) -> str:
    parts = re.split(r'[/_]', path)
    return ''.join(p[:1].upper() + p[1:] for p in parts if p)

def _type_folder_of(t: str) -> str:
    return t.rpartition('/')[0] or t

def _rel_path(from_dir: str, to_dir: str) -> str:
    rel = posixpath.relpath(to_dir, start=from_dir)
    if rel == '.':
        return './'
    return rel

def _alias_from_key(key: str) -> str:
    return ''.join(part[:1].upper() + part[1:] for part in key.split('/') if part)


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
        m = _MAP_RE.match(t)
        if m:
            base = cls.resolve(m.group('base'))
            key = cls.resolve(m.group('key'))
            return f"Map<{key}, {base}>"

        m = _ARRAY_RE.match(t)
        if m:
            base, dims = m.group('base'), m.group('dims')
            dims_count = dims.count('[')
            typed = cls.ARRAYS.get(base)
            if typed and dims_count:
                return typed + '[]' * (dims_count - 1)
            core = cls.PRIMITIVES.get(base, normalize(base))
            return core + '[]' * dims_count

        return cls.PRIMITIVES.get(t, normalize(t))

    @classmethod
    def _strip_dims(cls, t: str) -> str:
        m = _ARRAY_RE.match(t)
        return m.group('base') if m else t

    @classmethod
    def _split_map(cls, t: str):
        m = _MAP_RE.match(t)
        if not m:
            return None
        return m.group('base'), m.group('key')

    @classmethod
    def dependencies(cls, t: str) -> Set[str]:
        m = cls._split_map(t)
        if m:
            base, key = m
            return cls.dependencies(base) | cls.dependencies(key)

        base = cls._strip_dims(t)
        return set() if base in cls.PRIMITIVES else {base}

    @classmethod
    def uses_dec64(cls, t: str) -> bool:
        m = cls._split_map(t)
        if m:
            base, key = m
            return cls.uses_dec64(base) or cls.uses_dec64(key)

        base = cls._strip_dims(t)
        return base == 'dec64'


def _collect_external_deps_for_folder(
    folder: str, local_type_names: Set[str], types: Dict[str, MessgenType]
) -> Dict[str, Set[str]]:
    external: Dict[str, Set[str]] = defaultdict(set)

    for tname in local_type_names:
        t = types.get(tname)
        if not t or t.type_class is not TypeClass.struct:
            continue
        st = cast(StructType, t)
        for f in st.fields or []:
            for dep in TypeScriptTypes.dependencies(f.type):
                dep_folder = _proto_dir_from_type_path(dep)
                if dep_folder == folder:
                    continue
                import_path = posixpath.relpath(dep_folder, start=folder)
                external[import_path].add(normalize(dep))
    return external

class TypeScriptGenerator:
    TYPES_FILE = 'types.ts'
    PROTOCOLS_FILE = 'protocols.ts'

    def __init__(self, options=None):
        self.options = options

    def generate(self, output_dir: Path, types: Dict[str, MessgenType], protocols: Dict[str, Protocol]) -> None:
        for pname in sorted(protocols.keys()):
            validate_protocol(protocols[pname], types)

        output_dir.mkdir(parents=True, exist_ok=True)
        self.generate_types(output_dir, types)
        self.generate_protocols(output_dir, protocols)

    def generate_types(self, out_dir: Path, types: Dict[str, MessgenType]) -> None:
        by_proto: DefaultDict[str, Set[str]] = defaultdict(set)
        for name, v in types.items():
            if v.type_class in {TypeClass.struct, TypeClass.enum, TypeClass.bitset}:
                by_proto[_proto_dir_from_type_path(name)].add(name)

        for folder, local_names in sorted(by_proto.items()):
            external_deps = _collect_external_deps_for_folder(folder, local_names, types)
            needs_decimal = any(
                TypeClass.struct is types[tname].type_class
                and any(
                    TypeScriptTypes.uses_dec64(f.type)
                    for f in cast(StructType, types[tname]).fields or []
                )
                for tname in local_names
            )

            proto_dir = out_dir / folder
            proto_dir.mkdir(parents=True, exist_ok=True)

            blocks: List[str] = []

            for other_folder in sorted(external_deps.keys()):
                spec = ', '.join(sorted(external_deps[other_folder]))
                blocks.append(f"import type {{ {spec} }} from '{other_folder}';")

            if needs_decimal:
                blocks.append("import type { Decimal } from 'messgen';")

            for tname in sorted(local_names):
                t = types[tname]
                if t.type_class is TypeClass.struct:
                    blocks.append(self._emit_struct(tname, cast(StructType, t), types))
                elif t.type_class is TypeClass.enum:
                    blocks.append(self._emit_enum(tname, cast(EnumType, t)))
                elif t.type_class is TypeClass.bitset:
                    blocks.append(self._emit_bitset(tname, cast(BitsetType, t)))

            self._write(proto_dir / 'index.ts', '\n'.join(blocks))

        typename_block = self._emit_root_type_name_enum(types)
        self._write(out_dir / self.TYPES_FILE, typename_block)

    def generate_protocols(self, out_dir: Path, protocols: Dict[str, Protocol]) -> None:
        if not protocols:
            self._write(out_dir / self.PROTOCOLS_FILE, "export type ProtocolMap = {};\n")
            return

        items = sorted(protocols.items(), key=lambda v: v[1].name)

        for proto_key_path, proto in items:
            proto_dir = proto_key_path

            messages = sorted(proto.messages.values(), key=lambda m: m.message_id)
            type_folders = []
            for m in messages:
                type_folders.append(_type_folder_of(m.type))
            unique_type_folders = sorted(set(type_folders))

            folder_alias: Dict[str, str] = {}
            for tf in unique_type_folders:
                alias = _pascal_from_path(tf)
                folder_alias[tf] = alias

            import_lines: List[str] = []
            for tf in unique_type_folders:
                rel = _rel_path(proto_dir, tf)
                alias = folder_alias[tf]
                import_lines.append(f"import type * as {alias} from '{rel}';")
            import_block = '\n'.join(import_lines)

            enum_entries = '\n'.join(f"{m.name.upper()} = {m.message_id}," for m in messages)
            enum_block = f"export enum Message {{\n{indent(enum_entries)}\n}}"


            lines = [
                f"const PROTO_ID = {proto.proto_id};",
                "",
                "export interface Proto {",
                indent("[PROTO_ID]: {", 1),
            ]
            for m in messages:
                tf = _type_folder_of(m.type)
                alias = folder_alias[tf]
                tname = normalize(m.type)
                lines.append(indent(f"[Message.{m.name.upper()}]: {alias}.{tname};", 2))
            lines.append(indent("};", 1))
            lines.append("}")
            map_block = '\n'.join(lines)

            content = '\n\n'.join([import_block, enum_block, map_block]) + '\n'

            proto_file = out_dir / proto_dir / 'index.ts'
            proto_file.parent.mkdir(parents=True, exist_ok=True)
            self._write(proto_file, content)

        root_imports = [f"import type * as {_alias_from_key(key)} from './{key}';"
                for key, _ in items]
        import_block = '\n'.join(root_imports)

        ns_list = [_alias_from_key(key) for key, _ in items]
        union = ' & '.join(f"{ns}.Proto" for ns in ns_list) if ns_list else '{}'
        root_content = f"{import_block}\n\nexport type ProtocolMap = {union};\n"

        self._write(out_dir / self.PROTOCOLS_FILE, root_content)

    def _emit_struct(self, name: str, struct: StructType, types: Dict[str, MessgenType]) -> str:
        header = comment_block(
            struct.comment or '',
            f"Size: {struct.size}" if struct.size is not None else '',
        )
        body: List[str] = []
        for f in struct.fields or []:
            if f.comment:
                body.append(f"/** {f.comment} */")
            body.append(f"{f.name}: {TypeScriptTypes.resolve(f.type)};")
        body_joined = '\n'.join(body)
        return f"{header}export interface {normalize(name)} {{\n{indent(body_joined)}\n}}"

    def _emit_enum(self, name: str, enum: EnumType) -> str:
        lines = [f"{enum_key(v.name)} = {v.value}," for v in sorted(enum.values, key=lambda v: v.value)]
        joined = '\n'.join(lines)
        return f"export enum {normalize(name)} {{\n{indent(joined)}\n}}"

    def _emit_bitset(self, name: str, bitset: BitsetType) -> str:
        lines = [f"{enum_key(b.name)} = (1 << {b.offset})," for b in sorted(bitset.bits, key=lambda b: b.offset)]
        joined = '\n'.join(lines)
        return f"export enum {normalize(name)} {{\n{indent(joined)}\n}}"

    def _emit_root_type_name_enum(self, types: Dict[str, MessgenType]) -> str:
        entries = [
            f"{enum_key(full_name)} = '{full_name}',"
            for full_name, t in sorted(types.items())
            if t.type_class is TypeClass.struct
        ]
        if not entries:
            return ''
        joined = '\n'.join(entries)
        return f"export enum TypeName {{\n{indent(joined)}\n}}"

    def _write(self, path: Path, content: str) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content + '\n', encoding='utf-8')
