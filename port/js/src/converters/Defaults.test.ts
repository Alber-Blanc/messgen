import { describe, expect, it } from 'vitest';
import { ConverterFactory } from './ConverterFactory';
import type { Converter } from './Converter';
import { Protocols } from '../protocol';
import { Cursor } from '../Cursor';

const defaults = [
  { type: 'int8', expected: 0 },
  { type: 'uint8', expected: 0 },
  { type: 'int16', expected: 0 },
  { type: 'uint16', expected: 0 },
  { type: 'int32', expected: 0 },
  { type: 'uint32', expected: 0 },
  { type: 'int64', expected: 0n },
  { type: 'uint64', expected: 0n },
  { type: 'float32', expected: 0 },
  { type: 'float64', expected: 0 },
  { type: 'string', expected: '' },
  { type: 'char', expected: ' ' },
  { type: 'bool', expected: false },
  { type: 'bytes', expected: new Uint8Array(0) },
  { type: 'string[2]', expected: ['', ''] },
  { type: 'uint32[2]', expected: new Uint32Array(2) },
  { type: 'string[]', expected: [] },
  { type: 'string{string}', expected: new Map() },
];

describe('converter defaults', () => {
  describe.each(defaults)('$type', ({ type, expected }) => {
    it('should create the expected default', () => {
      const converter = new ConverterFactory().toConverter(type);

      const value = converter.createDefault();

      expect(value).toEqual(expected);
    });

    it('should serialize a default into an exact-size buffer', () => {
      const converter = new ConverterFactory().toConverter(type);
      const value = converter.createDefault();
      const cursor = new Cursor(new ArrayBuffer(converter.size(value)));

      converter.serialize(value, cursor);

      expect(cursor.offset).toBe(cursor.size);
    });

    it('should round-trip the default', () => {
      const converter = new ConverterFactory().toConverter(type);
      const value = converter.createDefault();
      const cursor = new Cursor(new ArrayBuffer(converter.size(value)));
      converter.serialize(value, cursor);
      cursor.offset = 0;

      const decoded = converter.deserialize(cursor);

      expect(decoded).toEqual(expected);
    });
  });

  it('should create the expected nested default', () => {
    const converter = createParentConverter();

    const value = converter.createDefault();

    expect(value).toEqual(createExpectedParent());
  });

  it('should create independent byte containers', () => {
    const converter = createParentConverter();
    const first = converter.createDefault();

    const second = converter.createDefault();

    expect(second.bytes).not.toBe(first.bytes);
  });

  it('should keep sibling array elements independent', () => {
    const value = createParentConverter().createDefault();

    value.children[0].labels.push('changed');

    expect(value.children[1].labels).toEqual([]);
  });

  it('should keep nested defaults independent between calls', () => {
    const converter = createParentConverter();
    const first = converter.createDefault();
    const second = converter.createDefault();

    first.name = 'changed';
    first.children[0].labels.push('changed');
    first.lookup.set('changed', first.children[0]);
    first.numbers[0] = 42;

    expect(second).toEqual(createExpectedParent());
  });

  it('should round-trip the nested default', () => {
    const converter = createParentConverter();
    const value = converter.createDefault();
    const cursor = new Cursor(new ArrayBuffer(converter.size(value)));
    converter.serialize(value, cursor);
    cursor.offset = 0;

    const decoded = converter.deserialize(cursor);

    expect(decoded).toEqual(createExpectedParent());
  });

  it('should advance past the nested default', () => {
    const converter = createParentConverter();
    const value = converter.createDefault();
    const cursor = new Cursor(new ArrayBuffer(converter.size(value)));
    converter.serialize(value, cursor);
    cursor.offset = 0;

    converter.deserialize(cursor);

    expect(cursor.offset).toBe(cursor.size);
  });

  describe.each(['uint16', 'uint64'] as const)('enum based on %s', (type) => {
    it('should use the first declared numeric value', () => {
      const converter = createEnumConverter(type);

      const value = converter.createDefault();

      expect(value).toBe(type === 'uint64' ? 7n : 7);
    });

    it('should round-trip the enum default', () => {
      const converter = createEnumConverter(type);
      const value = converter.createDefault();
      const cursor = new Cursor(new ArrayBuffer(converter.size(value)));
      converter.serialize(value, cursor);
      cursor.offset = 0;

      const decoded = converter.deserialize(cursor);

      expect(decoded).toBe(value);
    });
  });

  it('should create equal decimal defaults', () => {
    const converter = new ConverterFactory().toConverter('dec64');
    const first = converter.createDefault();

    const second = converter.createDefault();

    expect(second).toEqual(first);
  });

  it('should create independent decimal defaults', () => {
    const converter = new ConverterFactory().toConverter('dec64');
    const first = converter.createDefault();

    const second = converter.createDefault();

    expect(second).not.toBe(first);
  });
});

type Parent = {
  name: string;
  children: { labels: string[] }[];
  lookup: Map<string, { labels: string[] }>;
  bytes: Uint8Array;
  numbers: Uint32Array;
};

function createParentConverter(): Converter<Parent> {
  const protocols = new Protocols();
  protocols.load([
    { type: 'Child', type_class: 'struct', hash: '0', fields: [{ name: 'labels', type: 'string[]' }] },
    {
      type: 'Parent',
      type_class: 'struct',
      hash: '0',
      fields: [
        { name: 'name', type: 'string' },
        { name: 'children', type: 'Child[2]' },
        { name: 'lookup', type: 'Child{string}' },
        { name: 'bytes', type: 'bytes' },
        { name: 'numbers', type: 'uint32[2]' },
      ],
    },
  ]);
  return new ConverterFactory(protocols).toConverter('Parent') as Converter<Parent>;
}

function createExpectedParent(): Parent {
  return {
    name: '',
    children: [{ labels: [] }, { labels: [] }],
    lookup: new Map(),
    bytes: new Uint8Array(0),
    numbers: new Uint32Array(2),
  };
}

function createEnumConverter(type: 'uint16' | 'uint64'): Converter {
  const protocols = new Protocols();
  protocols.load([
    {
      type: 'State',
      type_class: 'enum',
      base_type: type,
      hash: '0',
      values: [
        { name: 'START', value: 7 },
        { name: 'END', value: 12 },
      ],
    },
  ]);
  return new ConverterFactory(protocols).toConverter('State');
}
