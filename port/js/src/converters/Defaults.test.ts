import { describe, expect, it } from 'vitest';
import { ConverterFactory } from './ConverterFactory';
import type { Converter } from './Converter';
import { Protocols } from '../protocol';
import { Cursor } from '../Cursor';

describe('converter defaults', () => {
  it.each([
    ['int8', 0],
    ['uint8', 0],
    ['int16', 0],
    ['uint16', 0],
    ['int32', 0],
    ['uint32', 0],
    ['int64', 0n],
    ['uint64', 0n],
    ['float32', 0],
    ['float64', 0],
    ['string', ''],
    ['char', ' '],
    ['bool', false],
    ['bytes', new Uint8Array(0)],
    ['string[2]', ['', '']],
    ['uint32[2]', new Uint32Array(2)],
    ['string[]', []],
    ['string{string}', new Map()],
  ])('creates serializable defaults for %s', (name, expected) => {
    const converter = new ConverterFactory().toConverter(name as string);
    expect(converter.createDefault()).toEqual(expected);
    expect(converter.default()).toEqual(expected);
    const cursor = new Cursor(new ArrayBuffer(converter.size(expected)));
    converter.serialize(expected, cursor);
    expect(cursor.offset).toBe(cursor.size);
    cursor.offset = 0;
    expect(converter.deserialize(cursor)).toEqual(expected);
  });

  it('creates independent nested values even when child converters are reused', () => {
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
    type Parent = {
      name: string;
      children: { labels: string[] }[];
      lookup: Map<string, { labels: string[] }>;
      bytes: Uint8Array;
      numbers: Uint32Array;
    };
    const converter = new ConverterFactory(protocols).toConverter('Parent') as Converter<Parent>;
    const first = converter.createDefault();
    const second = converter.default();
    const expected = {
      name: '',
      children: [{ labels: [] }, { labels: [] }],
      lookup: new Map(),
      bytes: new Uint8Array(0),
      numbers: new Uint32Array(2),
    };
    expect(first).toEqual(expected);
    expect(first.bytes).not.toBe(second.bytes);

    first.name = 'changed';
    first.children[0].labels.push('changed');
    first.lookup.set('changed', first.children[0]);
    first.numbers[0] = 42;
    expect(first.children[1].labels).toEqual([]);
    expect(second).toEqual(expected);

    const cursor = new Cursor(new ArrayBuffer(converter.size(second)));
    converter.serialize(second, cursor);
    cursor.offset = 0;
    expect(converter.deserialize(cursor)).toEqual(expected);
    expect(cursor.offset).toBe(cursor.size);
  });

  it.each(['uint16', 'uint64'])('uses the first declared enum value for %s', (type) => {
    const protocols = new Protocols();
    protocols.load([
      {
        type: 'State',
        type_class: 'enum',
        base_type: type as 'uint16' | 'uint64',
        hash: '0',
        values: [
          { name: 'START', value: 7 },
          { name: 'END', value: 12 },
        ],
      },
    ]);
    const converter = new ConverterFactory(protocols).toConverter('State');
    const value = converter.createDefault();
    expect(value).toBe(type === 'uint64' ? 7n : 7);
    const cursor = new Cursor(new ArrayBuffer(converter.size(value)));
    converter.serialize(value, cursor);
    cursor.offset = 0;
    expect(converter.deserialize(cursor)).toBe(value);
  });

  it('creates a fresh decimal value', () => {
    const converter = new ConverterFactory().toConverter('dec64');
    expect(converter.createDefault()).toEqual(converter.createDefault());
    expect(converter.createDefault()).not.toBe(converter.createDefault());
  });
});
