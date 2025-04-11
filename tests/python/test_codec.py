import pytest

from decimal import (
    Decimal,
)

from messgen.dynamic import (
    Codec,
    _bid64_to_decimal,
    _decimal_to_bid64,
)


@pytest.fixture
def codec():
    codec_ = Codec()
    codec_.load(type_dirs=["tests/data/types"], protocols=["tests/data/protocols:test_proto"])
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


def test_serialization1(codec, simple_struct):
    type_def = codec.type_converter("messgen/test/simple_struct")
    expected_msg = simple_struct
    expected_bytes = type_def.serialize(expected_msg)
    assert expected_bytes

    actual_msg = type_def.deserialize(expected_bytes)
    for key in expected_msg:
        assert actual_msg[key] == pytest.approx(expected_msg[key])


def test_serialization2(codec):
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
    assert _bid64_to_decimal(bytes.fromhex("308462d53c8abac0")) == Decimal("123456.7890123456")
    assert _bid64_to_decimal(bytes.fromhex("31c0000000000001")) == Decimal("1")
    assert _bid64_to_decimal(bytes.fromhex("31c000000000007b")) == Decimal("123")
    assert _bid64_to_decimal(bytes.fromhex("318000000000007b")) == Decimal("1.23")
    assert _bid64_to_decimal(bytes.fromhex("320000000000007b")) == Decimal("12300")
    assert _bid64_to_decimal(bytes.fromhex("b1c000000000007b")) == Decimal("-123")
    assert _bid64_to_decimal(bytes.fromhex("b1a000000000007b")) == Decimal("-12.3")
    assert _bid64_to_decimal(bytes.fromhex("31c0000000000000")) == Decimal("0")
    assert _bid64_to_decimal(bytes.fromhex("3e40000000000000")) == Decimal("0")
    assert _bid64_to_decimal(bytes.fromhex("2540000000000000")) == Decimal("0")
    assert _bid64_to_decimal(bytes.fromhex("31c000000098967f")) == Decimal("9999999")
    assert _bid64_to_decimal(bytes.fromhex("2e40000000000001")) == Decimal("0.0000000000000000000000000001")
    assert _bid64_to_decimal(bytes.fromhex("3540000000000009")) == Decimal("90000000000000000000000000000")
    assert _bid64_to_decimal(bytes.fromhex("2fe38d7ea4c67fff")) == Decimal("0.999999999999999")
    assert _bid64_to_decimal(bytes.fromhex("31a0000000000005")) == Decimal("0.5")
    assert _bid64_to_decimal(bytes.fromhex("318000000000000f")) == Decimal("0.15")
    assert _bid64_to_decimal(bytes.fromhex("316000000000007d")) == Decimal("0.125")
    assert _bid64_to_decimal(bytes.fromhex("316000000000007e")) == Decimal("0.126")
    assert _bid64_to_decimal(bytes.fromhex("7800000000000000")) == Decimal("Infinity")
    assert _bid64_to_decimal(bytes.fromhex("f800000000000000")) == Decimal("-Infinity")
    assert _bid64_to_decimal(bytes.fromhex("0000000000000000")) == Decimal("0")
    assert _bid64_to_decimal(bytes.fromhex("2e00000000000001")) == Decimal("0.000000000000000000000000000001")
    assert _bid64_to_decimal(bytes.fromhex("3d0000000098967f")) == Decimal("9.999999e+96")
    assert _bid64_to_decimal(bytes.fromhex("256000000098967f")) == Decimal("9.999999e-93")
    assert _bid64_to_decimal(bytes.fromhex("31a0000000000005")) == Decimal("0.5")
    assert _bid64_to_decimal(bytes.fromhex("3100000000000001")) == Decimal("0.000001")
    assert _bid64_to_decimal(bytes.fromhex("6c7386f26fc0ffff")) == Decimal("992800745259007")
    assert _bid64_to_decimal(bytes.fromhex("5fe05af3107a4000")) == Decimal("1e+383")
    assert _bid64_to_decimal(bytes.fromhex("7800000000000000")) == Decimal("Infinity")
    assert _bid64_to_decimal(bytes.fromhex("607b86f26fc0ffff")) == Decimal("9.92800745259007E-369")


def test_decimal_encoding():
    assert bytes.fromhex("308462d53c8abac0") == _decimal_to_bid64(Decimal("123456.7890123456"))
    assert bytes.fromhex("31c0000000000001") == _decimal_to_bid64(Decimal("1"))
    assert bytes.fromhex("31c000000000007b") == _decimal_to_bid64(Decimal("123"))
    assert bytes.fromhex("318000000000007b") == _decimal_to_bid64(Decimal("1.23"))
    assert bytes.fromhex("320000000000007b") == _decimal_to_bid64(Decimal("12300"))
    assert bytes.fromhex("b1c000000000007b") == _decimal_to_bid64(Decimal("-123"))
    assert bytes.fromhex("b1a000000000007b") == _decimal_to_bid64(Decimal("-12.3"))
    assert bytes.fromhex("31c0000000000000") == _decimal_to_bid64(Decimal("0"))
    assert bytes.fromhex("31c000000098967f") == _decimal_to_bid64(Decimal("9999999"))
    assert bytes.fromhex("2e40000000000001") == _decimal_to_bid64(Decimal("0.0000000000000000000000000001"))
    assert bytes.fromhex("3540000000000009") == _decimal_to_bid64(Decimal("90000000000000000000000000000"))
    assert bytes.fromhex("2fe38d7ea4c67fff") == _decimal_to_bid64(Decimal("0.999999999999999"))
    assert bytes.fromhex("31a0000000000005") == _decimal_to_bid64(Decimal("0.5"))
    assert bytes.fromhex("318000000000000f") == _decimal_to_bid64(Decimal("0.15"))
    assert bytes.fromhex("316000000000007d") == _decimal_to_bid64(Decimal("0.125"))
    assert bytes.fromhex("316000000000007e") == _decimal_to_bid64(Decimal("0.126"))
    assert bytes.fromhex("7800000000000000") == _decimal_to_bid64(Decimal("Infinity"))
    assert bytes.fromhex("f800000000000000") == _decimal_to_bid64(Decimal("-Infinity"))
    assert bytes.fromhex("2e00000000000001") == _decimal_to_bid64(Decimal("0.000000000000000000000000000001"))
    assert bytes.fromhex("3d0000000098967f") == _decimal_to_bid64(Decimal("9.999999e+96"))
    assert bytes.fromhex("256000000098967f") == _decimal_to_bid64(Decimal("9.999999e-93"))
    assert bytes.fromhex("3100000000000001") == _decimal_to_bid64(Decimal("0.000001"))
    assert bytes.fromhex("31dfffffffffffff") == _decimal_to_bid64(Decimal("9007199254740991"))
    assert bytes.fromhex("5fe05af3107a4000") == _decimal_to_bid64(Decimal("1e+383"))
    assert bytes.fromhex("607b86f26fc0ffff") == _decimal_to_bid64(Decimal("9.92800745259007E-369"))
