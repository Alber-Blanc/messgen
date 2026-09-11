import { describe, expect, it } from 'vitest';
import { Buffer } from '../../Buffer';
import { ConverterFactory } from '../ConverterFactory';

describe.each(['Map', 'Record'])('MapConverter with %s input', (inputType) => {
  it('writes the complete map and following field', () => {
    const { converter, nextConverter, input, buffer } = createFixture(inputType);

    converter.serialize(input, buffer);
    nextConverter.serialize(0x12345678, buffer);

    expect(buffer.offset).toBe(buffer.size);
  });

  it('round-trips a large string map', () => {
    const { converter, input, buffer, expected } = createFixture(inputType);
    converter.serialize(input, buffer);
    buffer.offset = 0;

    const result = converter.deserialize(buffer);

    expect(result).toEqual(expected);
  });

  it('preserves the field after a large string map', () => {
    const { converter, nextConverter, input, buffer } = createFixture(inputType);
    converter.serialize(input, buffer);
    nextConverter.serialize(0x12345678, buffer);
    buffer.offset = 0;

    converter.deserialize(buffer);
    const nextValue = nextConverter.deserialize(buffer);

    expect(nextValue).toBe(0x12345678);
  });

  it('advances past the map and following field', () => {
    const { converter, nextConverter, input, buffer } = createFixture(inputType);
    converter.serialize(input, buffer);
    nextConverter.serialize(0x12345678, buffer);
    buffer.offset = 0;

    converter.deserialize(buffer);
    nextConverter.deserialize(buffer);

    expect(buffer.offset).toBe(buffer.size);
  });
});

function createFixture(inputType: string) {
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
  return { converter, nextConverter, input, buffer, expected };
}
