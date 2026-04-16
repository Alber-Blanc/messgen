import 'dart:typed_data';
import 'package:test/test.dart';
import '../../../build-dart-test/msgs/mynamespace/proto/test_proto/proto_gen.dart';
import '../../../build-dart-test/msgs/mynamespace/proto/subspace/another_proto/proto_gen.dart';
import '../../../build-dart-test/msgs/mynamespace/types/simple_struct_gen.dart';
import '../../../build-dart-test/msgs/mynamespace/types/subspace/complex_struct_gen.dart';
import '../../../build-dart-test/msgs/mynamespace/types/var_size_struct_gen.dart';

/// Serialize an empty instance into a fresh buffer and return it.
Uint8List _emptyBytes(dynamic s) {
  final size = (s.serializedSize() as int);
  final buf = Uint8List(size);
  s.serialize(buf);
  return buf;
}

void main() {
  group('Protocol Constructor Map Tests', () {
    test('TestProtoProtocol messageIdToConstructor map exists and has correct entries', () {
      // Verify the map exists
      expect(TestProtoProtocol.messageIdToConstructor, isNotNull);
      
      // Verify it contains the expected message IDs
      expect(TestProtoProtocol.messageIdToConstructor.containsKey(0), isTrue);
      expect(TestProtoProtocol.messageIdToConstructor.containsKey(1), isTrue);
      expect(TestProtoProtocol.messageIdToConstructor.containsKey(2), isTrue);
      
      // Verify that calling the constructors creates valid instances
      final (simpleStruct, _) = TestProtoProtocol.messageIdToConstructor[0]!(_emptyBytes(SimpleStruct.empty()));
      expect(simpleStruct, isA<SimpleStruct>());
      
      final (complexStruct, _) = TestProtoProtocol.messageIdToConstructor[1]!(_emptyBytes(ComplexStruct.empty()));
      expect(complexStruct, isA<ComplexStruct>());
      
      final (varSizeStruct, _) = TestProtoProtocol.messageIdToConstructor[2]!(_emptyBytes(VarSizeStruct.empty()));
      expect(varSizeStruct, isA<VarSizeStruct>());
    });

    test('AnotherProtoProtocol messageIdToConstructor map exists and has correct entries', () {
      // Verify the map exists
      expect(AnotherProtoProtocol.messageIdToConstructor, isNotNull);
      
      // Verify it contains the expected message ID
      expect(AnotherProtoProtocol.messageIdToConstructor.containsKey(0), isTrue);
      
      // Verify that calling the constructor creates a valid instance
      final (simpleStruct, _) = AnotherProtoProtocol.messageIdToConstructor[0]!(_emptyBytes(SimpleStruct.empty()));
      expect(simpleStruct, isA<SimpleStruct>());
    });

    test('Constructor map creates empty instances that can be deserialized', () {
      // Create an instance using the constructor map
      final (struct, _) = TestProtoProtocol.messageIdToConstructor[0]!(_emptyBytes(SimpleStruct.empty()));
      
      // Verify it's a SimpleStruct
      expect(struct, isA<SimpleStruct>());
      
      // Verify it has the empty() constructor behavior
      final simpleStruct = struct as SimpleStruct;
      expect(simpleStruct.f0, equals(0));
      expect(simpleStruct.f9, equals(false));
    });

    test('All message IDs in protocol have constructors', () {
      // For TestProtoProtocol, verify that we have constructors for known message IDs
      final expectedIds = [0, 1, 2, 4, 9, 10];
      for (var id in expectedIds) {
        expect(TestProtoProtocol.messageIdToConstructor.containsKey(id), isTrue,
            reason: 'Missing constructor for message ID $id',);
      }
    });
  });
}
