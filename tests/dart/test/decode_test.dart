import 'dart:io';
import 'package:test/test.dart';
import '../../../build-dart-test/msgs/mynamespace/types/simple_struct_gen.dart';
import '../../../build-dart-test/msgs/mynamespace/types/var_size_struct_gen.dart';
import '../../../build-dart-test/msgs/mynamespace/types/empty_struct_gen.dart';
import '../../../build-dart-test/msgs/mynamespace/types/flat_struct_gen.dart';
import '../../../build-dart-test/msgs/mynamespace/types/complex_types_with_flat_groups_gen.dart';
import '../../../build-dart-test/msgs/mynamespace/types/subspace/complex_struct_gen.dart';

void main() {
  group('Decode Tests', () {
    test('SimpleStruct decode', () {
      final file = File('../serialized_data/simple_struct.bin');
      final data = file.readAsBytesSync();

      final (struct, bytesRead) = SimpleStruct.deserialize(data);

      expect(bytesRead, equals(data.length));
      expect(struct.serializedSize(), equals(data.length));
      expect(struct.f0, equals(0x1234567890abcdef));
      expect(struct.f1, equals(0x1234567890abcdef));
      expect(struct.f1Pad, equals(0x12));
      expect(struct.f2, closeTo(1.2345678901234567890, 0.0001));
      expect(struct.f3, equals(0x12345678));
      expect(struct.f4, equals(0x12345678));
      expect(struct.f5, closeTo(1.2345678901234567890, 0.0001));
      expect(struct.f6, equals(0x1234));
      expect(struct.f7, equals(0x12));
      expect(struct.f8, equals(-0x12));
      expect(struct.f9, isTrue);
    });

    test('VarSizeStruct decode', () {
      final file = File('../serialized_data/var_size_struct.bin');
      final data = file.readAsBytesSync();

      final (struct, bytesRead) = VarSizeStruct.deserialize(data);

      expect(bytesRead, equals(data.length));
      expect(struct.f0, equals(0x1234567890abcdef));
      expect(struct.f1Vec.length, equals(3));
      expect(struct.f1Vec[0], equals(-0x1234567890abcdef));
      expect(struct.f1Vec[1], equals(5));
      expect(struct.f1Vec[2], equals(1));
      expect(struct.str, equals("Hello messgen!"));
    });

    test('EmptyStruct decode', () {
      final file = File('../serialized_data/empty_struct.bin');
      final data = file.readAsBytesSync();

      final (struct, bytesRead) = EmptyStruct.deserialize(data);

      expect(bytesRead, equals(0));
      expect(struct.serializedSize(), equals(0));
    });

    test('FlatStruct decode', () {
      final file = File('../serialized_data/flat_struct.bin');
      final data = file.readAsBytesSync();

      final (struct, bytesRead)= FlatStruct.deserialize(data);

      expect(bytesRead, equals(data.length));
      expect(struct.serializedSize(), equals(data.length));
      expect(struct.f0, equals(0x1234567890abcdef));
      expect(struct.f1, equals(0x1234567890abcdef));
      expect(struct.f2, closeTo(1.2345678901234567890, 0.0001));
      expect(struct.f3, equals(0x12345678));
      expect(struct.f4, equals(0x12345678));
      expect(struct.f5, closeTo(1.2345678901234567890, 0.0001));
      expect(struct.f6, equals(0x1234));
      expect(struct.f7, equals(0x12));
      expect(struct.f8, equals(-0x12));
    });

    test('ComplexStruct decode', () {
      final file = File('../serialized_data/complex_struct.bin');
      final data = file.readAsBytesSync();

      final (struct, bytesRead) = ComplexStruct.deserialize(data);

      expect(bytesRead, equals(data.length));
      expect(struct.arrSimpleStruct.length, equals(2));
      expect(struct.arrInt.length, equals(4));
      expect(struct.arrVarSizeStruct.length, equals(2));
      expect(struct.vecFloat.length, equals(3));
      expect(struct.vecEnum.length, equals(2));
      expect(struct.vecSimpleStruct.length, equals(3));
      expect(struct.str, equals("Example String"));
      expect(struct.strVec.length, equals(3));
      expect(struct.mapStrByInt.length, equals(3));
      expect(struct.mapVecByStr.length, equals(3));
    });

    test('ComplexTypesWithFlatGroups decode', () {
      final file = File('../serialized_data/complex_types_with_flat_groups.bin');
      final data = file.readAsBytesSync();

      final (struct, bytesRead) = ComplexTypesWithFlatGroups.deserialize(data);

      expect(bytesRead, equals(data.length));
      expect(struct.vec1.length, equals(6));
      expect(struct.map1.length, equals(2));
      expect(struct.string1, equals("string1"));
      expect(struct.f0, equals(0x1234567890abcdef));
      expect(struct.vec2.length, equals(4));
      expect(struct.map2.length, equals(2));
      expect(struct.string2, equals("some string2"));
    });

    test('ComplexTypesWithFlatGroups with single item map decode', () {
      final file = File('../serialized_data/complex_types_with_flat_groups_with_single_item_map.bin');
      final data = file.readAsBytesSync();

      final (struct, bytesRead) = ComplexTypesWithFlatGroups.deserialize(data);

      expect(bytesRead, equals(data.length));
      expect(struct.vec1.length, equals(6));
      expect(struct.map1.length, equals(1));
      expect(struct.string1, equals("string1"));
      expect(struct.f0, equals(0x1234567890abcdef));
      expect(struct.vec2.length, equals(4));
      expect(struct.map2.length, equals(1));
      expect(struct.string2, equals("some string2"));
    });
  });
}
