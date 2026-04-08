import 'dart:typed_data';
import 'package:test/test.dart';
import '../../../build-dart-test/msgs/mynamespace/types/simple_struct_gen.dart';
import '../../../build-dart-test/msgs/mynamespace/types/var_size_struct_gen.dart';
import '../../../build-dart-test/msgs/mynamespace/types/simple_enum_gen.dart';
import '../../../build-dart-test/msgs/mynamespace/types/empty_struct_gen.dart';
import '../../../build-dart-test/msgs/mynamespace/types/flat_struct_gen.dart';
import '../../../build-dart-test/msgs/mynamespace/types/complex_types_with_flat_groups_gen.dart';
import '../../../build-dart-test/msgs/mynamespace/types/simple_bitset_gen.dart';

void main() {
  group('Encode Tests', () {
    test('SimpleStruct encode and round-trip', () {
      final struct = SimpleStruct(
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
        e0: const SimpleEnum(0),
        b0: SimpleBitset(0),
      );

      final size = struct.serializedSize();
      final buffer = Uint8List(size);
      final bytesWritten = struct.serialize(buffer);

      expect(bytesWritten, equals(size));

      // Round-trip: deserialize and verify
      final (decoded, _) = SimpleStruct.deserialize(buffer);

      expect(decoded.f0, equals(struct.f0));
      expect(decoded.f1, equals(struct.f1));
      expect(decoded.f1Pad, equals(struct.f1Pad));
      expect(decoded.f2, closeTo(struct.f2, 0.0001));
      expect(decoded.f3, equals(struct.f3));
      expect(decoded.f4, equals(struct.f4));
      expect(decoded.f5, closeTo(struct.f5, 0.0001));
      expect(decoded.f6, equals(struct.f6));
      expect(decoded.f7, equals(struct.f7));
      expect(decoded.f8, equals(struct.f8));
      expect(decoded.f9, equals(struct.f9));
    });

    test('VarSizeStruct encode and round-trip', () {
      final struct = VarSizeStruct(
        f0: 0x1234567890abcdef,
        f1Vec: [-0x1234567890abcdef, 5, 1],
        str: "Hello messgen!",
      );

      final size = struct.serializedSize();
      final buffer = Uint8List(size);
      final bytesWritten = struct.serialize(buffer);

      expect(bytesWritten, equals(size));

      // Round-trip: deserialize and verify
      final (decoded, _) = VarSizeStruct.deserialize(buffer);

      expect(decoded.f0, equals(struct.f0));
      expect(decoded.f1Vec.length, equals(struct.f1Vec.length));
      for (int i = 0; i < decoded.f1Vec.length; i++) {
        expect(decoded.f1Vec[i], equals(struct.f1Vec[i]));
      }
      expect(decoded.str, equals(struct.str));
    });

    test('EmptyStruct encode and round-trip', () {
      final struct = EmptyStruct();

      final size = struct.serializedSize();
      final buffer = Uint8List(size);
      final bytesWritten = struct.serialize(buffer);

      expect(bytesWritten, equals(0));
      expect(size, equals(0));
    });

    test('FlatStruct encode and round-trip', () {
      final struct = FlatStruct(
        f0: 0x1234567890abcdef,
        f1: 0x1234567890abcdef,
        f2: 1.2345678901234567890,
        f3: 0x12345678,
        f4: 0x12345678,
        f5: 1.2345678901234567890,
        f6: 0x1234,
        f7: 0x12,
        f8: -0x12,
      );

      final size = struct.serializedSize();
      final buffer = Uint8List(size);
      final bytesWritten = struct.serialize(buffer);

      expect(bytesWritten, equals(size));

      // Round-trip: deserialize and verify
      final (decoded, _) = FlatStruct.deserialize(buffer);

      expect(decoded.f0, equals(struct.f0));
      expect(decoded.f1, equals(struct.f1));
      expect(decoded.f2, closeTo(struct.f2, 0.0001));
      expect(decoded.f3, equals(struct.f3));
      expect(decoded.f4, equals(struct.f4));
      expect(decoded.f5, closeTo(struct.f5, 0.0001));
      expect(decoded.f6, equals(struct.f6));
      expect(decoded.f7, equals(struct.f7));
      expect(decoded.f8, equals(struct.f8));
    });

    test('ComplexTypesWithFlatGroups with single item map encode and round-trip', () {
      final struct = ComplexTypesWithFlatGroups(
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
      );

      final size = struct.serializedSize();
      final buffer = Uint8List(size);
      final bytesWritten = struct.serialize(buffer);

      expect(bytesWritten, equals(size));

      // Round-trip: deserialize and verify
      final (decoded, _) = ComplexTypesWithFlatGroups.deserialize(buffer);

      expect(decoded.array1.length, equals(struct.array1.length));
      expect(decoded.map1.length, equals(struct.map1.length));
      expect(decoded.string1, equals(struct.string1));
      expect(decoded.f0, equals(struct.f0));
      expect(decoded.array2.length, equals(struct.array2.length));
      expect(decoded.map2.length, equals(struct.map2.length));
      expect(decoded.string2, equals(struct.string2));
    });
  });
}
