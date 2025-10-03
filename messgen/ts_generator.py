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
    return f"/** {text} */\n" if text else ''


def normolize(name: str) -> str:
    last = name.split('/')[-1]
    return ''.join(w.capitalize() for w in last.split('_') if w)


def enum_key(name: str) -> str:
    segments = re.split(f"[{SEPARATOR}_/]", name) 
    return '_'.join(seg.upper() for seg in segments if seg)


def _proto_dir_from_type_path(tname: str) -> str:
    parts = tname.split('/')
    if len(parts) >= 2:
        return parts[-2]
    return 'common'

def _folder_pascal(folder: str) -> str:
    return folder[:1].upper() + folder[1:]


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
            core = cls.PRIMITIVES.get(base, normolize(base))
            return core + '[]' * count

        return cls.PRIMITIVES.get(t, normolize(t))

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
        result: Set[str] = set()

        mk = cls._split_map(t)
        if mk:
            base, key = mk
            result |= cls.dependencies(base)
            result |= cls.dependencies(key)
            return result

        base = cls._strip_dims(t)
        if base in cls.PRIMITIVES:
            return set()

        result.add(base)
        return result

    @classmethod
    def uses_dec64(cls, t: str) -> bool:
        mk = cls._split_map(t)
        if mk:
            base, key = mk
            return cls.uses_dec64(base) or cls.uses_dec64(key)

        base = cls._strip_dims(t)
        return base == 'dec64'

def _collect_external_deps_for_folder(folder: str, local_type_names: Set[str], types: Dict[str, MessgenType]) -> Dict[str, Set[str]]:
    external: Dict[str, Set[str]] = defaultdict(set)

    for tname in local_type_names:
        t = types.get(tname)
        if not t or t.type_class is not TypeClass.struct:
            continue
        st = cast(StructType, t)
        for f in st.fields or []:
            for dep in TypeScriptTypes.dependencies(f.type):
                dep_folder = _proto_dir_from_type_path(dep)
                if dep_folder != folder:
                    external[dep_folder].add(normolize(dep))
    return external


