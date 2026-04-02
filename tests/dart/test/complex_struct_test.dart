import 'dart:typed_data';
import 'package:test/test.dart';
import '../../../build-dart-test/msgs/mynamespace/types/simple_struct_gen.dart';
import '../../../build-dart-test/msgs/mynamespace/types/var_size_struct_gen.dart';
import '../../../build-dart-test/msgs/mynamespace/types/simple_enum_gen.dart';
import '../../../build-dart-test/msgs/mynamespace/types/simple_bitset_gen.dart';
import '../../../build-dart-test/msgs/mynamespace/types/subspace/complex_struct_gen.dart';

void main() {
  group('Complex Structure Tests', () {
    test('Nested vectors of structs', () {
      final varSize = VarSizeStruct(
        f0: 0x1234,
        f1Vec: [1, 2, 3],
        str: "test",
      );

      final struct = ComplexStruct(
        bitset0: SimpleBitset(0),
        arrSimpleStruct: [SimpleStruct.empty(), SimpleStruct.empty()],
        arrInt: [1, 2, 3, 4],
        arrVarSizeStruct: [varSize, varSize],
        vecFloat: [1.0, 2.0],
        vecEnum: [SimpleEnum.oneValue],
        vecSimpleStruct: [SimpleStruct.empty()],
        vecVecVarSizeStruct: [
          [varSize, varSize],
        ],
        vecArrVecInt: [
          [[1, 2], [3, 4], [5, 6], [7, 8]],
        ],
        str: "nested test",
        strVec: ["a", "b"],
        bs: Uint8List(0),
        mapStrByInt: {},
        mapVecByStr: {},
        arrayOfSizeZero: [],
      );

      final size = struct.serializedSize();
      final buffer = Uint8List(size);
      final bytesWritten = struct.serialize(buffer);

      expect(bytesWritten, equals(size));

      // Deserialize and verify nested structures
      final decoded = ComplexStruct.empty();
      final bytesRead = decoded.deserialize(buffer);

      expect(bytesRead, equals(size));
      expect(decoded.vecVecVarSizeStruct.length, equals(1));
      expect(decoded.vecVecVarSizeStruct[0].length, equals(2));
      expect(decoded.vecArrVecInt.length, equals(1));
      expect(decoded.vecArrVecInt[0].length, equals(4));
    });

    test('Empty arrays and vectors', () {
      final struct = ComplexStruct(
        bitset0: SimpleBitset(0),
        arrSimpleStruct: [SimpleStruct.empty(), SimpleStruct.empty()],
        arrInt: [0, 0, 0, 0],
        arrVarSizeStruct: [VarSizeStruct.empty(), VarSizeStruct.empty()],
        vecFloat: [], // Empty vector
        vecEnum: [], // Empty vector
        vecSimpleStruct: [], // Empty vector
        vecVecVarSizeStruct: [], // Empty nested vector
        vecArrVecInt: [], // Empty nested vector
        str: "",
        strVec: [],
        bs: Uint8List(0),
        mapStrByInt: {},
        mapVecByStr: {},
        arrayOfSizeZero: [],
      );

      final size = struct.serializedSize();
      final buffer = Uint8List(size);
      final bytesWritten = struct.serialize(buffer);

      expect(bytesWritten, equals(size));

      // Deserialize and verify empty collections
      final decoded = ComplexStruct.empty();
      final bytesRead = decoded.deserialize(buffer);

      expect(bytesRead, equals(size));
      expect(decoded.vecFloat.length, equals(0));
      expect(decoded.vecEnum.length, equals(0));
      expect(decoded.vecSimpleStruct.length, equals(0));
      expect(decoded.vecVecVarSizeStruct.length, equals(0));
      expect(decoded.vecArrVecInt.length, equals(0));
      expect(decoded.strVec.length, equals(0));
    });

    test('Maps with struct values', () {
      final struct = ComplexStruct(
        bitset0: SimpleBitset(0),
        arrSimpleStruct: [SimpleStruct.empty(), SimpleStruct.empty()],
        arrInt: [1, 2, 3, 4],
        arrVarSizeStruct: [VarSizeStruct.empty(), VarSizeStruct.empty()],
        vecFloat: [1.0],
        vecEnum: [SimpleEnum.oneValue],
        vecSimpleStruct: [SimpleStruct.empty()],
        vecVecVarSizeStruct: [],
        vecArrVecInt: [],
        str: "test",
        bs: Uint8List(0),
        strVec: ["test"],
        mapStrByInt: {
          1: "one",
          2: "two",
          3: "three",
        },
        mapVecByStr: {
          "key1": [1, 2, 3],
          "key2": [4, 5, 6],
        },
        arrayOfSizeZero: [],
      );

      final size = struct.serializedSize();
      final buffer = Uint8List(size);
      final bytesWritten = struct.serialize(buffer);

      expect(bytesWritten, equals(size));

      // Deserialize and verify maps
      final decoded = ComplexStruct.empty();
      final bytesRead = decoded.deserialize(buffer);

      expect(bytesRead, equals(size));
      expect(decoded.mapStrByInt.length, equals(3));
      expect(decoded.mapVecByStr.length, equals(2));
    });

    test('Deeply nested arrays', () {
      final struct = ComplexStruct(
        bitset0: SimpleBitset(0),
        arrSimpleStruct: [SimpleStruct.empty(), SimpleStruct.empty()],
        arrInt: [1, 2, 3, 4],
        arrVarSizeStruct: [VarSizeStruct.empty(), VarSizeStruct.empty()],
        vecFloat: [],
        vecEnum: [],
        vecSimpleStruct: [],
        vecVecVarSizeStruct: [],
        vecArrVecInt: [
          [[1, 2, 3], [4, 5, 6], [7, 8, 9], [10, 11, 12]],
          [[13, 14, 15], [16, 17, 18], [19, 20, 21], [22, 23, 24]],
        ],
        str: "test",
        strVec: [],
        bs: Uint8List(0),
        mapStrByInt: {},
        mapVecByStr: {},
        arrayOfSizeZero: [],
      );

      final size = struct.serializedSize();
      final buffer = Uint8List(size);
      final bytesWritten = struct.serialize(buffer);

      expect(bytesWritten, equals(size));

      // Deserialize and verify deeply nested structure
      final decoded = ComplexStruct.empty();
      final bytesRead = decoded.deserialize(buffer);

      expect(bytesRead, equals(size));
      expect(decoded.vecArrVecInt.length, equals(2));
      expect(decoded.vecArrVecInt[0].length, equals(4));
      expect(decoded.vecArrVecInt[0][0].length, equals(3));
      expect(decoded.vecArrVecInt[1][3][2], equals(24));
    });

    test('Large vectors', () {
      final largvecEnum = List.generate(1000, (i) => i);
      
      final struct = ComplexStruct(
        bitset0: SimpleBitset(0),
        arrSimpleStruct: [SimpleStruct.empty(), SimpleStruct.empty()],
        arrInt: [1, 2, 3, 4],
        arrVarSizeStruct: [VarSizeStruct.empty(), VarSizeStruct.empty()],
        vecFloat: List.generate(500, (i) => i.toDouble()),
        vecEnum: [],
        vecSimpleStruct: [],
        vecVecVarSizeStruct: [],
        vecArrVecInt: [],
        str: "large",
        bs: Uint8List(100),
        strVec: List.generate(100, (i) => "string$i"),
        mapStrByInt: {},
        mapVecByStr: {
          "large": largvecEnum,
        },
        arrayOfSizeZero: [],
      );

      final size = struct.serializedSize();
      final buffer = Uint8List(size);
      final bytesWritten = struct.serialize(buffer);

      expect(bytesWritten, equals(size));

      // Deserialize and verify large collections
      final decoded = ComplexStruct.empty();
      final bytesRead = decoded.deserialize(buffer);

      expect(bytesRead, equals(size));
      expect(decoded.vecFloat.length, equals(500));
      expect(decoded.strVec.length, equals(100));
      expect(decoded.mapVecByStr["large"]!.length, equals(1000));
    });

    test('String edge cases', () {
      final struct = ComplexStruct(
        bitset0: SimpleBitset(0),
        arrSimpleStruct: [SimpleStruct.empty(), SimpleStruct.empty()],
        arrInt: [1, 2, 3, 4],
        arrVarSizeStruct: [VarSizeStruct.empty(), VarSizeStruct.empty()],
        vecFloat: [],
        vecEnum: [],
        vecSimpleStruct: [],
        vecVecVarSizeStruct: [],
        vecArrVecInt: [],
        str: "", // Empty string
        strVec: [
          "", // Empty string
          "a", // Single character
          "Very long string " * 100, // Long string
          "Special chars: 🎉🚀✨", // Unicode
        ],
        bs: Uint8List(0),
        mapStrByInt: {},
        mapVecByStr: {},
        arrayOfSizeZero: [],
      );

      final size = struct.serializedSize();
      final buffer = Uint8List(size);
      final bytesWritten = struct.serialize(buffer);

      expect(bytesWritten, equals(size));

      // Deserialize and verify strings
      final decoded = ComplexStruct.empty();
      final bytesRead = decoded.deserialize(buffer);

      expect(bytesRead, equals(size));
      expect(decoded.str, equals(""));
      expect(decoded.strVec.length, equals(4));
      expect(decoded.strVec[0], equals(""));
      expect(decoded.strVec[1], equals("a"));
      expect(decoded.strVec[2].length, greaterThan(1000));
      expect(decoded.strVec[3], contains("🎉"));
    });
  });
}
