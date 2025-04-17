import sys
import pytest

from pathlib import Path

from decimal import (
    Decimal,
)

from messgen.model import (
    TypeClass,
    DecimalType,
)
from messgen.dynamic import (
    Codec,
    DecimalConverter,
    MessgenError,
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
    assert protocol_by_id.proto_hash() == 15505688617215257648


def test_decimal_decoding():
    dec64_type = DecimalType(type="dec64", type_class=TypeClass.decimal, size=8)
    converter = DecimalConverter({"dec64": dec64_type}, "dec64")

    # Basic Values
    assert converter.deserialize(0x308462D53C8ABAC0.to_bytes(8, sys.byteorder)) == Decimal("123456.7890123456")
    assert converter.deserialize(0x31C0000000000001.to_bytes(8, sys.byteorder)) == Decimal("1")
    assert converter.deserialize(0x31C000000000007B.to_bytes(8, sys.byteorder)) == Decimal("123")
    assert converter.deserialize(0x318000000000007B.to_bytes(8, sys.byteorder)) == Decimal("1.23")
    assert converter.deserialize(0x320000000000007B.to_bytes(8, sys.byteorder)) == Decimal("12300")
    assert converter.deserialize(0xB1C000000000007B.to_bytes(8, sys.byteorder)) == Decimal("-123")
    assert converter.deserialize(0xB1A000000000007B.to_bytes(8, sys.byteorder)) == Decimal("-12.3")

    # Zero Values
    assert converter.deserialize(0x31C0000000000000.to_bytes(8, sys.byteorder)) == Decimal("0")
    assert converter.deserialize(0x3E40000000000000.to_bytes(8, sys.byteorder)) == Decimal("0e+100")
    assert converter.deserialize(0x2540000000000000.to_bytes(8, sys.byteorder)) == Decimal("0e-100")

    # Precision Edge Cases
    assert converter.deserialize(0x31C000000098967F.to_bytes(8, sys.byteorder)) == Decimal("9999999")
    assert converter.deserialize(0x2E40000000000001.to_bytes(8, sys.byteorder)) == Decimal("1e-28")
    assert converter.deserialize(0x3540000000000009.to_bytes(8, sys.byteorder)) == Decimal("9e+28")
    assert converter.deserialize(0x2FE38D7EA4C67FFF.to_bytes(8, sys.byteorder)) == Decimal("999999999999999e-15")

    # Rounding Cases
    assert converter.deserialize(0x31A0000000000005.to_bytes(8, sys.byteorder)) == Decimal("0.5")
    assert converter.deserialize(0x318000000000000F.to_bytes(8, sys.byteorder)) == Decimal("0.15")
    assert converter.deserialize(0x316000000000007D.to_bytes(8, sys.byteorder)) == Decimal("0.125")
    assert converter.deserialize(0x316000000000007E.to_bytes(8, sys.byteorder)) == Decimal("0.126")

    # Operation Testing Values
    assert converter.deserialize(0x3D0000000098967F.to_bytes(8, sys.byteorder)) == Decimal("9999999e+90")
    assert converter.deserialize(0x256000000098967F.to_bytes(8, sys.byteorder)) == Decimal("9999999e-99")
    assert converter.deserialize(0x31A0000000000005.to_bytes(8, sys.byteorder)) == Decimal("5e-1")
    assert converter.deserialize(0x3100000000000001.to_bytes(8, sys.byteorder)) == Decimal("1e-6")

    # Boundary Cases
    assert converter.deserialize(0x6C7386F26FC0FFFF.to_bytes(8, sys.byteorder)) == Decimal("9999999999999999e0")
    assert converter.deserialize(0x7800000000000000.to_bytes(8, sys.byteorder)) == Decimal("Infinity")
    assert converter.deserialize(0x607B86F26FC0FFFF.to_bytes(8, sys.byteorder)) == Decimal("9999999999999999e-383")
    assert converter.deserialize(0x0000000000000000.to_bytes(8, sys.byteorder)) == Decimal("0")
    assert converter.deserialize(0x5FE05AF3107A4000.to_bytes(8, sys.byteorder)) == Decimal("1e+383")
    assert converter.deserialize(0x5FE38D7EA4C68000.to_bytes(8, sys.byteorder)) == Decimal("1e+384")

    # Special Values
    assert converter.deserialize(0x7800000000000000.to_bytes(8, sys.byteorder)) == Decimal("Infinity")
    assert converter.deserialize(0xF800000000000000.to_bytes(8, sys.byteorder)) == Decimal("-Infinity")
    assert converter.deserialize(0x0000000000000000.to_bytes(8, sys.byteorder)) == Decimal("0e-999")
    assert converter.deserialize(0x7C00000000000000.to_bytes(8, sys.byteorder)).is_nan() == Decimal("NaN").is_nan()


def test_decimal_encoding():
    dec64_type = DecimalType(type="dec64", type_class=TypeClass.decimal, size=8)
    converter = DecimalConverter({"dec64": dec64_type}, "dec64")

    # Basic Values
    assert 0x308462D53C8ABAC0 == int.from_bytes(converter.serialize(Decimal("123456.7890123456")), sys.byteorder)
    assert 0x31C0000000000001 == int.from_bytes(converter.serialize(Decimal("1")), sys.byteorder)
    assert 0x31C000000000007B == int.from_bytes(converter.serialize(Decimal("123")), sys.byteorder)
    assert 0x318000000000007B == int.from_bytes(converter.serialize(Decimal("1.23")), sys.byteorder)
    assert 0x320000000000007B == int.from_bytes(converter.serialize(Decimal("12300")), sys.byteorder)
    assert 0xB1C000000000007B == int.from_bytes(converter.serialize(Decimal("-123")), sys.byteorder)
    assert 0xB1A000000000007B == int.from_bytes(converter.serialize(Decimal("-12.3")), sys.byteorder)

    # Zero Values
    assert 0x31C0000000000000 == int.from_bytes(converter.serialize(Decimal("0")), sys.byteorder)
    assert 0x3E40000000000000 == int.from_bytes(converter.serialize(Decimal("0e+100")), sys.byteorder)
    assert 0x2540000000000000 == int.from_bytes(converter.serialize(Decimal("0e-100")), sys.byteorder)

    # Precision Edge Cases
    assert 0x31C000000098967F == int.from_bytes(converter.serialize(Decimal("9999999")), sys.byteorder)
    assert 0x2E40000000000001 == int.from_bytes(converter.serialize(Decimal("1e-28")), sys.byteorder)
    assert 0x3540000000000009 == int.from_bytes(converter.serialize(Decimal("9e+28")), sys.byteorder)
    assert 0x2FE38D7EA4C67FFF == int.from_bytes(converter.serialize(Decimal("999999999999999e-15")), sys.byteorder)

    # Rounding Cases
    assert 0x31A0000000000005 == int.from_bytes(converter.serialize(Decimal("5e-1")), sys.byteorder)
    assert 0x318000000000000F == int.from_bytes(converter.serialize(Decimal("15e-2")), sys.byteorder)
    assert 0x316000000000007D == int.from_bytes(converter.serialize(Decimal("125e-3")), sys.byteorder)
    assert 0x316000000000007E == int.from_bytes(converter.serialize(Decimal("126e-3")), sys.byteorder)

    # Operation Testing Values
    assert 0x3D0000000098967F == int.from_bytes(converter.serialize(Decimal("9999999e90")), sys.byteorder)
    assert 0x256000000098967F == int.from_bytes(converter.serialize(Decimal("9999999e-99")), sys.byteorder)
    assert 0x31A0000000000005 == int.from_bytes(converter.serialize(Decimal("5e-1")), sys.byteorder)
    assert 0x3100000000000001 == int.from_bytes(converter.serialize(Decimal("1e-6")), sys.byteorder)

    # Boundary Cases
    assert 0x6C7386F26FC0FFFF == int.from_bytes(converter.serialize(Decimal("9999999999999999")), sys.byteorder)
    assert 0x77FB86F26FC0FFFF == int.from_bytes(converter.serialize(Decimal("9999999999999999e369")), sys.byteorder)
    assert 0x7800000000000000 == int.from_bytes(converter.serialize(Decimal("999999999999999999e369")), sys.byteorder)
    assert 0x7800000000000000 == int.from_bytes(converter.serialize(Decimal("9999999999999999e370")), sys.byteorder)
    assert 0xF800000000000000 == int.from_bytes(converter.serialize(Decimal("-9999999999999999e370")), sys.byteorder)
    assert 0x607B86F26FC0FFFF == int.from_bytes(converter.serialize(Decimal("9999999999999999e-383")), sys.byteorder)
    assert 0x600386F26FC0FFFF == int.from_bytes(converter.serialize(Decimal("9999999999999999e-398")), sys.byteorder)
    assert 0xE00386F26FC0FFFF == int.from_bytes(converter.serialize(Decimal("-9999999999999999e-398")), sys.byteorder)
    assert 0x0000000000000000 == int.from_bytes(converter.serialize(Decimal("9999999999999999e-399")), sys.byteorder)
    assert 0x8000000000000000 == int.from_bytes(converter.serialize(Decimal("-9999999999999999e-399")), sys.byteorder)
    assert 0x5FE05AF3107A4000 == int.from_bytes(converter.serialize(Decimal("1e+383")), sys.byteorder)
    assert 0x5FE38D7EA4C68000 == int.from_bytes(converter.serialize(Decimal("1e+384")), sys.byteorder)

    # Special Values
    assert 0x7800000000000000 == int.from_bytes(converter.serialize(Decimal("1e999")), sys.byteorder)
    assert 0xF800000000000000 == int.from_bytes(converter.serialize(Decimal("-1e999")), sys.byteorder)
    assert 0x0000000000000000 == int.from_bytes(converter.serialize(Decimal("0e-999")), sys.byteorder)
    assert 0x7C00000000000000 == int.from_bytes(converter.serialize(Decimal("NaN")), sys.byteorder)

    with pytest.raises(MessgenError):
        converter.serialize(123)
