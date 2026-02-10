import posixpath
import re
from pathlib import Path
from typing import Dict, Set, List, DefaultDict, cast, Tuple, Iterable
from collections import defaultdict
from contextlib import contextmanager

from .common import SEPARATOR
from .model import ExternalType, MessgenType, EnumType, StructType, Protocol, TypeClass, BitsetType


def normalize(name: str) -> str:
    last = name.split('/')[-1]
    return ''.join(w.capitalize() for w in last.split('_') if w)

def enum_key(name: str) -> str:
    segments = re.split(f"[{SEPARATOR}_/]", name)
    return '_'.join(seg.upper() for seg in segments if seg)

def _proto_dir_from_type_path(tname: str) -> str:
    return tname.rpartition('/')[0] or tname

def _alias_from_key(path: str) -> str:
    parts = re.split(r'[/_]', path)
    return ''.join(p[:1].upper() + p[1:] for p in parts if p)

def _type_folder_of(t: str) -> str:
    return t.rpartition(SEPARATOR)[0] or t

def _rel_path(from_dir: str, to_dir: str) -> str:
    rel = posixpath.relpath(to_dir, start=from_dir)
    return f'.{SEPARATOR}' if rel == '.' else rel

def _local_typename_key(full: str) -> str:
    return enum_key(full.split('/')[-1])

class TSWriter:
    def __init__(self, indent_size: int = 2) -> None:
        self._buf: List[str] = []
        self._ind = 0
        self._w = ' ' * indent_size

    def line(self, s: str = "") -> None:
        if s:
            self._buf.append(f"{self._w * self._ind}{s}")
        else:
            self._buf.append("")

    def lines(self, xs: Iterable[str]) -> None:
        for x in xs:
            self.line(x)

    def blank(self) -> None:
        if self._buf and self._buf[-1] != "":
            self._buf.append("")

    def jsdoc(self, *parts: str) -> None:
        text = ' '.join(p for p in parts if p).strip()
        if text:
            self.line(f"/** {text} */")

    @contextmanager
    def block(self, header: str, end: str = ""):
        self.line(f"{header} {{")
        self._ind += 1
        try:
            yield
        finally:
            self._ind -= 1
            self.line(f"}}{end}")

    def emit(self) -> str:
        return "\n".join(self._buf).rstrip() + "\n"

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
        m = cls._split_map(t)
        if m:
            (base, key) = map(cls.resolve, m)
            return f"Map<{key}, {base}>"

        v = cls._split_vec_or_arr(t)
        if v:
            (base, _) = v
            # Convert int8[] to Int8Array, etc.
            typed = cls.ARRAYS.get(base)
            if typed:
                return typed
            base = cls.resolve(base)
            # treat fixed-size arrays same as dynamic arrays
            return f"{base}[]"

        return cls.PRIMITIVES.get(t, normalize(t))

    @classmethod
    def _split_vec_or_arr(cls, t: str):
        if not t.endswith("]"):
            return None
        start = t.rfind('[')
        assert start != -1, "Invalid array type format"
        size_str = t[start + 1:-1]
        size = int(size_str) if size_str.isdigit() else None
        base = t[:start]
        return (base, size)

    @classmethod
    def _split_map(cls, t: str):
        if not t.endswith("}"):
            return None
        # not supporting map type as "key" value for simplicity,
        # parse from the end to find the last '{'
        start = t.rfind('{')
        assert start != -1, "Invalid map type format"
        key = t[start + 1:-1]
        base = t[:start]
        return (base, key)

    @classmethod
    def dependencies(cls, t: str) -> Set[str]:
        m = cls._split_map(t)
        if m:
            base, key = m
            return cls.dependencies(base) | cls.dependencies(key)

        v = cls._split_vec_or_arr(t)
        if v:
            (base, _) = v
            return cls.dependencies(base)

        return set() if t in cls.PRIMITIVES else {t}

    @classmethod
    def uses_dec64(cls, t: str) -> bool:
        m = cls._split_map(t)
        if m:
            base, key = m
            return cls.uses_dec64(base) or cls.uses_dec64(key)

        v = cls._split_vec_or_arr(t)
        if v:
            (base, _) = v
            return cls.uses_dec64(base)

        return t == 'dec64'

