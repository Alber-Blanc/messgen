import json
import struct
import typing
import sys

from abc import (
    ABC,
    abstractmethod,
)
from decimal import (
    Decimal,
)
from pathlib import (
    Path,
)

from .model import (
    ArrayType,
    EnumType,
    MapType,
    MessgenType,
    StructType,
    TypeClass,
    VectorType,
    Message,
    hash_type,
    hash_message,
)
from .yaml_parser import (
    parse_protocols,
    parse_types,
)

STRUCT_TYPES_MAP = {
    "uint8": "B",
    "int8": "b",
    "uint16": "H",
    "int16": "h",
    "uint32": "I",
    "int32": "i",
    "uint64": "Q",
    "int64": "q",
    "float32": "f",
    "float64": "d",
    "bool": "?",
}


class JSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, bytes):
            return f"0x{obj.hex()}"
        elif isinstance(obj, Decimal):
            return str(obj)
        return super().default(obj)


class MessgenError(Exception):
    pass


class TypeConverter(ABC):
    def __init__(self, types: dict[str, MessgenType], type_name: str):
        self._type_name = type_name
        self._type_def = types[type_name]
        self._type_class = self._type_def.type_class
        self._type_hash = hash_type(self._type_def, types)
        if not self._type_hash:
            raise MessgenError(f"Invalid type_name={type_name}")

    def type_name(self) -> str:
        return self._type_name

    def type_hash(self) -> int:
        assert self._type_hash
        return self._type_hash

    def serialize(self, data: dict) -> bytes:
        return self._serialize(data)

    def deserialize(self, data: bytes) -> dict:
        try:
            msg, sz = self._deserialize(data)
        except Exception as e:
            raise MessgenError(f'Failed to deserialize data_size={len(data)} type_name={self._type_name} error="{e}"') from e

        if sz != len(data):
            raise MessgenError(f"Invalid message size expected={sz} actual={len(data)} type_name={self._type_name}")

        return msg

    @abstractmethod
    def _serialize(self, data) -> bytes:
        pass

    @abstractmethod
    def _deserialize(self, data) -> tuple[typing.Any, int]:
        pass


class ScalarConverter(TypeConverter):
    def __init__(self, types: dict[str, MessgenType], type_name: str):
        super().__init__(types, type_name)
        assert self._type_class == TypeClass.scalar

        self.struct_fmt = STRUCT_TYPES_MAP.get(type_name)
        if self.struct_fmt is None:
            raise RuntimeError('Unsupported scalar type "%s"' % type_name)

        self.struct_fmt = "<" + self.struct_fmt
        self.size = struct.calcsize(self.struct_fmt)
        self.def_value: bool | float | int = 0

        if type_name == "bool":
            self.def_value = False
        elif type_name == "float32" or type_name == "float64":
            self.def_value = 0.0

    def _serialize(self, data):
        return struct.pack(self.struct_fmt, data)

    def _deserialize(self, data):
        return struct.unpack(self.struct_fmt, data[: self.size])[0], self.size

    def default_value(self):
        return self.def_value


