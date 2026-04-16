package tests

import (
	_type "github.com/Alber-Blanc/messgen/build-golang-test/msgs/mynamespace/types"
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
	{"SimpleStruct", "simple_struct.bin", false, &simple},

	{"VarSizeStruct", "var_size_struct.bin", false, &_type.VarSizeStruct{
		F0:    0x1234567890abcdef,
		F1Vec: []int64{-0x1234567890abcdef, 5, 1},
		Str:   "Hello messgen!",
	}},

	{"EmptyStruct", "empty_struct.bin", false, &_type.EmptyStruct{}},

	{"ComplexStruct", "complex_struct.bin", true, &subspace.ComplexStruct{
		Bitset0:             _type.SimpleBitset_One | _type.SimpleBitset_Error,
		ArrSimpleStruct:     [2]_type.SimpleStruct{simple, simple},
		ArrInt:              [4]int64{0x1234567890abcdef, 0x1234567890abcdef, 0x1234567890abcdef, 0x1234567890abcdef},
		ArrVarSizeStruct:    [2]_type.VarSizeStruct{varSize, varSize},
		VecFloat:            []float64{1.2345678901234567890, 1.2345678901234567890, 1.2345678901234567890},
		VecEnum:             []_type.SimpleEnum{_type.SimpleEnum_OneValue, _type.SimpleEnum_AnotherValue},
		VecSimpleStruct:     []_type.SimpleStruct{simple, simple, simple},
		VecVecVarSizeStruct: [][]_type.VarSizeStruct{},
		VecArrVecInt:        [][4][]int16{},
		Str:                 "Example String",
		Bs:                  []byte("byte string"),
		StrVec:              []string{"string1", "string2", "string3"},
		MapStrByInt: map[int32]string{
			0: "string0",
			1: "string1",
			2: "string2",
		},
		MapVecByStr: map[string][]int32{
			"key0": {0x1234, 0x1234, 0x1234},
			"key1": {0x1234, 0x1234, 0x1234},
			"key2": {0x1234, 0x1234, 0x1234},
		},
		ArrayOfSizeZero: [0]int32{},
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
	{
		"ComplexStructWithFlatGroups_WithFilledMaps", "complex_types_with_flat_groups.bin", true,
		&_type.ComplexTypesWithFlatGroups{
			Vec1:    []uint16{1, 2, 3, 4, 5, 6},
			Map1:    map[uint32]string{0x252525: "0x252525", 0x262626: "0x262626"},
			String1: "string1",
			Bytes1:  []byte("some bytes"),
			F0:      0x1234567890abcdef,
			F1:      0x1234567890abcdef,
			F2:      1.2345678901234567890,
			F3:      0x12345678,
			F4:      0x12345678,
			F5:      1.2345678901234567890,
			F6:      0x1234,
			F7:      0x12,
			F8:      -0x12,
			Vec2:    []int32{2, 3, 4, 5},
			Map2:    map[string]float64{"0.202020": 0.202020, "0.212121": 0.212121},
			String2: "some string2",
			Bytes2:  []byte("some bytes2"),
			Flag1:   0x1,
			Flag2:   0x2,
			Flag3:   0x3,
			Flag4:   0x4,
		},
	},
	{
		"ComplexStructWithFlatGroups_WithoutFilledMaps", "complex_types_with_flat_groups_with_single_item_map.bin", false,
		&_type.ComplexTypesWithFlatGroups{
			Vec1: []uint16{1, 2, 3, 4, 5, 6},
			Map1: map[uint32]string{
				1: "1",
			},
			String1: "string1",
			Bytes1:  []byte("some bytes"),
			F0:      0x1234567890abcdef,
			F1:      0x1234567890abcdef,
			F2:      1.2345678901234567890,
			F3:      0x12345678,
			F4:      0x12345678,
			F5:      1.2345678901234567890,
			F6:      0x1234,
			F7:      0x12,
			F8:      -0x12,
			Vec2:    []int32{2, 3, 4, 5},
			Map2: map[string]float64{
				"0": 0.0,
			},
			String2: "some string2",
			Bytes2:  []byte("some bytes2"),
			Flag1:   0x1,
			Flag2:   0x2,
			Flag3:   0x3,
			Flag4:   0x4,
		},
	},
}
