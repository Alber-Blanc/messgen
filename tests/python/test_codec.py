import pytest

from pathlib import Path

from decimal import (
    Decimal,
)

from messgen.model import (
    BasicType,
    DecimalType,
    EnumValue,
    TypeClass,
)
from messgen.dynamic import (
    Codec,
    DecimalConverter,
    MessgenError,
    ScalarConverter,
)


path_root = Path(__file__).parents[2]


@pytest.fixture
def codec():
    codec_ = Codec()
    codec_.load(
        type_dirs=[path_root / "tests/data/types", path_root / "tests/data/types_decimal"],
        protocols=[f"{path_root}/tests/data/protocols:test_proto"],
    )
    yield codec_


@pytest.fixture
def simple_struct():
    return {
        "f0": 0x1234567890ABCDEF,
        "f2": 1.2345678901234567890,
        "f3": 0x12345678,
        "f5": 1.2345678901234567890,
        "f6": 0x1234,
        "f7": 0x12,
        "f8": -0x12,
        "f9": True,
    }


def test_simple_struct_serialization(codec, simple_struct):
    type_def = codec.type_converter("messgen/test/simple_struct")
    expected_msg = simple_struct
    expected_bytes = type_def.serialize(expected_msg)
    assert expected_bytes

    actual_msg = type_def.deserialize(expected_bytes)
    for key in expected_msg:
        assert actual_msg[key] == pytest.approx(expected_msg[key])


def test_var_size_struct_serialization(codec):
    type_def = codec.type_converter("messgen/test/var_size_struct")
    expected_msg = {
        "f0": 0x1234567890ABCDEF,
        "f1_vec": [-0x1234567890ABCDEF, 5, 1],
        "str": "Hello messgen!",
    }

    expected_bytes = type_def.serialize(expected_msg)
    assert expected_bytes

    actual_msg = type_def.deserialize(expected_bytes)
    assert actual_msg == expected_msg


def test_struct_with_decimal_serialization(codec):
    type_def = codec.type_converter("messgen/test/flat_struct_with_decimal")
    expected_msg = {
        "int_field": 12345,
        "dec_field": Decimal("1234.22e-4"),
        "float_field": 123.456,
    }

    expected_bytes = type_def.serialize(expected_msg)
    assert expected_bytes

    actual_msg = type_def.deserialize(expected_bytes)
    assert actual_msg == expected_msg


def test_protocol_deserialization(codec, simple_struct):
    message_info_by_name = codec.message_info_by_name(
        proto_name="test_proto",
        message_name="simple_struct_msg",
    )
    expected_bytes = message_info_by_name.type_converter().serialize(simple_struct)
    assert expected_bytes

    message_info_by_id = codec.message_info_by_id(
        proto_id=message_info_by_name.proto_id(),
        message_id=message_info_by_name.message_id(),
    )
    actual_msg = message_info_by_id.type_converter().deserialize(expected_bytes)

    assert message_info_by_name.proto_id() == 1
    assert message_info_by_name.message_id() == 0
    assert message_info_by_name.proto_name() == "test_proto"
    assert message_info_by_name.message_name() == "simple_struct_msg"
    assert message_info_by_name.type_name() == "messgen/test/simple_struct"

    assert message_info_by_name.proto_id() == message_info_by_id.proto_id()
    assert message_info_by_name.message_id() == message_info_by_id.message_id()
    assert message_info_by_name.proto_name() == message_info_by_id.proto_name()
    assert message_info_by_name.message_name() == message_info_by_id.message_name()
    assert message_info_by_name.type_name() == message_info_by_id.type_name()

    for key in simple_struct:
        assert actual_msg[key] == pytest.approx(simple_struct[key])


