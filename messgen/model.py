import hashlib
import json
import struct

from dataclasses import dataclass, asdict
from enum import Enum
from typing import Iterable, Union

from .common import SIZE_TYPE

SCALAR_SIZES = {
    "bool": 1,
    "int8": 1,
    "uint8": 1,
    "int16": 2,
    "uint16": 2,
    "int32": 4,
    "uint32": 4,
    "int64": 8,
    "uint64": 8,
    "float32": 4,
    "float64": 8,
    "int": 4,
}


class TypeClass(str, Enum):
    scalar = "scalar"
    string = "string"
    bytes = "bytes"
    vector = "vector"
    array = "array"
    map = "map"
    enum = "enum"
    bitset = "bitset"
    struct = "struct"
    decimal = "decimal"
    external = "external"


@dataclass
class BasicType:
    type: str
    type_class: TypeClass
    size: int | None

    def dependencies(self) -> set[str]:
        return set()

    def signature(self):
        return [("type", self.type)]


@dataclass
class DecimalType:
    type: str
    type_class: TypeClass
    size: int | None

    def dependencies(self) -> set[str]:
        return set()

    def signature(self):
        return [("type", self.type)]


@dataclass
class ArrayType:
    type: str
    type_class: TypeClass
    element_type: str
    array_size: int
    size: int | None

    def dependencies(self) -> set[str]:
        return {self.element_type}

    def signature(self):
        return [("type", self.type), ("element_type", self.element_type), ("array_size", self.array_size)]


@dataclass
class VectorType:
    type: str
    type_class: TypeClass
    element_type: str
    size: None

    def dependencies(self) -> set[str]:
        return {self.element_type}

    def signature(self):
        return [("type", self.type)]


@dataclass
class MapType:
    type: str
    type_class: TypeClass
    key_type: str
    value_type: str
    size: None

    def dependencies(self) -> set[str]:
        return {self.key_type, self.value_type}

    def signature(self):
        return [("type", self.type)]


@dataclass
class EnumValue:
    name: str
    value: int | str
    comment: str

    def dependencies(self) -> set[str]:
        return set()

    def signature(self):
        return [("name", self.name), ("value", self.value)]


@dataclass
class EnumType:
    type: str
    type_class: TypeClass
    base_type: str
    comment: str | None
    values: list[EnumValue]
    size: int

    def dependencies(self) -> set[str]:
        return set()

    def signature(self):
        values_sig = []
        for v in self.values:
            values_sig.append((v.name, v.value))
        return [("type", self.type), ("base_type", self.base_type), ("values", values_sig)]


@dataclass
class FieldType:
    name: str
    type: str
    comment: str | None

    def dependencies(self) -> set[str]:
        return set()


@dataclass
class StructType:
    type: str
    type_class: TypeClass
    comment: str | None
    fields: list[FieldType]
    size: int | None

    def dependencies(self) -> set[str]:
        return {field.type for field in self.fields}

    def signature(self):
        fields_sig = []
        for field in self.fields:
            fields_sig.append((field.name, field.type))
        return [("type", self.type), ("fields", fields_sig)]


@dataclass
class ExternalType:
    type: str
    type_class: TypeClass
    comment: str | None
    size: int | None

    def dependencies(self) -> set[str]:
        return set()

    def signature(self):
        return [("type", self.type), ("size", self.size)]


@dataclass
class BitsetBit:
    name: str
    offset: int
    comment: str | None

    def dependencies(self) -> set[str]:
        return set()


@dataclass
class BitsetType:
    type: str
    type_class: TypeClass
    base_type: str
    comment: str | None
    bits: list[BitsetBit]
    size: int

    def dependencies(self) -> set[str]:
        return set()

    def signature(self):
        bits_sig = []
        for b in self.bits:
            bits_sig.append((b.name, b.offset))
        return [("type", self.type), ("base_type", self.base_type), ("bits", bits_sig)]


MessgenType = Union[
    ArrayType,
    BasicType,
    DecimalType,
    EnumType,
    ExternalType,
    MapType,
    StructType,
    VectorType,
    BitsetType,
]


@dataclass
class Message:
    proto_id: int
    message_id: int
    name: str
    type: str
    comment: str | None

    def dependencies(self) -> set[str]:
        return set()

    def signature(self):
        return [("name", self.name), ("proto_id", self.proto_id), ("message_id", self.message_id)]


@dataclass
class Protocol:
    name: str
    proto_id: int
    messages: dict[int, Message]

    def dependencies(self) -> set[str]:
        return {message.type for message in self.messages.values()}


def _hash_combine(hash1: int, hash2: int) -> int:
    return _hash_bytes(struct.pack("<QQ", hash1, hash2))


def hash_type(dt: MessgenType, types: dict[str, MessgenType]) -> int | None:
    combined_hash = _hash_dataclass(dt)

    for dependency in sorted(dt.dependencies()):
        if dependency not in types:
            return None

        dependency_hash = hash_type(types[dependency], types)
        if dependency_hash is None:
            return None

        combined_hash = _hash_combine(combined_hash, dependency_hash)

    return combined_hash


def hash_message(dt: Message) -> int:
    return _hash_dataclass(dt)


