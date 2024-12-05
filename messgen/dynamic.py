import struct

from pathlib import Path

from .model import (
    MessgenType,
    TypeClass,
)
from .yaml_parser import (
    parse_protocols,
    parse_types
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


class MessgenError(Exception):
    pass


class Converter:
    def __init__(self, types: dict[str, MessgenType], type_name: str):
        self.type_name = type_name
        self.type_def = types[type_name]
        self.type_class = self.type_def.type_class


class ScalarConverter(Converter):
    def __init__(self, types: dict[str, MessgenType], type_name:str):
        super().__init__(types, type_name)
        assert self.type_class == TypeClass.scalar
        self.struct_fmt = STRUCT_TYPES_MAP.get(type_name)
        if self.struct_fmt is None:
            raise RuntimeError("Unsupported scalar type \"%s\"" % self.type_name)
        self.struct_fmt = "<" + self.struct_fmt
        self.size = struct.calcsize(self.struct_fmt)
        self.def_value = 0
        if self.type_name == "bool":
            self.def_value = False
        elif self.type_name == "float32" or self.type_name == "float64":
            self.def_value = 0.0

    def serialize(self, data):
        return struct.pack(self.struct_fmt, data)

    def deserialize(self, data):
        return struct.unpack(self.struct_fmt, data[:self.size])[0], self.size

    def default_value(self):
        return self.def_value


class EnumConverter(Converter):
    def __init__(self, types: dict[str, MessgenType], type_name:str):
        super().__init__(types, type_name)
        assert self.type_class == TypeClass.enum
        self.base_type = self.type_def.base_type
        self.struct_fmt = STRUCT_TYPES_MAP.get(self.base_type, None)
        if self.struct_fmt is None:
            raise RuntimeError("Unsupported base type \"%s\" in %s" % (self.base_type, self.type_name))
        self.struct_fmt = "<" + self.struct_fmt
        self.size = struct.calcsize(self.struct_fmt)
        self.mapping = {}
        for item in self.type_def.values:
            self.mapping[item.value] = item.name
        self.rev_mapping = {v: k for k, v in self.mapping.items()}

    def serialize(self, data):
        v = self.rev_mapping[data]
        return struct.pack(self.struct_fmt, v)

    def deserialize(self, data):
        v, = struct.unpack(self.struct_fmt, data[:self.size])
        return self.mapping[v], self.size

    def default_value(self):
        return self.type_def.values[0].name


class StructConverter(Converter):
    def __init__(self, types: dict[str, MessgenType], type_name:str):
        super().__init__(types, type_name)
        assert self.type_class == TypeClass.struct
        self.fields = [(field.name, get_type(types, field.type))
                       for field in self.type_def.fields]

    def serialize(self, data):
        out = []
        for field_name, field_type in self.fields:
            v = data.get(field_name, None)
            if v is None:
                v = field_type.default_value()
            out.append(field_type.serialize(v))
        return b"".join(out)

    def deserialize(self, data):
        out = {}
        offset = 0
        for field_name, field_type in self.fields:
            value, size = field_type.deserialize(data[offset:])
            out[field_name] = value
            offset += size
        return out, offset

    def default_value(self):
        return {field_name : field_type.default_value()
                for field_name, field_type in self.fields}


class ArrayConverter(Converter):
    def __init__(self, types: dict[str, MessgenType], type_name:str):
        super().__init__(types, type_name)
        assert self.type_class == TypeClass.array
        self.element_type = get_type(types, self.type_def.element_type)
        self.array_size = self.type_def.array_size

    def serialize(self, data):
        out = []
        assert len(data) == self.array_size
        for item in data:
            out.append(self.element_type.serialize(item))
        return b"".join(out)

    def deserialize(self, data):
        out = []
        offset = 0
        for i in range(self.array_size):
            value, size = self.element_type.deserialize(data[offset:])
            out.append(value)
            offset += size
        return out, offset

    def default_value(self):
        out = []
        for i in range(self.array_size):
            out.append(self.element_type.default_value())
        return out


class VectorConverter(Converter):
    def __init__(self, types: dict[str, MessgenType], type_name: str):
        super().__init__(types, type_name)
        assert self.type_class == TypeClass.vector
        self.size_type = get_type(types, "uint32")
        self.element_type = get_type(types, self.type_def.element_type)

    def serialize(self, data):
        out = []
        out.append(self.size_type.serialize(len(data)))

        for item in data:
            out.append(self.element_type.serialize(item))
        return b"".join(out)

    def deserialize(self, data):
        out = []
        offset = 0
        n, n_size = self.size_type.deserialize(data[offset:])
        offset += n_size
        for i in range(n):
            value, n = self.element_type.deserialize(data[offset:])
            out.append(value)
            offset += n
        return out, offset

    def default_value(self):
        return []


class MapConverter(Converter):
    def __init__(self, types: dict[str, MessgenType], type_name:str):
        super().__init__(types, type_name)
        assert self.type_class == TypeClass.map
        self.size_type = get_type(types, "uint32")
        self.key_type = get_type(types, self.type_def.key_type)
        self.value_type = get_type(types, self.type_def.value_type)

    def serialize(self, data):
        out = []
        out.append(self.size_type.serialize(len(data)))
        for k, v in data.items():
            out.append(self.key_type.serialize(k))
            out.append(self.value_type.serialize(v))
        return b"".join(out)

    def deserialize(self, data):
        out = {}
        offset = 0
        n, n_size = self.size_type.deserialize(data[offset:])
        offset += n_size
        for i in range(n):
            key, n = self.key_type.deserialize(data[offset:])
            offset += n
            value, n = self.value_type.deserialize(data[offset:])
            offset += n
            out[key] = value
        return out, offset

    def default_value(self):
        return {}


class StringConverter(Converter):
    def __init__(self, types: dict[str, MessgenType], type_name:str):
        super().__init__(types, type_name)
        assert self.type_class == TypeClass.string
        self.size_type = get_type(types, "uint32")
        self.struct_fmt = "<%is"

    def serialize(self, data):
        return self.size_type.serialize(len(data)) + struct.pack(self.struct_fmt % len(data), data.encode("utf-8"))

    def deserialize(self, data):
        n, n_size = self.size_type.deserialize(data)
        offset = n_size
        value = struct.unpack(self.struct_fmt % n, data[offset:offset + n])[0]
        offset += n
        return value.decode("utf-8"), offset

    def default_value(self):
        return ""


class BytesConverter(Converter):
    def __init__(self, types: dict[str, MessgenType], type_name:str):
        super().__init__(types, type_name)
        assert self.type_class == TypeClass.bytes
        self.size_type = get_type(types, "uint32")
        self.struct_fmt = "<%is"

    def serialize(self, data):
        return self.size_type.serialize(len(data)) + struct.pack(self.struct_fmt % len(data), data)

    def deserialize(self, data):
        n, n_size = self.size_type.deserialize(data)
        offset = n_size
        value = struct.unpack(self.struct_fmt % n, data[offset:offset + n])[0]
        offset += n
        return value, offset

    def default_value(self):
        return b""

def get_type(types: dict[str, MessgenType], type_name:str) -> Converter:
    type_def = types[type_name]
    type_class = type_def.type_class
    if type_class == TypeClass.scalar:
        t = ScalarConverter(types, type_name)
    elif type_class == TypeClass.enum:
        t = EnumConverter(types, type_name)
    elif type_class == TypeClass.struct:
        t = StructConverter(types, type_name)
    elif type_class == TypeClass.array:
        t = ArrayConverter(types, type_name)
    elif type_class == TypeClass.vector:
        t = VectorConverter(types, type_name)
    elif type_class == TypeClass.map:
        t = MapConverter(types, type_name)
    elif type_class == TypeClass.string:
        t = StringConverter(types, type_name)
    elif type_class == TypeClass.bytes:
        t = BytesConverter(types, type_name)
    else:
        raise RuntimeError("Unsupported field type class \"%s\" in %s" % (type_class, type_def.type))
    return t


class Codec:
    def __init__(self):
        self.types_by_name = {}
        self.types_by_id = {}

    def load(self, type_dirs: list[str | Path], protocol_dirs: list[str | Path], protocols: list[str] = None):
        parsed_types = parse_types(type_dirs)
        parsed_protocols = parse_protocols(protocol_dirs, protocols)

        for proto_name, proto_def in parsed_protocols.items():
            by_name = (proto_def.proto_id, {})
            by_id = (proto_name, {})
            for type_id, type_name in proto_def.types.items():
                t = get_type(parsed_types, type_name)
                by_name[1][type_name] = t
                if type_id is not None:
                    by_id[1][type_id] = t
            self.types_by_name[proto_name] = by_name
            self.types_by_id[proto_def.proto_id] = by_id

    def get_type_by_name(self, proto_name: str, type_name: str):
        return self.types_by_name[proto_name][1][type_name]

    def serialize(self, proto_name: str, msg_name: str, msg: dict) -> tuple[int, int, bytes]:
        p = self.types_by_name.get(proto_name)
        if p is None:
            raise MessgenError("Unsupported proto_name in serialization: proto_name=%s" % proto_name)
        t = p[1].get(msg_name)
        if t is None:
            raise MessgenError(
                "Unsupported msg_name in serialization: proto_name=%s msg_name=%s" % (proto_name, msg_name))
        payload = t.serialize(msg)
        return p[0], t.id, payload

    def deserialize(self, proto_id: int, msg_id: int, data: bytes) -> tuple[str, str, dict, int]:
        p = self.types_by_id.get(proto_id)
        if p is None:
            raise MessgenError("Unsupported proto_id in deserialization: proto_id=%s" % proto_id)
        t = p[1].get(msg_id)
        if t is None:
            raise MessgenError("Unsupported msg_id in deserialization: proto_id=%s msg_id=%s" % (proto_id, msg_id))
        msg, sz = t.deserialize(data)
        if sz != len(data):
            raise MessgenError(
                "Invalid message size: expected=%s actual=%s proto_id=%s msg_id=%s" % (sz, len(data), proto_id, msg_id))
        return p[0], t.type_name, msg
