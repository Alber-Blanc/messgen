import 'package:test/test.dart';
import '../../../build-dart-test/msgs/mynamespace/types/simple_bitset_gen.dart';

void main() {
  group('Bitset Tests', () {
    test('Bitset set and has operations', () {
      final bitset = SimpleBitset(0);

      bitset.set(SimpleBitset.one);
      bitset.set(SimpleBitset.error);

      expect(bitset.value, int.parse('101', radix: 2));
      expect(bitset.has(SimpleBitset.one), isTrue);
      expect(bitset.has(SimpleBitset.two), isFalse);
      expect(bitset.has(SimpleBitset.error), isTrue);
    });

    test('Bitset clear operation', () {
      final bitset = SimpleBitset(int.parse('111', radix: 2));

      expect(bitset.has(SimpleBitset.one), isTrue);
      expect(bitset.has(SimpleBitset.two), isTrue);
      expect(bitset.has(SimpleBitset.error), isTrue);

      bitset.clear(SimpleBitset.two);

      expect(bitset.value, int.parse('101', radix: 2));
      expect(bitset.has(SimpleBitset.one), isTrue);
      expect(bitset.has(SimpleBitset.two), isFalse);
      expect(bitset.has(SimpleBitset.error), isTrue);
    });

    test('Bitset toString', () {
      final bitset = SimpleBitset(0);
      bitset.set(SimpleBitset.one);
      bitset.set(SimpleBitset.error);

      final str = bitset.toString();
      expect(str, equals('{one | error}'));
    });

    test('Empty bitset toString', () {
      final bitset = SimpleBitset(0);
      expect(bitset.toString(), equals('{}'));
    });
  });
}