class DecimalConverter(TypeConverter):
    _MAX_COEFFICIENT = 10**16 - 1
    _MAX_EXPONENT = 369
    _MIN_EXPONENT = -398

    def __init__(self, types: dict[str, MessgenType], type_name: str):
        super().__init__(types, type_name)
        assert self._type_class == TypeClass.decimal
        assert self._type_def.size == 8  # only dec64 is supported

        self.def_value: Decimal = Decimal("0")
        self.size = self._type_def.size

    def _serialize(self, value: Decimal) -> bytes:
        if not isinstance(value, Decimal):
            raise MessgenError(f"Expected Decimal type, got {type(value)}")

        # Handle special values
        if value.is_nan():
            return int(0b11111 << 58).to_bytes(self.size, byteorder="little")

        if value.is_infinite():
            sign_bit = 1 if value < 0 else 0
            return ((sign_bit << 63) | (0b11110 << 58)).to_bytes(self.size, byteorder="little")

        # Extract components from Decimal
        sign, digits, exponent = value.as_tuple()
        assert isinstance(exponent, int)

        # Convert digits to coefficient
        coefficient = 0
        for digit in digits:
            coefficient = coefficient * 10 + digit

        # Normalize the coefficient
        while coefficient != 0 and coefficient % 10 == 0 and exponent < self._MAX_EXPONENT:
            coefficient //= 10
            exponent += 1

        # Normalize the exponent
        while exponent > self._MAX_EXPONENT and coefficient * 10 <= self._MAX_COEFFICIENT:
            coefficient *= 10
            exponent -= 1

        # Check if dec64 is inifity
        if (sign == 0 and coefficient > self._MAX_COEFFICIENT) or exponent > self._MAX_EXPONENT:
            return ((sign << 63) | (0b11110 << 58)).to_bytes(self.size, byteorder="little")

        # Check if dec64 trimms to zero
        if coefficient > self._MAX_COEFFICIENT or exponent < self._MIN_EXPONENT:
            return int(sign << 63).to_bytes(self.size, byteorder="little")

        # Store the sign
        bits = sign

        # Determine encoding format based on coefficient size
        if coefficient > ((1 << 53) - 1):
            coefficient_bits = 51
            bits <<= 2
            bits |= 0b11  # Top 2 bits of combination field

        else:
            coefficient_bits = 53

        # Apply exponent bias
        bits <<= 10
        bits |= exponent - self._MIN_EXPONENT

        # Apply the coefficient
        bits <<= coefficient_bits
        bits |= coefficient & ((1 << coefficient_bits) - 1)

        return bits.to_bytes(self.size, byteorder="little")

    def _deserialize(self, data: bytes) -> tuple[Decimal, int]:
        # Convert bytes to 64-bit integer
        bits = int.from_bytes(data[: self.size], byteorder="little")
        if bits == 0:
            return Decimal((0, (0,), 0)), self.size

        # Extract sign bit (bit 63)
        sign = bits >> 63

        # Extract combination field (bits 58-62) an clear sign
        combination = (bits >> 58) & 0b11111

        # Check for special values (NaN, Infinity)
        if combination >= 0b11110:
            if combination == 0b11110:
                return (Decimal("Infinity") if sign == 0 else Decimal("-Infinity")), self.size
            else:
                return Decimal("NaN"), self.size

        # Extract exponent information
        if (combination >> 3) == 0b11:  # If bits 62-61 are '11'
            coefficient_bits = 51
            coefficient_implicit_prefix = 0b100
        else:  # All other combination field values
            coefficient_bits = 53
            coefficient_implicit_prefix = 0

        exponent_mask = (1 << 10) - 1  # 10 bits
        exponent = ((bits >> coefficient_bits) & exponent_mask) + self._MIN_EXPONENT

        coefficient_mask = (1 << coefficient_bits) - 1
        coefficient = (coefficient_implicit_prefix << coefficient_bits) | (bits & coefficient_mask)

        return Decimal((sign, self._digits_of(coefficient), exponent)), self.size

    @staticmethod
    def _digits_of(n) -> tuple:
        if n == 0:
            return (0,)

        result = []
        while n > 0:
            n, remainder = divmod(n, 10)
            result.append(remainder)

        return tuple(reversed(result))

    def default_value(self):
        return self.def_value


class EnumConverter(TypeConverter):
    def __init__(self, types: dict[str, MessgenType], type_name: str):
        super().__init__(types, type_name)
        assert self._type_class == TypeClass.enum
        assert isinstance(self._type_def, EnumType)
        self.base_type = self._type_def.base_type
        self.struct_fmt = STRUCT_TYPES_MAP.get(self.base_type, None)
        if self.struct_fmt is None:
            raise RuntimeError('Unsupported base type "%s" in %s' % (self.base_type, type_name))
        self.struct_fmt = "<" + self.struct_fmt
        self.size = struct.calcsize(self.struct_fmt)
        self.mapping = {}
        for item in self._type_def.values:
            self.mapping[item.value] = item.name
        self.rev_mapping = {v: k for k, v in self.mapping.items()}

    def _serialize(self, data):
        if (v := self.rev_mapping.get(data)) is not None:
            return struct.pack(self.struct_fmt, v)
        raise MessgenError(f"Unsupported enum={self._type_name} value={v}")

    def _deserialize(self, data):
        (v,) = struct.unpack(self.struct_fmt, data[: self.size])
        if (mapped := self.mapping.get(v)) is not None:
            return mapped, self.size
        raise MessgenError(f"Unsupported enum={self._type_name} value={v}")

    def default_value(self):
        return self._type_def.values[0].name


class StructConverter(TypeConverter):
    def __init__(self, types: dict[str, MessgenType], type_name: str):
        super().__init__(types, type_name)
        assert self._type_class == TypeClass.struct
        assert isinstance(self._type_def, StructType)
        self.fields = [(field.name, create_type_converter(types, field.type)) for field in self._type_def.fields]

    def _serialize(self, data):
        out = []
        for field_name, field_type in self.fields:
            v = data.get(field_name, None)
            if v is None:
                v = field_type.default_value()
            out.append(field_type._serialize(v))
        return b"".join(out)

    def _deserialize(self, data):
        out = {}
        offset = 0
        for field_name, field_type in self.fields:
            value, size = field_type._deserialize(data[offset:])
            out[field_name] = value
            offset += size
        return out, offset

    def default_value(self):
        return {field_name: field_type.default_value() for field_name, field_type in self.fields}


