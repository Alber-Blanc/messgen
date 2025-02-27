import hashlib
import json
import struct

from dataclasses import dataclass, asdict
from enum import Enum, auto
from typing import Union


class TypeClass(str, Enum):
    scalar = auto()
    string = auto()
    bytes = auto()
    vector = auto()
    array = auto()
    map = auto()
    enum = auto()
    struct = auto()


@dataclass
class BasicType:
    type: str
    type_class: TypeClass
    size: int | None

    def dependencies(self) -> set[str]:
        return set()


@dataclass
class ArrayType:
    type: str
    type_class: TypeClass
    element_type: str
    array_size: int
    size: int | None

    def dependencies(self) -> set[str]:
        return {self.element_type}


@dataclass
class VectorType:
    type: str
    type_class: TypeClass
    element_type: str
    size: None

    def dependencies(self) -> set[str]:
        return {self.element_type}


@dataclass
class MapType:
    type: str
    type_class: TypeClass
    key_type: str
    value_type: str
    size: None

    def dependencies(self) -> set[str]:
        return {self.key_type, self.value_type}


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


MessgenType = Union[
    ArrayType,
    BasicType,
    EnumType,
    MapType,
    StructType,
    VectorType,
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


@dataclass
class Protocol:
    name: str
    proto_id: int
    messages: dict[int, Message]

    def dependencies(self) -> set[str]:
        return {message.type for message in self.messages.values()}


def hash_type(dt: MessgenType, types: dict[str, MessgenType]) -> int | None:
    combined_hash = _hash_dataclass(dt)

    for dependency in dt.dependencies():
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
    type_dict = asdict(dt)
    _remove_keys(type_dict, "comment")
    return _hash_bytes(json.dumps(sorted(type_dict.items()), separators=(",", ":")).encode())


def _hash_bytes(payload: bytes) -> int:
    hash_object = hashlib.md5(payload)
    return int.from_bytes(hash_object.digest()[:8], byteorder="big", signed=False)


def _remove_keys(container: dict | list, key: str):
    if isinstance(container, dict):
        container.pop(key, None)
        for k, v in container.items():
            _remove_keys(v, key)
    elif isinstance(container, list):
        for item in container:
            _remove_keys(item, key)
