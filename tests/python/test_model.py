import json
import pytest

from messgen import model


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


def test_legacy_struct_hash_matches_pre_signature_algorithm(simple_struct_type):
    simple_struct, types = simple_struct_type

    # Value produced by messgen 95809d99, before the signature()-based hash rework
    assert model.legacy_hash_type(simple_struct, types) == 18261672191093689286


def test_legacy_struct_hash_differs_from_current_hash(simple_struct_type):
    simple_struct, types = simple_struct_type

    assert model.legacy_hash_type(simple_struct, types) != model.hash_type(simple_struct, types)


def test_legacy_struct_hash_ignores_field_comment(simple_struct_type):
    simple_struct, types = simple_struct_type

    expected = model.legacy_hash_type(simple_struct, types)
    simple_struct.fields[0].comment = "This is a modified comment"
    actual = model.legacy_hash_type(simple_struct, types)

    assert actual == expected


def test_get_schema_returns_compact_json(simple_struct_type):
    struct_type, _ = simple_struct_type
    schema = model.get_schema(struct_type)
    parsed = json.loads(schema)

    assert parsed["type"] == "some_struct"
    assert parsed["type_class"] == "struct"
    assert len(parsed["fields"]) == 2


def test_get_schema_includes_comments(simple_struct_type):
    struct_type, _ = simple_struct_type
    schema = model.get_schema(struct_type)
    parsed = json.loads(schema)

    assert parsed["comment"] == "struct level comment"
    assert parsed["fields"][0]["comment"] == "first field level comment"


def test_get_schema_is_compact(simple_struct_type):
    struct_type, _ = simple_struct_type
    schema = model.get_schema(struct_type)

    assert ": " not in schema
    assert ", " not in schema


@pytest.mark.parametrize("type_def", [
    model.ArrayType(
        type="int[4]",
        type_class=model.TypeClass.array,
        element_type="int",
        array_size=4,
        size=16,
    ),
    model.VectorType(
        type="int[]",
        type_class=model.TypeClass.vector,
        element_type="int",
        size=None,
    ),
    model.MapType(
        type="string->int",
        type_class=model.TypeClass.map,
        key_type="string",
        value_type="int",
        size=None,
    ),
    model.DecimalType(
        type="dec64",
        type_class=model.TypeClass.decimal,
        size=8,
    ),
    model.EnumType(
        type="some_enum",
        type_class=model.TypeClass.enum,
        base_type="uint8",
        comment="enum level comment",
        values=[
            model.EnumValue(name="one", value=1, comment="first value comment"),
            model.EnumValue(name="two", value="0x2", comment=""),
        ],
        size=1,
    ),
    model.BitsetType(
        type="some_bitset",
        type_class=model.TypeClass.bitset,
        base_type="uint16",
        comment="bitset level comment",
        bits=[
            model.BitsetBit(name="first", offset=0, comment="first bit comment"),
            model.BitsetBit(name="second", offset=1, comment=None),
        ],
        size=2,
    ),
    model.ExternalType(
        type="some_external",
        type_class=model.TypeClass.external,
        comment="external level comment",
        size=None,
    ),
])
def test_from_schema_round_trips_type(type_def):
    assert model.from_schema(model.get_schema(type_def)) == type_def


def test_from_schema_round_trips_struct(simple_struct_type):
    struct_type, types = simple_struct_type
    actual = model.from_schema(model.get_schema(struct_type))

    assert actual == struct_type
    assert model.hash_type(actual, types) == model.hash_type(struct_type, types)


def test_from_schema_restores_type_class_enum(simple_struct_type):
    struct_type, _ = simple_struct_type
    actual = model.from_schema(model.get_schema(struct_type))

    assert actual.type_class is model.TypeClass.struct


def test_from_schema_rejects_schema_without_type_class():
    with pytest.raises(RuntimeError, match="no type_class"):
        model.from_schema(json.dumps({"type": "some_struct"}))


def test_from_schema_rejects_unknown_type_class():
    with pytest.raises(RuntimeError, match="Invalid type_class=panda"):
        model.from_schema(json.dumps({"type": "some_struct", "type_class": "panda"}))


@pytest.mark.parametrize("type_class", ["scalar", "string", "bytes"])
def test_from_schema_rejects_basic_types(type_class):
    schema = json.dumps({"type": "int", "type_class": type_class, "size": 4})

    with pytest.raises(RuntimeError, match="have no schema"):
        model.from_schema(schema)


def create_struct_schema(type_name: str, field_types: list[str]) -> str:
    fields = []
    for index, field_type in enumerate(field_types):
        fields.append(model.FieldType(name=f"f{index}", type=field_type, comment=None))
    return model.get_schema(model.StructType(type=type_name, type_class=model.TypeClass.struct, comment=None, fields=fields, size=None))


