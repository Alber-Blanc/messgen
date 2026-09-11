import { Buffer as NodeBuffer } from 'node:buffer';
import { bench, describe } from 'vitest';
import { Cursor } from '../src/Cursor';
import { ScalarConverter } from '../src/converters/base/ScalarConverter';
import { Utf8Codec } from '../src/utils/utf8';

const encoder = new TextEncoder();
const converter = new ScalarConverter('string');
const cases = [
  ['short ASCII', 'hello world'],
  ['medium ASCII', 'The quick brown fox jumps over the lazy dog. '.repeat(5)],
  ['long ASCII', 'a'.repeat(10_000)],
  ['short Unicode', 'héllo wörld 🌍'],
  ['medium Unicode', 'Привет мир! Καλημέρα κόσμε. '.repeat(10)],
  ['long Unicode', 'Привет мир 🌍 hello world '.repeat(500)],
];

for (const [name, value] of cases) {
  const cursor = new Cursor(new ArrayBuffer(converter.size(value)));
  converter.serialize(value, cursor);
  const encoded = cursor.buffer;

  describe(`UTF-8: ${name}`, () => {
    bench('byte length: Utf8Codec', () => {
      Utf8Codec.byteLength(value);
    });
    bench('byte length: TextEncoder (allocates)', () => {
      encoder.encode(value).length;
    });
    bench('byte length: Node Buffer', () => {
      NodeBuffer.byteLength(value, 'utf8');
    });
    bench('serialize: size + allocation + write', () => {
      const destination = new Cursor(new ArrayBuffer(converter.size(value)));
      converter.serialize(value, destination);
    });
    bench('deserialize', () => {
      converter.deserialize(new Cursor(encoded));
    });
  });
}
