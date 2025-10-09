package tests

import (
	_type "github.com/Alber-Blanc/messgen/build-golang-test/msgs/mynamespace/type"
	"github.com/Alber-Blanc/messgen/build-golang-test/msgs/mynamespace/types/subspace"
)

type MessgenStruct interface {
	SerializedSize() uint32
	Serialize(buffer []byte) (uint32, error)
	Deserialize(buffer []byte) (uint32, error)
}

type TestCase struct {
	name       string
	path       string
	skipEncode bool
	expected   MessgenStruct
}

var simple = _type.SimpleStruct{
	F0:    0x1234567890abcdef,
	F1:    0x1234567890abcdef,
	F1Pad: 0x12,
	F2:    1.2345678901234567890,
	F3:    0x12345678,
	F4:    0x12345678,
	F5:    1.2345678901234567890,
	F6:    0x1234,
	F7:    0x12,
	F8:    -0x12,
	F9:    true,
}

var varSize = _type.VarSizeStruct{
	F0:    0x1234567890abcdef,
	F1Vec: []int64{0x1234567890abcdef, 5, 1},
	Str:   "Hello messgen!",
}

var TEST_DATA = []TestCase{
	{"SimpleStruct", "simple_struct.bin", false, &_type.SimpleStruct{
		F0:    0x1234567890abcdef,
		F1:    0x1234567890abcdef,
		F1Pad: 0x12,
		F2:    1.2345678901234567890,
		F3:    0x12345678,
		F4:    0x12345678,
		F5:    1.2345678901234567890,
		F6:    0x1234,
		F7:    0x12,
		F8:    -0x12,
		F9:    true,
	}},

	{"VarSizeStruct", "var_size_struct.bin", false, &_type.VarSizeStruct{
		F0:    0x1234567890abcdef,
		F1Vec: []int64{-0x1234567890abcdef, 5, 1},
		Str:   "Hello messgen!",
	}},

	{"StructWithEnum", "struct_with_enum.bin", false, &_type.StructWithEnum{
		F0: 0x1234567890abcdef,
		F1: 0x1234567890abcdef,
		E0: _type.SimpleEnum_AnotherValue,
	}},

	{"EmptyStruct", "empty_struct.bin", false, &_type.EmptyStruct{}},

	{"ComplexStructWithEmpty", "complex_struct_with_empty.bin", true, &subspace.ComplexStructWithEmpty{
		E:            _type.EmptyStruct{},
		DynamicArray: []_type.EmptyStruct{{}, {}, {}},
		StaticArray:  [5]_type.EmptyStruct{{}, {}, {}, {}, {}},
		MultiArray: [][5][]_type.EmptyStruct{
			{{{}}, {{}}, {{}}, {{}}, {{}}},
			{{{}}, {{}}, {{}}, {{}}, {{}}},
			{{{}}, {{}}, {{}}, {{}}, {{}}},
		},
		MapEmptyByInt:   map[int32]_type.EmptyStruct{0: {}, 1: {}, 2: {}},
		MapVecByStr:     map[string][]_type.EmptyStruct{"key0": {{}}, "key1": {{}}, "key2": {{}}},
		ArrayOfSizeZero: [0]int32{},
	}},

	{"ComplexStructNoSTL", "complex_struct_nostl.bin", false, &subspace.ComplexStructNostl{
		F0:    0x1234567890abcdef,
		F1:    0x12345678,
		F2:    0x1234567890abcdef,
		Bits0: _type.SimpleBitset_One | _type.SimpleBitset_Error,
		SArr:  [2]_type.SimpleStruct{simple, simple},
		F1Arr: [4]int64{0x1234567890abcdef, 0x1234567890abcdef, 0x1234567890abcdef, 0x1234567890abcdef},
		VArr:  [2]_type.VarSizeStruct{varSize, varSize},
		F2Vec: []float64{1.2345678901234567890, 1.2345678901234567890, 1.2345678901234567890},
		EVec:  []_type.SimpleEnum{_type.SimpleEnum_OneValue, _type.SimpleEnum_AnotherValue},
		SVec:  []_type.SimpleStruct{simple, simple, simple},
		VVec0: [][]_type.VarSizeStruct{
			{varSize, varSize},
			{varSize, varSize},
			{varSize, varSize},
		},
		VVec1: [4][]_type.VarSizeStruct{
			{varSize, varSize, varSize},
			{varSize, varSize, varSize},
			{varSize, varSize, varSize},
			{varSize, varSize, varSize},
		},
		VVec2: [][4][]int16{
			{{0x1234, 0x1234, 0x1234}, {0x1234, 0x1234, 0x1234}, {0x1234, 0x1234, 0x1234}, {0x1234, 0x1234, 0x1234}},
			{{0x1234, 0x1234, 0x1234}, {0x1234, 0x1234, 0x1234}, {0x1234, 0x1234, 0x1234}, {0x1234, 0x1234, 0x1234}},
		},
		Str:    "Example String",
		StrVec: []string{"string1", "string2", "string3"},
	}},

	{"ComplexStruct", "complex_struct.bin", true, &subspace.ComplexStruct{
		F0:    0x1234567890abcdef,
		F1:    0x12345678,
		F2:    0x1234567890abcdef,
		Bits0: _type.SimpleBitset_One | _type.SimpleBitset_Error,
		SArr:  [2]_type.SimpleStruct{simple, simple},
		F1Arr: [4]int64{0x1234567890abcdef, 0x1234567890abcdef, 0x1234567890abcdef, 0x1234567890abcdef},
		VArr:  [2]_type.VarSizeStruct{varSize, varSize},
		F2Vec: []float64{1.2345678901234567890, 1.2345678901234567890, 1.2345678901234567890},
		EVec:  []_type.SimpleEnum{_type.SimpleEnum_OneValue, _type.SimpleEnum_AnotherValue},
		SVec:  []_type.SimpleStruct{simple, simple, simple},
		VVec0: [][]_type.VarSizeStruct{
			{varSize, varSize},
			{varSize, varSize},
			{varSize, varSize},
		},
		VVec1: [4][]_type.VarSizeStruct{
			{varSize, varSize, varSize},
			{varSize, varSize, varSize},
			{varSize, varSize, varSize},
			{varSize, varSize, varSize},
		},
		VVec2: [][4][]int16{
			{{0x1234, 0x1234, 0x1234}, {0x1234, 0x1234, 0x1234}, {0x1234, 0x1234, 0x1234}, {0x1234, 0x1234, 0x1234}},
			{{0x1234, 0x1234, 0x1234}, {0x1234, 0x1234, 0x1234}, {0x1234, 0x1234, 0x1234}, {0x1234, 0x1234, 0x1234}},
		},
		Str:         "Example String",
		Bs:          []byte("byte string"),
		StrVec:      []string{"string1", "string2", "string3"},
		MapStrByInt: map[int32]string{0: "string0", 1: "string1", 2: "string2"},
		MapVecByStr: map[string][]int32{
			"" +
				"key0": {0x1234, 0x1234, 0x1234}, "key1": {0x1234, 0x1234, 0x1234}, "key2": {0x1234, 0x1234, 0x1234},
		},
	}},

	{"FlatStruct", "flat_struct.bin", false, &_type.FlatStruct{
		F0: 0x1234567890abcdef,
		F1: 0x1234567890abcdef,
		F2: 1.2345678901234567890,
		F3: 0x12345678,
		F4: 0x12345678,
		F5: 1.2345678901234567890,
		F6: 0x1234,
		F7: 0x12,
		F8: -0x12,
	}},
}
