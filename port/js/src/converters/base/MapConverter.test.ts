import { describe, expect, it } from 'vitest';
import { Buffer } from '../../Buffer';
import { ConverterFactory } from '../ConverterFactory';

describe('MapConverter', () => {
  it.each(['Map', 'Record'])('should round-trip a large string map from a %s', (inputType) => {
    const factory = new ConverterFactory();
    const converter = factory.toConverter('string{string}');
    const nextConverter = factory.toConverter('uint32');
    const expected = new Map<string, string>([
      ['', ''],
      ['__proto__', 'constructor'],
      ['日本語🌍', 'Привет мир!'],
    ]);
    for (let i = 0; i < 1_000; i++) {
      expected.set(`key:${i}:`.padEnd(100, 'k'), `value:${i}:`.padEnd(200, 'v'));
    }
    const input = inputType === 'Map' ? expected : Object.fromEntries(expected);
    const buffer = new Buffer(new ArrayBuffer(converter.size(input) + 4));
    converter.serialize(input, buffer);
    nextConverter.serialize(0x12345678, buffer);
    expect(buffer.offset).toBe(buffer.size);

    buffer.offset = 0;
    expect(converter.deserialize(buffer)).toEqual(expected);
    expect(nextConverter.deserialize(buffer)).toBe(0x12345678);
    expect(buffer.offset).toBe(buffer.size);
  });
});
