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
      final (decoded, bytesRead) = ComplexStruct.deserialize(buffer);

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
      final (decoded, bytesRead) = ComplexStruct.deserialize(buffer);

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
      final (decoded, bytesRead) = ComplexStruct.deserialize(buffer);

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
      final (decoded, bytesRead) = ComplexStruct.deserialize(buffer);

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
      final (decoded, bytesRead) = ComplexStruct.deserialize(buffer);

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
      final (decoded, bytesRead) = ComplexStruct.deserialize(buffer);

      expect(bytesRead, equals(size));
      expect(decoded.str, equals(""));
      expect(decoded.strVec.length, equals(4));
      expect(decoded.strVec[0], equals(""));
      expect(decoded.strVec[1], equals("a"));
      expect(decoded.strVec[2].length, greaterThan(1000));
      expect(decoded.strVec[3], contains("🎉"));
    });

    test('ComplexStruct Deep Copy and Reference Isolation', () {
      // 1. Create a fully populated initial struct
      final original = ComplexStruct(
        bitset0: SimpleBitset(SimpleBitset.one),
        arrSimpleStruct: [
          SimpleStruct(
              f0: 1, f1: 2, f1Pad: 0, f2: 3.14, f3: 4, f4: 5,
              f5: 6.0, f6: 7, f7: 8, f8: 9, f9: true,
              e0: SimpleEnum.oneValue, b0: SimpleBitset(0)
          ),
        ],
        arrInt: [10, 20],
        arrVarSizeStruct: [
          VarSizeStruct(f0: 100, f1Vec: [1, 2], str: "inner")
        ],
        vecFloat: [1.1, 2.2],
        vecEnum: [SimpleEnum.anotherValue],
        vecSimpleStruct: [],
        vecVecVarSizeStruct: [
          [VarSizeStruct(f0: 5, f1Vec: [5], str: "nested")]
        ],
        vecArrVecInt: [
          [
            [1, 2], [3, 4]
          ]
        ],
        str: "Original",
        bs: Uint8List.fromList([0xDE, 0xAD, 0xBE, 0xEF]),
        strVec: ["A", "B"],
        mapStrByInt: {1: "One"},
        mapVecByStr: {"List": [7, 8, 9]},
        arrayOfSizeZero: [],
      );

      // 2. Perform a Deep Copy using copyWith with specific overrides
      final copy = original.copyWith(
        str: "Modified",
        vecFloat: [9.9], // Overriding a list
      );

      // 3. Verify that overrides worked but other fields remain deep-equal
      expect(copy.str, equals("Modified"));
      expect(original.str, equals("Original"));
      expect(copy.vecFloat, equals([9.9]));
      expect(original.vecFloat, equals([1.1, 2.2]));

      // Verify deep equality on un-overridden complex fields
      expect(copy.vecArrVecInt, equals(original.vecArrVecInt));
      expect(copy.bitset0.value, equals(original.bitset0.value));

      // 4. Test Reference Isolation (The "Deep" part of the copy)

      // Modify a list inside the original to see if 'copy' changes
      try {
        original.arrInt.add(999);
        original.bs[0] = 0x00;
        original.vecArrVecInt[0][0].add(100);

        expect(copy.arrInt.contains(999), isFalse, reason: "Shallow copy detected in arrInt");
        expect(copy.bs[0], equals(0xDE), reason: "Shallow copy detected in Uint8List");
        expect(copy.vecArrVecInt[0][0].length, equals(2), reason: "Shallow copy detected in 3D list");
      } on UnsupportedError {
        print("Lists are unmodifiable, isolation is enforced by the runtime.");
      }
    });
  });
}
