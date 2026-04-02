import 'package:test/test.dart';
import '../../../build-dart-test/msgs/mynamespace/proto/test_proto/proto_gen.dart';
import '../../../build-dart-test/msgs/mynamespace/proto/subspace/another_proto/proto_gen.dart';
import '../../../build-dart-test/msgs/mynamespace/types/simple_struct_gen.dart';
import '../../../build-dart-test/msgs/mynamespace/types/subspace/complex_struct_gen.dart';
import '../../../build-dart-test/msgs/mynamespace/types/var_size_struct_gen.dart';

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
      var simpleStruct = TestProtoProtocol.messageIdToConstructor[0]!();
      expect(simpleStruct, isA<SimpleStruct>());
      
      var complexStruct = TestProtoProtocol.messageIdToConstructor[1]!();
      expect(complexStruct, isA<ComplexStruct>());
      
      var varSizeStruct = TestProtoProtocol.messageIdToConstructor[2]!();
      expect(varSizeStruct, isA<VarSizeStruct>());
    });

    test('AnotherProtoProtocol messageIdToConstructor map exists and has correct entries', () {
      // Verify the map exists
      expect(AnotherProtoProtocol.messageIdToConstructor, isNotNull);
      
      // Verify it contains the expected message ID
      expect(AnotherProtoProtocol.messageIdToConstructor.containsKey(0), isTrue);
      
      // Verify that calling the constructor creates a valid instance
      var simpleStruct = AnotherProtoProtocol.messageIdToConstructor[0]!();
      expect(simpleStruct, isA<SimpleStruct>());
    });

    test('Constructor map creates empty instances that can be deserialized', () {
      // Create an instance using the constructor map
      var struct = TestProtoProtocol.messageIdToConstructor[0]!();
      
      // Verify it's a SimpleStruct
      expect(struct, isA<SimpleStruct>());
      
      // Verify it has the empty() constructor behavior
      var simpleStruct = struct as SimpleStruct;
      expect(simpleStruct.f0, equals(0));
      expect(simpleStruct.f9, equals(false));
    });

    test('All message IDs in protocol have constructors', () {
      // For TestProtoProtocol, verify that we have constructors for known message IDs
      final expectedIds = [0, 1, 2, 4, 9, 10];
      for (var id in expectedIds) {
        expect(TestProtoProtocol.messageIdToConstructor.containsKey(id), isTrue,
            reason: 'Missing constructor for message ID $id');
      }
    });
  });
}