def legacy_hash_type(dt: MessgenType, types: dict[str, MessgenType]) -> int | None:
    combined_hash = _legacy_hash_dataclass(dt)

    for dependency in sorted(dt.dependencies()):
        if dependency not in types:
            return None

        dependency_hash = legacy_hash_type(types[dependency], types)
        if dependency_hash is None:
            return None

        combined_hash ^= dependency_hash

    return combined_hash


def legacy_hash_message(dt: Message) -> int:
    return _legacy_hash_dataclass(dt)


def _hash_dataclass(dt) -> int:
    type_sig = dt.signature()
    return _hash_bytes(json.dumps(type_sig, separators=(",", ":")).encode())


def _legacy_hash_dataclass(dt) -> int:
    type_dict = asdict(dt)
    _remove_keys(type_dict, "comment")
    return _hash_bytes(json.dumps(sorted(type_dict.items()), separators=(",", ":")).encode())


def _hash_bytes(payload: bytes) -> int:
    hash_object = hashlib.md5(payload)
    return int.from_bytes(hash_object.digest()[:8], byteorder="little", signed=False)


def get_schema(type_def: MessgenType) -> str:
    return json.dumps(asdict(type_def), separators=(",", ":"))


def from_schema(schema: str) -> MessgenType:
    type_dict = json.loads(schema)
    type_class_name = type_dict.get("type_class")
    if not type_class_name:
        raise RuntimeError("Schema has no type_class")

    if type_class_name not in TypeClass.__members__:
        raise RuntimeError(f"Invalid type_class={type_class_name}")

    type_class = TypeClass[type_class_name]
    type_dict["type_class"] = type_class

    if type_class in (TypeClass.scalar, TypeClass.string, TypeClass.bytes):
        raise RuntimeError(f"{type_class_name} types have no schema")

    if type_class == TypeClass.decimal:
        return DecimalType(**type_dict)

    if type_class == TypeClass.array:
        return ArrayType(**type_dict)

    if type_class == TypeClass.vector:
        return VectorType(**type_dict)

    if type_class == TypeClass.map:
        return MapType(**type_dict)

    if type_class == TypeClass.enum:
        type_dict["values"] = [EnumValue(**value) for value in type_dict["values"]]
        return EnumType(**type_dict)

    if type_class == TypeClass.bitset:
        type_dict["bits"] = [BitsetBit(**bit) for bit in type_dict["bits"]]
        return BitsetType(**type_dict)

    if type_class == TypeClass.struct:
        type_dict["fields"] = [FieldType(**field) for field in type_dict["fields"]]
        return StructType(**type_dict)

    if type_class == TypeClass.external:
        return ExternalType(**type_dict)

    raise RuntimeError(f"Unsupported type_class={type_class_name}")


_CONTAINERS = (TypeClass.vector, TypeClass.map, TypeClass.string, TypeClass.bytes)


def from_schemas(schemas: Iterable[str]) -> dict[str, MessgenType]:
    """Types described by the schemas plus every type they depend on, keyed by type name.

    Scalars, string, bytes, dec64 and containers are never published as schemas and are
    derived from their name; a missing named dependency (struct, enum, bitset) is an error.
    """
    types: dict[str, MessgenType] = {}
    for schema in schemas:
        type_def = from_schema(schema)
        types[type_def.type] = type_def

    for type_def in list(types.values()):
        for dependency in type_def.dependencies():
            _resolve_type(dependency, types)

    if any(type_def.type_class in _CONTAINERS for type_def in types.values()):
        _resolve_type(SIZE_TYPE, types)

    return types


def _resolve_type(type_name: str, types: dict[str, MessgenType]) -> MessgenType:
    if type_name in types:
        return types[type_name]

    type_def: MessgenType
    if size := SCALAR_SIZES.get(type_name):
        type_def = BasicType(type=type_name, type_class=TypeClass.scalar, size=size)

    elif type_name in ("string", "bytes"):
        type_def = BasicType(type=type_name, type_class=TypeClass[type_name], size=None)

    elif type_name == "dec64":
        type_def = DecimalType(type=type_name, type_class=TypeClass.decimal, size=8)

    elif type_name.endswith("[]"):
        element = _resolve_type(type_name[:-2], types)
        type_def = VectorType(type=type_name, type_class=TypeClass.vector, element_type=element.type, size=None)

    elif type_name.endswith("]"):
        element_name, _, array_size = type_name[:-1].rpartition("[")
        element = _resolve_type(element_name, types)
        size = element.size * int(array_size) if element.size is not None else None
        type_def = ArrayType(type=type_name, type_class=TypeClass.array, element_type=element_name, array_size=int(array_size), size=size)

    elif type_name.endswith("}"):
        value_name, _, key_name = type_name[:-1].rpartition("{")
        _resolve_type(key_name, types)
        _resolve_type(value_name, types)
        type_def = MapType(type=type_name, type_class=TypeClass.map, key_type=key_name, value_type=value_name, size=None)

    else:
        raise RuntimeError(f"Missing schema for type={type_name}")

    types[type_name] = type_def
    return type_def


def _remove_keys(container: dict | list, key: str):
    if isinstance(container, dict):
        container.pop(key, None)
        for v in container.values():
            _remove_keys(v, key)
    elif isinstance(container, list):
        for item in container:
            _remove_keys(item, key)
