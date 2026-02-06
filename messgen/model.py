import hashlib
import json

from dataclasses import dataclass, asdict
from enum import Enum
from typing import Union


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
    value: int
    comment: str

    def dependencies(self) -> set[str]:
        return set()


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


def hash_type(dt: MessgenType, types: dict[str, MessgenType]) -> int | None:
    combined_hash = _hash_dataclass(dt)

    for dependency in sorted(list(dt.dependencies())):
        if dependency not in types:
            return None

        dependency_hash = hash_type(types[dependency], types)
        if dependency_hash is None:
            return None

        combined_hash ^= dependency_hash

    return combined_hash


def hash_message(dt: Message) -> int:
    return _hash_dataclass(dt)


def _hash_dataclass(dt) -> int:
    type_sig = dt.signature()
    return _hash_bytes(json.dumps(type_sig, separators=(",", ":")).encode())


def _hash_bytes(payload: bytes) -> int:
    hash_object = hashlib.md5(payload)
    return int.from_bytes(hash_object.digest()[:8], byteorder="little", signed=False)


def _remove_keys(container: dict | list, key: str):
    if isinstance(container, dict):
        container.pop(key, None)
        for k, v in container.items():
            _remove_keys(v, key)
    elif isinstance(container, list):
        for item in container:
            _remove_keys(item, key)