def test_protocol_info(codec):
    protocol_by_name = codec.protocol_info_by_name("test_proto")
    assert len(protocol_by_name.messages()) == 8
    assert protocol_by_name.proto_name() == "test_proto"
    assert protocol_by_name.proto_id() == 1
    assert protocol_by_name.proto_hash() == (
        codec.message_info_by_name(proto_name="test_proto", message_name="simple_struct_msg").message_hash()
        ^ codec.message_info_by_name(proto_name="test_proto", message_name="complex_struct_msg").message_hash()
        ^ codec.message_info_by_name(proto_name="test_proto", message_name="var_size_struct_msg").message_hash()
        ^ codec.message_info_by_name(proto_name="test_proto", message_name="struct_with_enum_msg").message_hash()
        ^ codec.message_info_by_name(proto_name="test_proto", message_name="empty_struct_msg").message_hash()
        ^ codec.message_info_by_name(proto_name="test_proto", message_name="complex_struct_with_empty_msg").message_hash()
        ^ codec.message_info_by_name(proto_name="test_proto", message_name="complex_struct_nostl_msg").message_hash()
        ^ codec.message_info_by_name(proto_name="test_proto", message_name="flat_struct_msg").message_hash()
    )

    protocol_by_id = codec.protocol_info_by_name("test_proto")
    assert protocol_by_id.proto_name() == protocol_by_name.proto_name()
    assert protocol_by_id.proto_id() == protocol_by_name.proto_id()
    assert protocol_by_id.proto_hash() == protocol_by_name.proto_hash()
    assert protocol_by_id.proto_hash() == 5639281651251954308


def test_decimal_decoding():
    dec64_type = DecimalType(type="dec64", type_class=TypeClass.decimal, size=8)
    converter = DecimalConverter({"dec64": dec64_type}, "dec64")

    # Basic Values
    assert converter.deserialize(0x308462D53C8ABAC0.to_bytes(8, byteorder="little")) == Decimal("123456.7890123456")
    assert converter.deserialize(0x31C0000000000001.to_bytes(8, byteorder="little")) == Decimal("1")
    assert converter.deserialize(0x31C000000000007B.to_bytes(8, byteorder="little")) == Decimal("123")
    assert converter.deserialize(0x318000000000007B.to_bytes(8, byteorder="little")) == Decimal("1.23")
    assert converter.deserialize(0x320000000000007B.to_bytes(8, byteorder="little")) == Decimal("12300")
    assert converter.deserialize(0xB1C000000000007B.to_bytes(8, byteorder="little")) == Decimal("-123")
    assert converter.deserialize(0xB1A000000000007B.to_bytes(8, byteorder="little")) == Decimal("-12.3")

    # Zero Values
    assert converter.deserialize(0x31C0000000000000.to_bytes(8, byteorder="little")) == Decimal("0")
    assert converter.deserialize(0x3E40000000000000.to_bytes(8, byteorder="little")) == Decimal("0e+100")
    assert converter.deserialize(0x2540000000000000.to_bytes(8, byteorder="little")) == Decimal("0e-100")

    # Precision Edge Cases
    assert converter.deserialize(0x31C000000098967F.to_bytes(8, byteorder="little")) == Decimal("9999999")
    assert converter.deserialize(0x2E40000000000001.to_bytes(8, byteorder="little")) == Decimal("1e-28")
    assert converter.deserialize(0x3540000000000009.to_bytes(8, byteorder="little")) == Decimal("9e+28")
    assert converter.deserialize(0x2FE38D7EA4C67FFF.to_bytes(8, byteorder="little")) == Decimal("999999999999999e-15")

    # Rounding Cases
    assert converter.deserialize(0x31A0000000000005.to_bytes(8, byteorder="little")) == Decimal("0.5")
    assert converter.deserialize(0x318000000000000F.to_bytes(8, byteorder="little")) == Decimal("0.15")
    assert converter.deserialize(0x316000000000007D.to_bytes(8, byteorder="little")) == Decimal("0.125")
    assert converter.deserialize(0x316000000000007E.to_bytes(8, byteorder="little")) == Decimal("0.126")

    # Operation Testing Values
    assert converter.deserialize(0x3D0000000098967F.to_bytes(8, byteorder="little")) == Decimal("9999999e+90")
    assert converter.deserialize(0x256000000098967F.to_bytes(8, byteorder="little")) == Decimal("9999999e-99")
    assert converter.deserialize(0x31A0000000000005.to_bytes(8, byteorder="little")) == Decimal("5e-1")
    assert converter.deserialize(0x3100000000000001.to_bytes(8, byteorder="little")) == Decimal("1e-6")

    # Boundary Cases
    assert converter.deserialize(0x6C7386F26FC0FFFF.to_bytes(8, byteorder="little")) == Decimal("9999999999999999e0")
    assert converter.deserialize(0x7800000000000000.to_bytes(8, byteorder="little")) == Decimal("Infinity")
    assert converter.deserialize(0x607B86F26FC0FFFF.to_bytes(8, byteorder="little")) == Decimal("9999999999999999e-383")
    assert converter.deserialize(0x0000000000000000.to_bytes(8, byteorder="little")) == Decimal("0")
    assert converter.deserialize(0x5FE05AF3107A4000.to_bytes(8, byteorder="little")) == Decimal("1e+383")
    assert converter.deserialize(0x5FE38D7EA4C68000.to_bytes(8, byteorder="little")) == Decimal("1e+384")

    # Special Values
    assert converter.deserialize(0x7800000000000000.to_bytes(8, byteorder="little")) == Decimal("Infinity")
    assert converter.deserialize(0xF800000000000000.to_bytes(8, byteorder="little")) == Decimal("-Infinity")
    assert converter.deserialize(0x0000000000000000.to_bytes(8, byteorder="little")) == Decimal("0e-999")
    assert converter.deserialize(0x7C00000000000000.to_bytes(8, byteorder="little")).is_nan() == Decimal("NaN").is_nan()