def test_from_schemas_derives_basic_dependencies():
    types = model.from_schemas([create_struct_schema("some_struct", ["uint64", "float32", "bool", "string", "bytes", "dec64"])])

    assert types["uint64"] == model.BasicType(type="uint64", type_class=model.TypeClass.scalar, size=8)
    assert types["float32"] == model.BasicType(type="float32", type_class=model.TypeClass.scalar, size=4)
    assert types["bool"] == model.BasicType(type="bool", type_class=model.TypeClass.scalar, size=1)
    assert types["string"] == model.BasicType(type="string", type_class=model.TypeClass.string, size=None)
    assert types["bytes"] == model.BasicType(type="bytes", type_class=model.TypeClass.bytes, size=None)
    assert types["dec64"] == model.DecimalType(type="dec64", type_class=model.TypeClass.decimal, size=8)


def test_from_schemas_derives_container_dependencies():
    types = model.from_schemas([create_struct_schema("some_struct", ["int16[]", "int32[4]", "string{int8}"])])

    assert types["int16[]"] == model.VectorType(type="int16[]", type_class=model.TypeClass.vector, element_type="int16", size=None)
    assert types["int32[4]"] == model.ArrayType(type="int32[4]", type_class=model.TypeClass.array, element_type="int32", array_size=4, size=16)
    assert types["string{int8}"] == model.MapType(type="string{int8}", type_class=model.TypeClass.map, key_type="int8", value_type="string", size=None)
    assert {"int16", "int32", "int8", "string"} <= set(types)


def test_from_schemas_derives_nested_containers_of_named_types():
    schemas = [
        create_struct_schema("outer", ["inner[2][]", "inner[]{string}"]),
        create_struct_schema("inner", ["uint8"]),
    ]

    types = model.from_schemas(schemas)

    assert types["inner[2][]"].element_type == "inner[2]"
    assert types["inner[2]"] == model.ArrayType(type="inner[2]", type_class=model.TypeClass.array, element_type="inner", array_size=2, size=None)
    assert types["inner[]{string}"] == model.MapType(type="inner[]{string}", type_class=model.TypeClass.map, key_type="string", value_type="inner[]", size=None)
    assert types["inner"].type_class == model.TypeClass.struct
    assert model.hash_type(types["outer"], types) is not None


def test_from_schemas_array_of_fixed_size_struct_has_size():
    schemas = [
        create_struct_schema("outer", ["inner[3]"]),
        model.get_schema(
            model.StructType(
                type="inner",
                type_class=model.TypeClass.struct,
                comment=None,
                fields=[model.FieldType(name="f0", type="uint16", comment=None)],
                size=2,
            )
        ),
    ]

    types = model.from_schemas(schemas)

    assert types["inner[3]"].size == 6


@pytest.mark.parametrize("field_type", ["uint8[]", "string{uint8}", "string", "bytes"])
def test_from_schemas_adds_size_type_for_length_prefixed_dependencies(field_type):
    types = model.from_schemas([create_struct_schema("some_struct", [field_type])])

    assert types["uint32"] == model.BasicType(type="uint32", type_class=model.TypeClass.scalar, size=4)


def test_from_schemas_does_not_add_size_type_for_fixed_size_dependencies():
    types = model.from_schemas([create_struct_schema("some_struct", ["uint8", "uint8[4]", "dec64"])])

    assert "uint32" not in types


def test_from_schemas_rejects_missing_named_dependency():
    with pytest.raises(RuntimeError, match="Missing schema for type=inner"):
        model.from_schemas([create_struct_schema("outer", ["inner[]"])])


def test_struct_hash_matches_pinned_value(simple_struct_type):
    simple_struct, types = simple_struct_type
    assert model.hash_type(simple_struct, types) == 3195362254335426325


def test_struct_hash_incorporates_dependency_reachable_via_two_paths(simple_struct_type):
    leaf_struct, types = simple_struct_type

    middle_struct = model.StructType(
        type="middle_struct",
        type_class=model.TypeClass.struct,
        size=None,
        fields=[model.FieldType(name="leaf", type=leaf_struct.type, comment=None)],
        comment=None,
    )
    diamond_struct = model.StructType(
        type="diamond_struct",
        type_class=model.TypeClass.struct,
        size=None,
        fields=[
            model.FieldType(name="direct", type=leaf_struct.type, comment=None),
            model.FieldType(name="indirect", type=middle_struct.type, comment=None),
        ],
        comment=None,
    )
    types[middle_struct.type] = middle_struct
    types[diamond_struct.type] = diamond_struct

    expected = model.hash_type(diamond_struct, types)
    leaf_struct.fields[0].name += "_modified"
    actual = model.hash_type(diamond_struct, types)

    assert actual != expected
