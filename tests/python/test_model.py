import pytest

import model


@pytest.fixture
def simple_struct_type():
    int_type = model.BasicType(
        type="int",
        type_class=model.TypeClass.scalar,
        size=4,
    )

    float_type = model.BasicType(
        type="float",
        type_class=model.TypeClass.scalar,
        size=4,
    )

    struct_type = model.StructType(
        type="some_struct",
        type_class=model.TypeClass.struct,
        size=None,
        fields=[
            model.FieldType(
                name="field1",
                type="int",
                comment="first field level comment",
            ),
            model.FieldType(
                name="field2",
                type="float",
                comment="second field level comment",
            ),
        ],
        comment="struct level comment",
    )

    types = {
        int_type.type: int_type,
        float_type.type: float_type,
        struct_type.type: struct_type,
    }

    return struct_type, types


@pytest.fixture
def nested_struct_type(simple_struct_type):
    nested_struct, types = simple_struct_type

    outer_struct = model.StructType(
        type="outer_struct",
        type_class=model.TypeClass.struct,
        size=None,
        fields=[
            model.FieldType(
                name="field1",
                type=nested_struct.type,
                comment="nested field level comment",
            ),
        ],
        comment="nested struct level comment",
    )

    types[outer_struct.type] = outer_struct

    return outer_struct, types


def test_enum_value_hash_ignores_comment():
    enum_value1 = model.EnumValue(
        name="some_enum",
        value=0,
        comment="This is a comment",
    )

    enum_value2 = model.EnumValue(
        name="some_enum",
        value=0,
        comment="This is a differen comment",
    )

    assert model.hash_type(enum_value1, types={}) == model.hash_type(enum_value2, types={})


def test_simple_struct_hash_ignores_field_comment(simple_struct_type):
    simple_struct, types = simple_struct_type

    expected = model.hash_type(simple_struct, types)
    simple_struct.fields[0].comment = "This is a modified comment"
    actual = model.hash_type(simple_struct, types)

    assert actual == expected


def test_outer_struct_hash_is_affected_by_nested_changes(nested_struct_type):
    outer_struct, types = nested_struct_type
    nested_struct = types[outer_struct.fields[0].type]

    expected = model.hash_type(outer_struct, types)
    nested_struct.fields[0].name += "_modified"
    actual = model.hash_type(outer_struct, types)

    assert actual != expected