def test_decimal_encoding():
    dec64_type = DecimalType(type="dec64", type_class=TypeClass.decimal, size=8)
    converter = DecimalConverter({"dec64": dec64_type}, "dec64")

    # Basic Values
    assert 0x308462D53C8ABAC0 == int.from_bytes(converter.serialize(Decimal("123456.7890123456")), byteorder="little")
    assert 0x31C0000000000001 == int.from_bytes(converter.serialize(Decimal("1")), byteorder="little")
    assert 0x31C000000000007B == int.from_bytes(converter.serialize(Decimal("123")), byteorder="little")
    assert 0x318000000000007B == int.from_bytes(converter.serialize(Decimal("1.23")), byteorder="little")
    assert 0x320000000000007B == int.from_bytes(converter.serialize(Decimal("12300")), byteorder="little")
    assert 0xB1C000000000007B == int.from_bytes(converter.serialize(Decimal("-123")), byteorder="little")
    assert 0xB1A000000000007B == int.from_bytes(converter.serialize(Decimal("-12.3")), byteorder="little")

    # Zero Values
    assert 0x31C0000000000000 == int.from_bytes(converter.serialize(Decimal("0")), byteorder="little")
    assert 0x3E40000000000000 == int.from_bytes(converter.serialize(Decimal("0e+100")), byteorder="little")
    assert 0x2540000000000000 == int.from_bytes(converter.serialize(Decimal("0e-100")), byteorder="little")

    # Precision Edge Cases
    assert 0x31C000000098967F == int.from_bytes(converter.serialize(Decimal("9999999")), byteorder="little")
    assert 0x2E40000000000001 == int.from_bytes(converter.serialize(Decimal("1e-28")), byteorder="little")
    assert 0x3540000000000009 == int.from_bytes(converter.serialize(Decimal("9e+28")), byteorder="little")
    assert 0x2FE38D7EA4C67FFF == int.from_bytes(converter.serialize(Decimal("999999999999999e-15")), byteorder="little")

    # Rounding Cases
    assert 0x31A0000000000005 == int.from_bytes(converter.serialize(Decimal("5e-1")), byteorder="little")
    assert 0x318000000000000F == int.from_bytes(converter.serialize(Decimal("15e-2")), byteorder="little")
    assert 0x316000000000007D == int.from_bytes(converter.serialize(Decimal("125e-3")), byteorder="little")
    assert 0x316000000000007E == int.from_bytes(converter.serialize(Decimal("126e-3")), byteorder="little")

    # Operation Testing Values
    assert 0x3D0000000098967F == int.from_bytes(converter.serialize(Decimal("9999999e90")), byteorder="little")
    assert 0x256000000098967F == int.from_bytes(converter.serialize(Decimal("9999999e-99")), byteorder="little")
    assert 0x31A0000000000005 == int.from_bytes(converter.serialize(Decimal("5e-1")), byteorder="little")
    assert 0x3100000000000001 == int.from_bytes(converter.serialize(Decimal("1e-6")), byteorder="little")

    # Boundary Cases
    assert 0x6C7386F26FC0FFFF == int.from_bytes(converter.serialize(Decimal("9999999999999999")), byteorder="little")
    assert 0x77FB86F26FC0FFFF == int.from_bytes(converter.serialize(Decimal("9999999999999999e369")), byteorder="little")
    assert 0x7800000000000000 == int.from_bytes(converter.serialize(Decimal("999999999999999999e369")), byteorder="little")
    assert 0x7800000000000000 == int.from_bytes(converter.serialize(Decimal("9999999999999999e370")), byteorder="little")
    assert 0xF800000000000000 == int.from_bytes(converter.serialize(Decimal("-9999999999999999e370")), byteorder="little")
    assert 0x607B86F26FC0FFFF == int.from_bytes(converter.serialize(Decimal("9999999999999999e-383")), byteorder="little")
    assert 0x600386F26FC0FFFF == int.from_bytes(converter.serialize(Decimal("9999999999999999e-398")), byteorder="little")
    assert 0xE00386F26FC0FFFF == int.from_bytes(converter.serialize(Decimal("-9999999999999999e-398")), byteorder="little")
    assert 0x0000000000000000 == int.from_bytes(converter.serialize(Decimal("9999999999999999e-399")), byteorder="little")
    assert 0x8000000000000000 == int.from_bytes(converter.serialize(Decimal("-9999999999999999e-399")), byteorder="little")
    assert 0x5FE05AF3107A4000 == int.from_bytes(converter.serialize(Decimal("1e+383")), byteorder="little")
    assert 0x5FE38D7EA4C68000 == int.from_bytes(converter.serialize(Decimal("1e+384")), byteorder="little")

    # Special Values
    assert 0x7800000000000000 == int.from_bytes(converter.serialize(Decimal("1e999")), byteorder="little")
    assert 0xF800000000000000 == int.from_bytes(converter.serialize(Decimal("-1e999")), byteorder="little")
    assert 0x0000000000000000 == int.from_bytes(converter.serialize(Decimal("0e-999")), byteorder="little")
    assert 0x7C00000000000000 == int.from_bytes(converter.serialize(Decimal("NaN")), byteorder="little")

    with pytest.raises(MessgenError):
        converter.serialize(123)