class ArrayConverter(TypeConverter):
    def __init__(self, types: dict[str, MessgenType], type_name: str):
        super().__init__(types, type_name)
        assert self._type_class == TypeClass.array
        assert isinstance(self._type_def, ArrayType)
        self.element_type = create_type_converter(types, self._type_def.element_type)
        self.array_size = self._type_def.array_size

    def _serialize(self, data):
        out = []
        assert len(data) == self.array_size
        for item in data:
            out.append(self.element_type._serialize(item))
        return b"".join(out)

    def _deserialize(self, data):
        out = []
        offset = 0
        for i in range(self.array_size):
            value, size = self.element_type._deserialize(data[offset:])
            out.append(value)
            offset += size
        return out, offset

    def default_value(self):
        out = []
        for i in range(self.array_size):
            out.append(self.element_type.default_value())
        return out


class VectorConverter(TypeConverter):
    def __init__(self, types: dict[str, MessgenType], type_name: str):
        super().__init__(types, type_name)
        assert self._type_class == TypeClass.vector
        assert isinstance(self._type_def, VectorType)
        self.size_type = create_type_converter(types, "uint32")
        self.element_type = create_type_converter(types, self._type_def.element_type)

    def _serialize(self, data):
        out = []
        out.append(self.size_type._serialize(len(data)))

        for item in data:
            out.append(self.element_type._serialize(item))
        return b"".join(out)

    def _deserialize(self, data):
        out = []
        offset = 0
        n, n_size = self.size_type._deserialize(data[offset:])
        offset += n_size
        for i in range(n):
            value, n = self.element_type._deserialize(data[offset:])
            out.append(value)
            offset += n
        return out, offset

    def default_value(self):
        return []


class MapConverter(TypeConverter):
    def __init__(self, types: dict[str, MessgenType], type_name: str):
        super().__init__(types, type_name)
        assert self._type_class == TypeClass.map
        assert isinstance(self._type_def, MapType)
        self.size_type = create_type_converter(types, "uint32")
        self.key_type = create_type_converter(types, self._type_def.key_type)
        self.value_type = create_type_converter(types, self._type_def.value_type)

    def _serialize(self, data):
        out = []
        out.append(self.size_type._serialize(len(data)))
        for k, v in data.items():
            out.append(self.key_type._serialize(k))
            out.append(self.value_type._serialize(v))
        return b"".join(out)

    def _deserialize(self, data):
        out = {}
        offset = 0
        n, n_size = self.size_type._deserialize(data[offset:])
        offset += n_size
        for i in range(n):
            key, n = self.key_type._deserialize(data[offset:])
            offset += n
            value, n = self.value_type._deserialize(data[offset:])
            offset += n
            out[key] = value
        return out, offset

    def default_value(self):
        return {}


class StringConverter(TypeConverter):
    def __init__(self, types: dict[str, MessgenType], type_name: str):
        super().__init__(types, type_name)
        assert self._type_class == TypeClass.string
        self.size_type = create_type_converter(types, "uint32")
        self.struct_fmt = "<%is"

    def _serialize(self, data):
        return self.size_type._serialize(len(data)) + struct.pack(self.struct_fmt % len(data), data.encode("utf-8"))

    def _deserialize(self, data):
        n, n_size = self.size_type._deserialize(data)
        offset = n_size
        value = struct.unpack(self.struct_fmt % n, data[offset : offset + n])[0]
        offset += n
        return value.decode("utf-8"), offset

    def default_value(self):
        return ""


class BytesConverter(TypeConverter):
    def __init__(self, types: dict[str, MessgenType], type_name: str):
        super().__init__(types, type_name)
        assert self._type_class == TypeClass.bytes
        self.size_type = create_type_converter(types, "uint32")
        self.struct_fmt = "<%is"

    def _serialize(self, data):
        return self.size_type._serialize(len(data)) + struct.pack(self.struct_fmt % len(data), data)

    def _deserialize(self, data):
        n, n_size = self.size_type._deserialize(data)
        offset = n_size
        value = struct.unpack(self.struct_fmt % n, data[offset : offset + n])[0]
        offset += n
        return value, offset

    def default_value(self):
        return b""


class ExternalConverter(TypeConverter):
    def __init__(self, types: dict[str, MessgenType], type_name: str):
        super().__init__(types, type_name)
        assert self._type_class == TypeClass.external

    def _serialize(self, data):
        raise RuntimeError("External types are not implemented yet")

    def _deserialize(self, data):
        raise RuntimeError("External types are not implemented yet")

    def default_value(self):
        raise RuntimeError("External types are not implemented yet")


