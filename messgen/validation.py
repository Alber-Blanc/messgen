from typing import Any

from .common import SEPARATOR
from .model import (
    EnumType,
    hash_type,
    MessgenType,
    Protocol,
    StructType,
    BitsetType,
)

RESERVED_KEY_WORDS = {
    # Go
    "break",
    "case",
    "chan",
    "const",
    "continue",
    "default",
    "defer",
    "else",
    "fallthrough",
    "for",
    "func",
    "go",
    "goto",
    "if",
    "import",
    "interface",
    "map",
    "package",
    "range",
    "return",
    "select",
    "struct",
    "switch",
    "type",
    "var",

    # C++
    "alignas",
    "alignof",
    "and_eq",
    "and",
    "asm",
    "atomic_cancel",
    "atomic_commit",
    "atomic_noexcept",
    "auto",
    "bitand",
    "bitor",
    "bool",
    "break",
    "case",
    "catch",
    "char",
    "class",
    "co_await",
    "co_return",
    "co_yield",
    "compl",
    "concept",
    "const_cast",
    "const",
    "consteval",
    "constexpr",
    "constinit",
    "continue",
    "decltype",
    "default",
    "delete",
    "do",
    "double",
    "dynamic_cast",
    "else",
    "enum",
    "explicit",
    "export",
    "extern",
    "false",
    "float",
    "for",
    "friend",
    "goto",
    "if",
    "import",
    "inline",
    "int",
    "long",
    "module",
    "mutable",
    "namespace",
    "new",
    "noexcept",
    "not_eq",
    "not",
    "nullptr",
    "operator",
    "or_eq",
    "or",
    "private",
    "protected",
    "public",
    "reflexpr",
    "register",
    "reinterpret_cast",
    "requires",
    "return",
    "short",
    "signed",
    "sizeof",
    "static_assert",
    "static_cast",
    "static",
    "struct",
    "switch",
    "synchronized",
    "template",
    "this",
    "thread_local",
    "throw",
    "true",
    "try",
    "typedef",
    "typeid",
    "typename",
    "union",
    "unsigned",
    "using",
    "virtual",
    "void",
    "volatile",
    "wchar_t",
    "while",
    "xor_eq",
    "xor",
    "char16_t",
    "char32_t",
    "char8_t",
    "int8_t",
    "int16_t",
    "int32_t",
    "int64_t",
    "uint8_t",
    "uint16_t",
    "uint32_t",
    "uint64_t",
}


def validate_protocol(protocol: Protocol):
    for p in protocol.name.split(SEPARATOR):
        if not is_valid_name(p):
            raise RuntimeError(f"Invalid protocol name part \"{p}\" in protocol \"{protocol.name}\"")
    seen_names = set()
    for msg_id, msg in protocol.messages.items():
        if not is_valid_name(msg.name):
            raise RuntimeError(f"Invalid protocol message name {msg.name} in protocol {protocol.name}")
        if msg.name in seen_names:
            raise RuntimeError(f"Message with name={msg.name} appears multiple times in protocol={protocol.name}")
        if msg.message_id != msg_id:
            raise RuntimeError(
                f"Message {msg.name} has different message_id={msg.message_id} than key={msg_id} in protocol={protocol.name}")
        seen_names.add(msg.name)


def validate_types(types: dict[str, MessgenType]):
    seen_hashes: dict[int, Any] = {}
    for type_name, type_def in types.items():
        type_hash = hash_type(type_def, types)
        if not type_hash:
            continue
        if hash_conflict := seen_hashes.get(type_hash):
            raise RuntimeError(f"Type {type_name} has the same hash as {hash_conflict.type}")
        seen_hashes[type_hash] = type_def


def validate_protocol_types(protocol: Protocol, types: dict[str, MessgenType] | None):
    for msg in protocol.messages.values():
        if msg.type not in types:
            raise RuntimeError(f"Type {msg.type} required by message={msg.name} protocol={protocol.name} not found")


# Checks if `s` is a valid name for a field or a message type
def is_valid_name(name: str):
    if not isinstance(name, str) or not name:
        return False

    if not (name[0].isalpha() or name[0] == "_"):
        return False

    if not all(c.isalnum() or c == "_" for c in name[1:]):
        return False

    if name in RESERVED_KEY_WORDS:
        return False

    return True


def validate_type_dict(type_name: str, item: dict[str, StructType | EnumType | BitsetType]) -> None:
    for p in type_name.split(SEPARATOR):
        if not is_valid_name(p):
            raise RuntimeError(f"Invalid type name part \"{p}\" in type \"{type_name}\"")

    if "type_class" not in item:
        raise RuntimeError(f"type_class missing in \"{type_name}\": \"{item}\"")

    if (type_class := item.get("type_class")) not in ["struct", "enum", "bitset", "external"]:
        raise RuntimeError(f"type_class \"{type_class}\" in \"{type_name}\" is not supported")