def test_type_definition(codec):
    type_def = codec.type_definition("messgen/test/simple_struct")
    assert type_def.type == "messgen/test/simple_struct"
    assert type_def.type_class == TypeClass.struct

    type_def = codec.type_definition("messgen/test/var_size_struct")
    assert type_def.type == "messgen/test/var_size_struct"
    assert type_def.type_class == TypeClass.struct

    type_def = codec.type_definition("dec64")
    assert type_def.type == "dec64"
    assert type_def.type_class == TypeClass.decimal
    assert type_def.size == 8

    with pytest.raises(MessgenError):
        codec.type_definition("non_existent_type")


def test_enum_type_definition(codec):
    type_def = codec.type_definition("messgen/test/simple_enum")
    assert type_def.type == "messgen/test/simple_enum"
    assert type_def.type_class == TypeClass.enum
    assert type_def.base_type == "uint8"

    assert len(type_def.values) > 0

    expected_values = [
        (0, "one_value"),
        (1, "another_value"),
    ]
    for value, name in expected_values:
        assert any(item.name == name for item in type_def.values)
        assert any(item.value == value for item in type_def.values)


def test_bitset_type_definition(codec):
    type_def = codec.type_definition("messgen/test/simple_bitset")
    assert type_def.type == "messgen/test/simple_bitset"
    assert type_def.type_class == TypeClass.bitset
    assert type_def.base_type == "uint8"

    assert len(type_def.bits) > 0

    expected_bits = [
        (0, "one"),
        (1, "two"),
        (2, "error"),
    ]
    for offs, name in expected_bits:
        assert any(item.name == name for item in type_def.bits)
        assert any(item.offset == offs for item in type_def.bits)