def create_type_converter(types: dict[str, MessgenType], type_name: str) -> TypeConverter:
    type_def = types[type_name]
    type_class = type_def.type_class
    if type_class == TypeClass.scalar:
        return ScalarConverter(types, type_name)
    elif type_class == TypeClass.decimal:
        return DecimalConverter(types, type_name)
    elif type_class == TypeClass.enum:
        return EnumConverter(types, type_name)
    elif type_class == TypeClass.struct:
        return StructConverter(types, type_name)
    elif type_class == TypeClass.array:
        return ArrayConverter(types, type_name)
    elif type_class == TypeClass.vector:
        return VectorConverter(types, type_name)
    elif type_class == TypeClass.map:
        return MapConverter(types, type_name)
    elif type_class == TypeClass.string:
        return StringConverter(types, type_name)
    elif type_class == TypeClass.bytes:
        return BytesConverter(types, type_name)
    elif type_class == TypeClass.external:
        return ExternalConverter(types, type_name)
    raise RuntimeError('Unsupported field type class "%s" in %s' % (type_class, type_def.type))


class MessageInfo:
    def __init__(self, proto_id: int, proto_name: str, message: Message, type_converter: TypeConverter):
        self._proto_id = proto_id
        self._proto_name = proto_name
        self._message = message
        self._type_converter = type_converter

    def proto_id(self) -> int:
        return self._message.proto_id

    def proto_name(self) -> str:
        return self._proto_name

    def message_id(self) -> int:
        return self._message.message_id

    def message_name(self) -> str:
        return self._message.name

    def message_hash(self) -> int:
        return hash_message(self._message) ^ self._type_converter.type_hash()

    def type_name(self) -> str:
        return self._type_converter.type_name()

    def type_converter(self) -> TypeConverter:
        return self._type_converter


class ProtocolInfo:
    def __init__(self, messages: list[MessageInfo]):
        assert messages

        self._proto_id = next(iter(messages)).proto_id()
        self._proto_name = next(iter(messages)).proto_name()
        self._messages = messages

    def proto_id(self) -> int:
        return self._proto_id

    def proto_name(self) -> str:
        return self._proto_name

    def proto_hash(self) -> int:
        hash = 0
        for msg in self._messages:
            hash ^= msg.message_hash()
        return hash

    def messages(self) -> list[MessageInfo]:
        return self._messages


class Codec:
    def __init__(self) -> None:
        self._converters_by_name: dict[str, TypeConverter] = {}
        self._id_by_name: dict[tuple[str, str], tuple[int, Message]] = {}
        self._name_by_id: dict[tuple[int, int], tuple[str, Message]] = {}

    def load(self, type_dirs: list[str | Path], protocols: list[str] | None = None):
        parsed_types = parse_types(type_dirs)
        if not protocols:
            return

        for type_name in parsed_types:
            self._converters_by_name[type_name] = create_type_converter(parsed_types, type_name)

        parsed_protocols = parse_protocols(protocols)
        for proto_name, proto_def in parsed_protocols.items():
            for msg_id, message in proto_def.messages.items():
                self._id_by_name[(proto_name, message.name)] = (proto_def.proto_id, message)
                self._name_by_id[(proto_def.proto_id, msg_id)] = (proto_name, message)

    def type_converter(self, type_name: str) -> TypeConverter:
        if converter := self._converters_by_name.get(type_name):
            return converter
        raise MessgenError(f"Unsupported type_name={type_name}")

    def protocol_info_by_name(self, proto_name: str) -> ProtocolInfo:
        messages = []
        for p_name, message_name in self._id_by_name.keys():
            if p_name == proto_name:
                messages.append(self.message_info_by_name(proto_name, message_name))

        if not messages:
            raise MessgenError(f"Unsupported proto_name={proto_name}")

        return ProtocolInfo(messages)

    def protocol_info_by_id(self, proto_id: int) -> ProtocolInfo:
        messages = []
        for p_id, msg_id in self._name_by_id.keys():
            if p_id == proto_id:
                messages.append(self.message_info_by_id(proto_id, msg_id))

        if not messages:
            raise MessgenError(f"Unsupported proto_id={proto_id}")

        return ProtocolInfo(messages)

    def message_info_by_id(self, proto_id: int, message_id: int) -> MessageInfo:
        key = (proto_id, message_id)
        if key not in self._name_by_id:
            raise MessgenError(f"Unsupported proto_id={proto_id} message_id={message_id}")

        proto_name, message = self._name_by_id[key]
        return MessageInfo(proto_id, proto_name, message, self._converters_by_name[message.type])

    def message_info_by_name(self, proto_name: str, message_name: str) -> MessageInfo:
        key = (proto_name, message_name)
        if key not in self._id_by_name:
            raise MessgenError(f"Unsupported proto_name={proto_name} message_name={message_name}")

        proto_id, message = self._id_by_name[key]
        return MessageInfo(proto_id, proto_name, message, self._converters_by_name[message.type])
