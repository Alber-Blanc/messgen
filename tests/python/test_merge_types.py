import pytest

from messgen import model
from messgen.model import merge_types


INT32 = model.BasicType(type="int32", type_class=model.TypeClass.scalar, size=4)
INT64 = model.BasicType(type="int64", type_class=model.TypeClass.scalar, size=8)
STRING = model.BasicType(type="string", type_class=model.TypeClass.string, size=None)
SCALARS = {"int32": INT32, "int64": INT64, "string": STRING}


def struct(name, fields, size=None):
    return model.StructType(
        type=name,
        type_class=model.TypeClass.struct,
        comment=None,
        fields=[model.FieldType(name=n, type=t, comment=None) for n, t in fields],
        size=size,
    )


def enum(name, values, base_type="uint8"):
    return model.EnumType(
        type=name,
        type_class=model.TypeClass.enum,
        base_type=base_type,
        comment=None,
        values=[model.EnumValue(name=n, value=v, comment="") for n, v in values],
        size=model.SCALAR_SIZES[base_type],
    )


def names(fields):
    return [f.name for f in fields]


def test_merge_appends_rhs_only_fields_in_declaration_order():
    lhs = struct("t", [("a", "int32"), ("b", "int32")])
    rhs = struct("t", [("a", "int32"), ("b", "int32"), ("c", "int64"), ("d", "int32")])

    merged, deps = merge_types((lhs, SCALARS), (rhs, SCALARS))

    assert names(merged.fields) == ["a", "b", "c", "d"]
    assert merged.size == 20
    assert deps["int32"] == INT32


def test_merge_keeps_lhs_only_fields_before_rhs_only_fields():
    lhs = struct("t", [("a", "int32"), ("x", "int32")])
    rhs = struct("t", [("a", "int32"), ("y", "int32")])

    merged, _ = merge_types((lhs, SCALARS), (rhs, SCALARS))

    assert names(merged.fields) == ["a", "x", "y"]


def test_merge_is_deterministic_for_many_fields():
    lhs = struct("t", [(n, "int32") for n in ("alpha", "beta", "gamma", "delta")])

    merged, _ = merge_types((lhs, SCALARS), (lhs, SCALARS))

    assert names(merged.fields) == ["alpha", "beta", "gamma", "delta"]


def test_merge_rejects_reordered_common_fields():
    lhs = struct("t", [("a", "int32"), ("b", "int32")])
    rhs = struct("t", [("b", "int32"), ("a", "int32")])

    assert merge_types((lhs, SCALARS), (rhs, SCALARS)) is None


def test_merge_rejects_field_type_name_change():
    lhs = struct("t", [("x", "foo")])
    rhs = struct("t", [("x", "bar")])
    lhs_deps = {**SCALARS, "foo": struct("foo", [("a", "int32")])}
    rhs_deps = {**SCALARS, "bar": struct("bar", [("a", "int32")])}

    assert merge_types((lhs, lhs_deps), (rhs, rhs_deps)) is None


def test_merge_rejects_scalar_field_type_change():
    lhs = struct("t", [("a", "int32")])
    rhs = struct("t", [("a", "int64")])

    assert merge_types((lhs, SCALARS), (rhs, SCALARS)) is None


def test_merge_variable_size_field_clears_size():
    lhs = struct("t", [("a", "int32")], size=4)
    rhs = struct("t", [("a", "int32"), ("s", "string")])

    merged, _ = merge_types((lhs, SCALARS), (rhs, SCALARS))

    assert merged.size is None


def test_merge_returns_merged_nested_types_in_deps():
    outer = struct("outer", [("x", "inner")])
    lhs_deps = {**SCALARS, "inner": struct("inner", [("a", "int32")])}
    rhs_deps = {**SCALARS, "inner": struct("inner", [("a", "int32"), ("b", "int32")])}

    merged, deps = merge_types((outer, lhs_deps), (outer, rhs_deps))

    assert names(merged.fields) == ["x"]
    assert names(deps["inner"].fields) == ["a", "b"]
    assert deps["inner"].size == 8


def test_merge_rejects_incompatible_nested_type():
    outer = struct("outer", [("x", "inner")])
    lhs_deps = {**SCALARS, "inner": struct("inner", [("a", "int32")])}
    rhs_deps = {**SCALARS, "inner": struct("inner", [("a", "int64")])}

    assert merge_types((outer, lhs_deps), (outer, rhs_deps)) is None


