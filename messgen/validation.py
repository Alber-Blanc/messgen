from typing import Any

from .common import SEPARATOR
from .model import (
    hash_type,
    MessgenType,
    Protocol,
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
        if not _is_valid_name(p):
            raise RuntimeError(f"Invalid protocol name part \"{p}\" in protocol \"{protocol.name}\"")
    seen_names = set()
    for msg_id, msg in protocol.messages.items():
        if not _is_valid_name(msg.name):
            raise RuntimeError(f"Invalid protocol message name \"{msg.name}\" in protocol \"{protocol.name}\"")
        if msg.name in seen_names:
            raise RuntimeError(f"Message with name \"{msg.name}\" appears multiple times in protocol \"{protocol.name}\"")
        if msg.message_id != msg_id:
            raise RuntimeError(
                f"Message \"{msg.name}\" has different message_id={msg.message_id} than key={msg_id} in protocol \"{protocol.name}\"")
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
        if types is None or msg.type not in types:
            raise RuntimeError(f"Type {msg.type} required by message={msg.name} protocol={protocol.name} not found")


# Checks if `name` is a valid name for a field or part of type, message or protocol
def _is_valid_name(name: str) -> bool:
    if not isinstance(name, str) or not name:
        return False

    if not (name[0].isalpha() or name[0] == "_"):
        return False

    if not all(c.isalnum() or c == "_" for c in name[1:]):
        return False

    if name in RESERVED_KEY_WORDS:
        return False

    return True


# Checks if `name` is a valid fully qualified name for a type or protocol
def _is_valid_full_name(name: str) -> tuple[bool, str]:
    for p in name.split(SEPARATOR):
        if not _is_valid_name(p):
            return False, p

    return True, ""


def validate_type_descriptor(type_name: str, desc: dict) -> None:
    valid, p = _is_valid_full_name(type_name)
    if not valid:
        raise RuntimeError(f"Invalid type name part \"{p}\" in type \"{type_name}\"")

    if "type_class" not in desc:
        raise RuntimeError(f"\"type_class\" is missing for type \"{type_name}\"")

    if (type_class := desc.get("type_class")) not in ["struct", "enum", "bitset", "external"]:
        raise RuntimeError(f"type_class \"{type_class}\" in \"{type_name}\" is not supported")

    if type_class == "struct":
        fields = desc.get("fields")
        if fields is not None:  # fields are allowed to be empty for empty struct
            for field in desc["fields"]:
                if "name" not in field:
                    raise RuntimeError(f"\"name\" is missing for the field of struct \"{type_name}\": \"{field}\"")
                field_name = field["name"]
                if not _is_valid_name(field_name):
                    raise RuntimeError(f"Invalid field name \"{field_name}\" in struct \"{type_name}\"")
                if "type" not in field:
                    raise RuntimeError(f"\"type\" is missing for the field \"{field_name}\" of struct \"{type_name}\"")
    elif type_class == "enum":
        if "base_type" not in desc:
            raise RuntimeError(f"\"base_type\" is missing for enum \"{type_name}\"")
        if "values" not in desc:
            raise RuntimeError(f"\"values\" is missing for enum \"{type_name}\"")
        for item in desc["values"]:
            if "name" not in item:
                raise RuntimeError(f"\"name\" is missing for the item of enum \"{type_name}\": \"{item}\"")
            item_name = item["name"]
            if not _is_valid_name(item_name):
                raise RuntimeError(f"Invalid item name \"{item_name}\" in enum \"{type_name}\"")
            if "value" not in item:
                raise RuntimeError(f"\"value\" is missing for the item \"{item_name}\" of enum \"{type_name}\"")
    elif type_class == "bitset":
        if "base_type" not in desc:
            raise RuntimeError(f"\"base_type\" is missing for bitset \"{type_name}\"")
        if "bits" not in desc:
            raise RuntimeError(f"\"bits\" is missing for bitset \"{type_name}\"")
        for bit in desc["bits"]:
            if "name" not in bit:
                raise RuntimeError(f"\"name\" is missing for the bit of bitset \"{type_name}\": \"{bit}\"")
            bit_name = bit["name"]
            if not _is_valid_name(bit_name):
                raise RuntimeError(f"Invalid bit name \"{bit_name}\" in bitset \"{type_name}\"")
            if "offset" not in bit:
                raise RuntimeError(f"\"offset\" is missing for the bit \"{bit_name}\" of bitset \"{type_name}\"")