class TypeScriptGenerator:
    TYPES_FILE = 'types.ts'
    PROTOCOLS_FILE = 'protocols.ts'

    def __init__(self, options):
        self.options = options

    def generate(self, output_dir: Path, types: Dict[str, MessgenType], protocols: Dict[str, Protocol]) -> None:
        for pname in sorted(protocols.keys()):
            proto = protocols[pname]
            validate_protocol(proto, types)

        output_dir.mkdir(parents=True, exist_ok=True)

        self.generate_types(output_dir, types)
        self.generate_protocols(output_dir, protocols)
    
    def generate_types(self, out_dir: Path, types: Dict[str, MessgenType]) -> None:
        by_proto: DefaultDict[str, Set[str]] = defaultdict(set)
        for name, v in types.items():
            if v.type_class not in {TypeClass.struct, TypeClass.enum, TypeClass.bitset}:
                continue
            folder = _proto_dir_from_type_path(name)
            by_proto[folder].add(name)

        for folder, local_names in sorted(by_proto.items()):
            external_deps = _collect_external_deps_for_folder(folder, local_names, types)

            print(f"Folder '{folder}' has {len(local_names)} local types and {sum(len(v) for v in external_deps.values())} external deps")
            print(external_deps.values())

            needs_decimal = False
            for tname in local_names:
                t = types[tname]
                if t.type_class is TypeClass.struct:
                    st = cast(StructType, t)
                    if any(TypeScriptTypes.uses_dec64(f.type) for f in (st.fields or [])):
                        needs_decimal = True
                        break

            proto_dir = out_dir / folder
            proto_dir.mkdir(parents=True, exist_ok=True)

            blocks: list[str] = []

            for other_folder in sorted(external_deps.keys()):
                spec = ', '.join(sorted(external_deps[other_folder]))
                rel = f"../{other_folder}/types"
                blocks.append(f"import type {{ {spec} }} from '{rel}';")

            if needs_decimal:
                blocks.append("import type { Decimal } from 'messgen';")

            print(local_names)

            for tname in sorted(local_names):
                t = types[tname]
                if t.type_class is TypeClass.struct:
                    blocks.append(self._emit_struct(tname, cast(StructType, t), types))
            for tname in sorted(local_names):
                t = types[tname]
                if t.type_class is TypeClass.enum:
                    blocks.append(self._emit_enum(tname, cast(EnumType, t)))
            for tname in sorted(local_names):
                t = types[tname]
                if t.type_class is TypeClass.bitset:
                    blocks.append(self._emit_bitset(tname, cast(BitsetType, t)))

            self._write(proto_dir / self.TYPES_FILE, '\n'.join(blocks))

        ns_lines = []
        for folder in sorted(by_proto.keys()):
            ns = _folder_pascal(folder)
            ns_lines.append(f"export * as {ns} from './{folder}/types';")

        typename_block = self._emit_root_type_name_enum(types)
        content = '\n'.join(ns_lines + ['\n' + typename_block] if typename_block else ns_lines)
        self._write(out_dir / self.TYPES_FILE, content)

    def generate_protocols(self, out_dir: Path, protocols: Dict[str, Protocol]) -> None:
        if not protocols:
            self._write(out_dir / self.PROTOCOLS_FILE, "export enum Protocol {}\n")
            return

        import_lines: List[str] = []
        per_proto_blocks: List[str] = []

        proto_order = sorted(protocols.values(), key=lambda p: p.name)
        proto_ns_list = [normolize(p.name) for p in proto_order]

        proto_folder_aliases: Dict[str, Dict[str, str]] = {}
        for proto in proto_order:
            ns = normolize(proto.name)
            folders: List[str] = []
            for mid in sorted(proto.messages.keys()):
                m = proto.messages[mid]
                folder = _proto_dir_from_type_path(m.type)
                folders.append(folder)
            unique_folders = sorted(set(folders))

            alias_map: Dict[str, str] = {}
            if len(unique_folders) == 1:
                folder = unique_folders[0]
                alias = f"{ns}Types"
                alias_map[folder] = alias
                import_lines.append(f"import type * as {alias} from './{folder}/types';")
            else:
                for folder in unique_folders:
                    alias = f"{ns}{_folder_pascal(folder)}Types"
                    alias_map[folder] = alias
                    import_lines.append(f"import type * as {alias} from './{folder}/types';")

            proto_folder_aliases[ns] = alias_map

        for proto in proto_order:
            ns = normolize(proto.name)
            alias_map = proto_folder_aliases[ns]

            enum_lines = [f"{m.name.upper()} = {m.message_id},"
                          for m in sorted(proto.messages.values(), key=lambda x: x.message_id)]
            enum_body = indent('\n'.join(enum_lines))
            enum_block = f"export enum {ns} {{\n{enum_body}\n}}\n"

            map_lines = [f"export interface {ns}ProtocolMap {{",
                         indent(f"[{proto.proto_id}]: {{", 1)]
            for mid in sorted(proto.messages.keys()):
                m = proto.messages[mid]
                tname = normolize(m.type)
                folder = _proto_dir_from_type_path(m.type)
                alias = alias_map[folder]
                map_lines.append(indent(f"[{ns}.{m.name.upper()}]: {alias}.{tname};", 2))
            map_lines.append(indent("};", 1))
            map_lines.append("}")
            map_block = '\n'.join(map_lines)

            per_proto_blocks.append(enum_block + map_block)

        protocol_enum_entries = [f"{p.name.upper().split('/')[-1]} = {p.proto_id}," for p in proto_order]
        protocol_enum_body = indent('\n'.join(protocol_enum_entries))
        protocol_enum_block = f"export enum Protocol {{\n{protocol_enum_body}\n}}"

        union_names = proto_ns_list
        map_names = [f"{n}ProtocolMap" for n in union_names]
        unions_block = textwrap.dedent(f"""
            export type Message = {' | '.join(union_names)};
            export type ProtocolMap = {' & '.join(map_names)};
        """).strip()

        parts = [
            '\n'.join(import_lines),
            '\n\n'.join(per_proto_blocks),
            protocol_enum_block,
            unions_block,
        ]
        self._write(out_dir / self.PROTOCOLS_FILE, '\n'.join(parts))

    def _emit_struct(self, name: str, struct: StructType, types: Dict[str, MessgenType]) -> str:
        header = comment_block(struct.comment or '', f"Size: {struct.size}" if struct.size is not None else '')
        body: list[str] = []
        for f in struct.fields or []:
            if f.comment:
                body.append(f"/** {f.comment} */")
            ts_type = TypeScriptTypes.resolve(f.type)
            body.append(f"{f.name}: {ts_type};")
        block = indent('\n'.join(body))
        return f"{header}export interface {normolize(name)} {{\n{block}\n}}"

    def _emit_enum(self, name: str, enum: EnumType) -> str:
        lines: list[str] = []
        for v in sorted(enum.values, key=lambda v: v.value):
            lines.append(f"{enum_key(v.name)} = {v.value},")
        body = indent('\n'.join(lines))
        return f"export enum {normolize(name)} {{\n{body}\n}}"

    def _emit_bitset(self, name: str, bitset: BitsetType) -> str:
        enum_lines: list[str] = []
        for b in sorted(bitset.bits, key=lambda b: b.offset):
            val = f"(1 << {b.offset})"
            enum_lines.append(f"{enum_key(b.name)} = {val},")
        enum_body = indent('\n'.join(enum_lines))
        enum_name = normolize(name)
        return f"export enum {enum_name} {{\n{enum_body}\n}}"

    def _emit_root_type_name_enum(self, types: Dict[str, MessgenType]) -> str:
        entries: List[str] = []
        for full_name, t in sorted(types.items()):
            if t.type_class is not TypeClass.struct:
                continue
            key = enum_key(full_name)
            entries.append(f"{key} = '{full_name}',")
        if not entries:
            return ''
        body = indent('\n'.join(entries))
        return f"export enum TypeName {{\n{body}\n}}"

    def _write(self, path: Path, content: str) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content + '\n', encoding='utf-8')