def test_merge_recurses_through_container_element_type():
    vec = model.VectorType(type="el[]", type_class=model.TypeClass.vector, element_type="el", size=None)
    outer = struct("outer", [("v", "el[]")])
    lhs_deps = {**SCALARS, "el[]": vec, "el": struct("el", [("a", "int32")])}
    rhs_deps = {**SCALARS, "el[]": vec, "el": struct("el", [("a", "int64")])}

    assert merge_types((outer, lhs_deps), (outer, rhs_deps)) is None


def test_merge_merges_shared_dep_not_reachable_through_common_fields():
    lhs = struct("t", [("x", "shared")])
    rhs = struct("t", [("y", "shared")])
    lhs_deps = {**SCALARS, "shared": struct("shared", [("a", "int32")])}
    rhs_deps = {**SCALARS, "shared": struct("shared", [("a", "int32"), ("b", "int32")])}

    merged, deps = merge_types((lhs, lhs_deps), (rhs, rhs_deps))

    assert names(merged.fields) == ["x", "y"]
    assert names(deps["shared"].fields) == ["a", "b"]


def test_merge_does_not_alias_input_fields():
    lhs = struct("t", [("a", "int32")])
    rhs = struct("t", [("a", "int32"), ("b", "int32")])

    merged, _ = merge_types((lhs, SCALARS), (rhs, SCALARS))
    merged.fields[0].name = "changed"

    assert names(lhs.fields) == ["a"]


def test_merge_raises_on_missing_dependency():
    lhs = struct("t", [("a", "int32")])

    with pytest.raises(RuntimeError, match="Missing dependency"):
        merge_types((lhs, {}), (lhs, {}))


def test_merge_raises_on_different_type_names():
    with pytest.raises(RuntimeError, match="unrelated"):
        merge_types((struct("a", []), {}), (struct("b", []), {}))


def test_merge_raises_on_different_type_classes():
    e = enum("t", [])
    with pytest.raises(RuntimeError, match="type_class"):
        merge_types((struct("t", []), {}), (e, {}))


def test_merge_enum_unions_values_in_order():
    lhs = enum("e", [("A", 1), ("B", 2)])
    rhs = enum("e", [("A", 1), ("D", 4), ("C", 3)])

    merged, _ = merge_types((lhs, {}), (rhs, {}))

    assert [(v.name, v.value) for v in merged.values] == [("A", 1), ("B", 2), ("D", 4), ("C", 3)]


def test_merge_enum_rejects_same_value_different_name():
    assert merge_types((enum("e", [("A", 1)]), {}), (enum("e", [("B", 1)]), {})) is None


def test_merge_enum_rejects_same_name_different_value():
    assert merge_types((enum("e", [("A", 1)]), {}), (enum("e", [("A", 2)]), {})) is None


def test_merge_enum_widens_base_type():
    lhs = enum("e", [("A", 1)], base_type="uint8")
    rhs = enum("e", [("A", 1), ("B", 300)], base_type="uint16")

    merged, _ = merge_types((lhs, {}), (rhs, {}))

    assert merged.base_type == "uint16"
    assert merged.size == 2


def test_merge_enum_rejects_signedness_change():
    lhs = enum("e", [("A", 1)], base_type="uint8")
    rhs = enum("e", [("A", 1)], base_type="int8")

    assert merge_types((lhs, {}), (rhs, {})) is None


def test_merge_bitset_keeps_bit_objects():
    bs = model.BitsetType(
        type="bs",
        type_class=model.TypeClass.bitset,
        base_type="uint8",
        comment=None,
        bits=[model.BitsetBit(name="b0", offset=0, comment=None)],
        size=1,
    )

    merged, _ = merge_types((bs, {}), (bs, {}))

    assert merged == bs


def test_merge_from_schemas_roundtrip():
    v1 = struct("msg", [("id", "int32"), ("st", "status")])
    v2 = struct("msg", [("id", "int32"), ("st", "status"), ("tags", "string[]")])
    st1 = enum("status", [("OK", 0)])
    st2 = enum("status", [("OK", 0), ("FAIL", 1)])
    lhs_types = model.from_schemas([model.get_schema(v1), model.get_schema(st1)])
    rhs_types = model.from_schemas([model.get_schema(v2), model.get_schema(st2)])

    merged, deps = merge_types((lhs_types["msg"], lhs_types), (rhs_types["msg"], rhs_types))

    assert names(merged.fields) == ["id", "st", "tags"]
    assert [v.name for v in deps["status"].values] == ["OK", "FAIL"]
    assert "string[]" in deps
    assert model.hash_type(merged, deps) is not None