class TypeScriptGenerator:
    TYPES_FILE = 'types.ts'
    PROTOCOLS_FILE = 'protocols.ts'

    def __init__(self, options=None):
        self.options = options

    def generate(self, output_dir: Path, types: Dict[str, MessgenType], protocols: Dict[str, Protocol]) -> None:
        output_dir.mkdir(parents=True, exist_ok=True)
        self.generate_types(output_dir, types)
        self.generate_protocols(output_dir, protocols)

    def generate_types(self, out_dir: Path, types: Dict[str, MessgenType]) -> None:
        by_folder = self._collect_types_by_folder(types)

        for folder, local_names in sorted(by_folder.items()):
            content = self._emit_types(folder, local_names, types)
            file_name = out_dir / folder / 'index.ts'
            file_name.parent.mkdir(parents=True, exist_ok=True)
            self._write(file_name, content)

        root_content = self._emit_types_root(types)
        self._write(out_dir / self.TYPES_FILE, root_content)

    def generate_protocols(self, out_dir: Path, protocols: Dict[str, Protocol]) -> None:
        if not protocols:
            self._write(out_dir / self.PROTOCOLS_FILE, "export type ProtocolMap = {};\n")
            return

        items: List[Tuple[str, Protocol]] = sorted(protocols.items(), key=lambda v: v[1].name)

        for proto_key_path, proto in items:
            content = self._emit_protocols(proto_key_path, proto)
            file_name = out_dir / proto_key_path / 'index.ts'
            file_name.parent.mkdir(parents=True, exist_ok=True)
            self._write(file_name, content)

        root_content = self._emit_protocols_root(items)
        self._write(out_dir / self.PROTOCOLS_FILE, root_content)

    def _collect_types_by_folder(self, types: Dict[str, MessgenType]) -> DefaultDict[str, Set[str]]:
        by_folder: DefaultDict[str, Set[str]] = defaultdict(set)
        for full, t in types.items():
            if t.type_class in {TypeClass.struct, TypeClass.enum, TypeClass.bitset, TypeClass.external}:
                by_folder[_proto_dir_from_type_path(full)].add(full)
        return by_folder

    def _collect_external_deps_for_folder(
        self, folder: str, local_type_names: Set[str], types: Dict[str, MessgenType]
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
                    normalized_path = import_path if import_path.startswith('.') else f'./{import_path}'
                    external[normalized_path].add(normalize(dep))
        return external

    def _emit_types(self, folder: str, local_names: Set[str], types: Dict[str, MessgenType]) -> str:
        w = TSWriter()

        imports = self._emit_types_module_imports(folder, local_names, types)
        if imports:
            w.lines(imports.splitlines())
            w.blank()

        local_types = self._emit_local_types(local_names, types)
        if local_types:
            w.lines(local_types.splitlines())

        w.lines(self._emit_local_typename_enum(local_names, types).splitlines())
        w.blank()

        w.lines(self._emit_local_typemap(local_names, types).splitlines())

        return w.emit()

    def _emit_types_module_imports(self, folder: str, local_names: Set[str], types: Dict[str, MessgenType]) -> str:
        external = self._collect_external_deps_for_folder(folder, local_names, types)
        w = TSWriter()

        for rel in sorted(external.keys()):
            spec = ', '.join(sorted(external[rel]))
            w.line(f"import type {{ {spec} }} from '{rel}';")

        needs_decimal = any(
            types[n].type_class is TypeClass.struct and any(
                TypeScriptTypes.uses_dec64(f.type) for f in cast(StructType, types[n]).fields or []
            )
            for n in local_names
        )
        if needs_decimal:
            if external:
                w.blank()
            w.line("import type { Decimal } from 'messgen';")

        return w.emit().rstrip()

    def _emit_local_types(self, local_names: Set[str], types: Dict[str, MessgenType]) -> str:
        out: List[str] = []
        for name in sorted(local_names):
            t = types[name]
            if t.type_class is TypeClass.struct:
                out.append(self._emit_struct(name, cast(StructType, t), types))
            elif t.type_class is TypeClass.enum:
                out.append(self._emit_enum(name, cast(EnumType, t)))
            elif t.type_class is TypeClass.bitset:
                out.append(self._emit_bitset(name, cast(BitsetType, t)))
            elif t.type_class is TypeClass.external:
                out.append(self._emit_external(name, cast(ExternalType, t)))
        return ''.join(out)

    def _emit_local_typename_enum(self, local_names: Set[str], types: Dict[str, MessgenType]) -> str:
        struct_names = sorted(n for n in local_names if types[n].type_class is TypeClass.struct)
        w = TSWriter()
        if not struct_names:
            w.line("export enum Types {}")
            return w.emit()

        with w.block("export enum Types"):
            for n in struct_names:
                w.line(f"{_local_typename_key(n)} = '{n}',")
        return w.emit()

    def _emit_local_typemap(self, local_names: Set[str], types: Dict[str, MessgenType]) -> str:
        struct_names = sorted(n for n in local_names if types[n].type_class is TypeClass.struct)
        
        w = TSWriter()
        w.line("export type TypeMap = {")
        for n in struct_names:
            w.line(f"  [Types.{_local_typename_key(n)}]: {normalize(n)};")
        w.line("};")
        return w.emit()

    def _emit_types_root(self, types: Dict[str, MessgenType]) -> str:
        struct_full: List[str] = sorted(full for full, t in types.items() if t.type_class is TypeClass.struct)
        w = TSWriter()
        if not struct_full:
            w.line("export type TypeMap = {};")
            w.line("export type Types = never;")
            return w.emit()

        folders = sorted({_type_folder_of(full) for full in struct_full})
        folder_alias: Dict[str, str] = {folder: _alias_from_key(folder) for folder in folders}

        for folder, alias in sorted(folder_alias.items()):
            w.line(f"import type * as {alias} from './{folder}';")
        w.blank()

        aliases = [alias for _, alias in sorted(folder_alias.items())]
        inter = " & ".join(f"{a}.TypeMap" for a in aliases) if aliases else "{}"

        w.line(f"export type TypeMap = {inter};")
        w.blank()

        return w.emit()

    def _emit_protocols(self, proto_key_path: str, proto: Protocol) -> str:
        proto_dir = proto_key_path
        messages = sorted(proto.messages.values(), key=lambda m: m.message_id)

        unique_folders = sorted({_type_folder_of(m.type) for m in messages})
        folder_alias: Dict[str, str] = {tf: _alias_from_key(tf) for tf in unique_folders}

        w = TSWriter()
        for tf in unique_folders:
            rel = _rel_path(proto_dir, tf)
            alias = folder_alias[tf]
            w.line(f"import type * as {alias} from '{rel}';")

        w.blank()
        w.lines(self._emit_proto_message_enum(messages).splitlines())
        w.blank()
        w.lines(self._emit_proto_map(proto, messages, folder_alias).splitlines())
        return w.emit()

    def _emit_proto_message_enum(self, messages) -> str:
        w = TSWriter()
        with w.block("export enum Message"):
            for m in messages:
                w.line(f"{m.name.upper()} = {m.message_id},")
        return w.emit()

    def _emit_proto_map(self, proto: Protocol, messages, folder_alias: Dict[str, str]) -> str:
        w = TSWriter()
        w.line(f"export const PROTO_ID = {proto.proto_id};")
        w.blank()
        with w.block("export type Proto =", end=";"):
            with w.block("[PROTO_ID]:"):
                for m in messages:
                    tf = _type_folder_of(m.type)
                    ts_type = f"{folder_alias[tf]}.{normalize(m.type)}"
                    w.line(f"[Message.{m.name.upper()}]: {ts_type};")
        return w.emit()

    def _emit_protocols_root(self, items: List[Tuple[str, Protocol]]) -> str:
        w = TSWriter()
        aliases: List[str] = []
        for key, _ in items:
            alias = _alias_from_key(key)
            aliases.append(alias)
            w.line(f"import type * as {alias} from './{key}';")
        w.blank()
        inter = " & ".join(f"{a}.Proto" for a in aliases) if aliases else "{}"
        w.line(f"export type ProtocolMap = {inter};")
        return w.emit()

    def _emit_struct(self, name: str, struct: StructType, types: Dict[str, MessgenType]) -> str:
        w = TSWriter()
        w.jsdoc(struct.comment or '', f"Size: {struct.size}" if struct.size is not None else '')
        with w.block(f"export type {normalize(name)} =", end=";"):
            for f in struct.fields or []:
                w.jsdoc(f.comment or '')
                w.line(f"{f.name}: {TypeScriptTypes.resolve(f.type)};")
        return w.emit()

    def _emit_enum(self, name: str, enum: EnumType) -> str:
        w = TSWriter()
        with w.block(f"export enum {normalize(name)}"):
            for v in sorted(enum.values, key=lambda v: v.value):
                w.line(f"{enum_key(v.name)} = {v.value},")
        return w.emit()

    def _emit_bitset(self, name: str, bitset: BitsetType) -> str:
        w = TSWriter()
        with w.block(f"export enum {normalize(name)}"):
            for b in sorted(bitset.bits, key=lambda b: b.offset):
                w.line(f"{enum_key(b.name)} = (1 << {b.offset}),")
        return w.emit()

    def _emit_external(self, name: str, external: ExternalType) -> str:
        w = TSWriter()
        w.jsdoc(external.comment or '')
        w.line(f"export type {normalize(name)} = unknown;")
        w.blank()
        return w.emit()

    def _write(self, path: Path, content: str) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content, encoding='utf-8')
