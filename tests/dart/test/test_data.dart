import 'dart:typed_data';
import '../../../build-dart-test/msgs/mynamespace/types/simple_struct_gen.dart';
import '../../../build-dart-test/msgs/mynamespace/types/var_size_struct_gen.dart';
import '../../../build-dart-test/msgs/mynamespace/types/simple_enum_gen.dart';
import '../../../build-dart-test/msgs/mynamespace/types/empty_struct_gen.dart';
import '../../../build-dart-test/msgs/mynamespace/types/flat_struct_gen.dart';
import '../../../build-dart-test/msgs/mynamespace/types/complex_types_with_flat_groups_gen.dart';
import '../../../build-dart-test/msgs/mynamespace/types/simple_bitset_gen.dart';
import '../../../build-dart-test/msgs/mynamespace/types/subspace/complex_struct_gen.dart';
import 'package:messgen/messgen.dart';

class TestCase {
  final String name;
  final String path;
  final bool skipEncode;
  final Serializable expected;

  TestCase({
    required this.name,
    required this.path,
    this.skipEncode = false,
    required this.expected,
  });
}

// Reusable test data
final simple = SimpleStruct(
  f0: 0x1234567890abcdef,
  f1: 0x1234567890abcdef,
  f1Pad: 0x12,
  f2: 1.2345678901234567890,
  f3: 0x12345678,
  f4: 0x12345678,
  f5: 1.2345678901234567890,
  f6: 0x1234,
  f7: 0x12,
  f8: -0x12,
  f9: true,
  e0: SimpleEnum.oneValue,
  b0: SimpleBitset(SimpleBitset.one),
);

final varSize = VarSizeStruct(
  f0: 0x1234567890abcdef,
  f1Vec: [-0x1234567890abcdef, 5, 1],
  str: "Hello messgen!",
);

final List<TestCase> testData = [
  TestCase(
    name: 'SimpleStruct',
    path: 'simple_struct.bin',
    expected: SimpleStruct(
      f0: 0x1234567890abcdef,
      f1: 0x1234567890abcdef,
      f1Pad: 0x12,
      f2: 1.2345678901234567890,
      f3: 0x12345678,
      f4: 0x12345678,
      f5: 1.2345678901234567890,
      f6: 0x1234,
      f7: 0x12,
      f8: -0x12,
      f9: true,
      e0: SimpleEnum.oneValue,
      b0: SimpleBitset(SimpleBitset.one),
    ),
  ),
  TestCase(
    name: 'VarSizeStruct',
    path: 'var_size_struct.bin',
    expected: VarSizeStruct(
      f0: 0x1234567890abcdef,
      f1Vec: [-0x1234567890abcdef, 5, 1],
      str: "Hello messgen!",
    ),
  ),
  TestCase(
    name: 'EmptyStruct',
    path: 'empty_struct.bin',
    expected: EmptyStruct(),
  ),
  TestCase(
    name: 'ComplexStruct',
    path: 'complex_struct.bin',
    skipEncode: true,
    expected: ComplexStruct(
      bitset0: SimpleBitset(SimpleBitset.one | SimpleBitset.error),
      arrSimpleStruct: [simple, simple],
      arrInt: [
        0x1234567890abcdef,
        0x1234567890abcdef,
        0x1234567890abcdef,
        0x1234567890abcdef,
      ],
      arrVarSizeStruct: [varSize, varSize],
      vecFloat: [1.2345678901234567890, 1.2345678901234567890, 1.2345678901234567890],
      vecEnum: [SimpleEnum.oneValue, SimpleEnum.anotherValue],
      vecSimpleStruct: [simple, simple, simple],
      vecVecVarSizeStruct: [
        [varSize, varSize],
        [varSize, varSize],
        [varSize, varSize],
      ],
      vecArrVecInt: [
        [
          [0x1234, 0x1234, 0x1234],
          [0x1234, 0x1234, 0x1234],
          [0x1234, 0x1234, 0x1234],
          [0x1234, 0x1234, 0x1234],
        ],
        [
          [0x1234, 0x1234, 0x1234],
          [0x1234, 0x1234, 0x1234],
          [0x1234, 0x1234, 0x1234],
          [0x1234, 0x1234, 0x1234],
        ],
      ],
      str: "Example String",
      bs: Uint8List.fromList("byte string".codeUnits),
      strVec: ["string1", "string2", "string3"],
      mapStrByInt: {
        0: "string0",
        1: "string1",
        2: "string2",
      },
      mapVecByStr: {
        "key0": [0x1234, 0x1234, 0x1234],
        "key1": [0x1234, 0x1234, 0x1234],
        "key2": [0x1234, 0x1234, 0x1234],
      },
      arrayOfSizeZero: [],
    ),
  ),
  TestCase(
    name: 'FlatStruct',
    path: 'flat_struct.bin',
    expected: FlatStruct(
      f0: 0x1234567890abcdef,
      f1: 0x1234567890abcdef,
      f2: 1.2345678901234567890,
      f3: 0x12345678,
      f4: 0x12345678,
      f5: 1.2345678901234567890,
      f6: 0x1234,
      f7: 0x12,
      f8: -0x12,
    ),
  ),
  TestCase(
    name: 'ComplexStructWithFlatGroups_WithFilledMaps',
    path: 'complex_types_with_flat_groups.bin',
    skipEncode: true,
    expected: ComplexTypesWithFlatGroups(
      array1: [1, 2, 3, 4, 5, 6],
      map1: {
        0x252525: "0x252525",
        0x262626: "0x262626",
      },
      string1: "string1",
      bytes1: Uint8List.fromList("some bytes".codeUnits),
      f0: 0x1234567890abcdef,
      f1: 0x1234567890abcdef,
      f2: 1.2345678901234567890,
      f3: 0x12345678,
      f4: 0x12345678,
      f5: 1.2345678901234567890,
      f6: 0x1234,
      f7: 0x12,
      f8: -0x12,
      array2: [2, 3, 4, 5],
      map2: {
        "0.202020": 0.202020,
        "0.212121": 0.212121,
      },
      string2: "some string2",
      bytes2: Uint8List.fromList("some bytes2".codeUnits),
      flag1: 0x1,
      flag2: 0x2,
      flag3: 0x3,
      flag4: 0x4,
    ),
  ),
  TestCase(
    name: 'ComplexStructWithFlatGroups_WithoutFilledMaps',
    path: 'complex_types_with_flat_groups_with_single_item_map.bin',
    expected: ComplexTypesWithFlatGroups(
      array1: [1, 2, 3, 4, 5, 6],
      map1: {1: "1"},
      string1: "string1",
      bytes1: Uint8List.fromList("some bytes".codeUnits),
      f0: 0x1234567890abcdef,
      f1: 0x1234567890abcdef,
      f2: 1.2345678901234567890,
      f3: 0x12345678,
      f4: 0x12345678,
      f5: 1.2345678901234567890,
      f6: 0x1234,
      f7: 0x12,
      f8: -0x12,
      array2: [2, 3, 4, 5],
      map2: {"0": 0.0},
      string2: "some string2",
      bytes2: Uint8List.fromList("some bytes2".codeUnits),
      flag1: 0x1,
      flag2: 0x2,
      flag3: 0x3,
      flag4: 0x4,
    ),
  ),
];