def test_enum_converter_serialization(codec):
    type_converter = codec.type_converter("messgen/test/simple_enum")

    serialized_val1 = type_converter.serialize("one_value")
    assert serialized_val1 == (0).to_bytes()

    serialized_val2 = type_converter.serialize("another_value")
    assert serialized_val2 == (1).to_bytes()

    assert type_converter.deserialize((0).to_bytes()) == "one_value"
    assert type_converter.deserialize((1).to_bytes()) == "another_value"

    with pytest.raises(MessgenError):
        type_converter.serialize("NON_EXISTENT_VALUE")


def test_struct_with_enum_serialization(codec):
    type_converter = codec.type_converter("messgen/test/struct_with_enum")

    message = {
        "e0": "another_value",
        "f1": 42,
    }

    serialized = type_converter.serialize(message)
    deserialized = type_converter.deserialize(serialized)

    assert deserialized["e0"] == message["e0"]
    assert deserialized["f1"] == message["f1"]


def test_type_converter_type_info(codec):
    struct_converter = codec.type_converter("messgen/test/simple_struct")

    assert struct_converter.type_name() == "messgen/test/simple_struct"
    assert struct_converter.type_hash() > 0
    assert struct_converter.type_definition().type_class == TypeClass.struct

    enum_converter = codec.type_converter("messgen/test/simple_enum")
    assert enum_converter.type_name() == "messgen/test/simple_enum"
    assert enum_converter.type_hash() > 0
    assert enum_converter.type_definition().type_class == TypeClass.enum

    assert struct_converter.type_hash() != enum_converter.type_hash()


def test_codec_types(codec):
    types = codec.types()

    assert isinstance(types, list)
    assert types == sorted(types)

    expected_types = [
        "bool",
        "bytes",
        "dec64",
        "float32",
        "float64",
        "int16",
        "int32",
        "int64",
        "int8",
        "messgen/test/complex_struct_nostl",
        "messgen/test/complex_struct_with_empty",
        "messgen/test/complex_struct",
        "messgen/test/empty_struct",
        "messgen/test/flat_struct_with_decimal",
        "messgen/test/flat_struct",
        "messgen/test/simple_enum",
        "messgen/test/simple_struct",
        "messgen/test/struct_with_enum",
        "messgen/test/var_size_struct",
        "string",
        "uint16",
        "uint32",
        "uint64",
        "uint8",
    ]

    for expected_type in expected_types:
        assert expected_type in types


def test_codec_protocols(codec):
    protocols = codec.protocols()

    assert isinstance(protocols, list)
    assert protocols == sorted(protocols)

    expected_protocols = ["test_proto"]
    assert protocols == expected_protocols


def test_codec_empty():
    # Test empty codec (no types or protocols loaded)
    empty_codec = Codec()

    assert empty_codec.types() == []
    assert empty_codec.protocols() == []

def test_var_size_string_serialization(codec):
    type_def = codec.type_converter("messgen/test/var_size_struct")
    expected_msg = {
        "f0": 0x0,
        "f1_vec": [],
        "str": "连接查询服务失败",
    }

    expected_bytes = type_def.serialize(expected_msg)
    assert expected_bytes

    actual_msg = type_def.deserialize(expected_bytes)
    assert actual_msg == expected_msg