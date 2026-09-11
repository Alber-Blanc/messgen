import { describe, it, expect } from 'vitest';
import { ConverterFactory } from './ConverterFactory';
import type { IType } from '../types';
import type { Converter } from './Converter';
import { Buffer } from '../Buffer';
import { Protocols } from '../protocol';
import type { StructConverter } from './base/StructConverter';

describe('ConverterFactory', () => {
  it('reuses converters within one factory, including nested fields', () => {
    const protocols = new Protocols();
    protocols.load([
      {
        type: 'Pair',
        type_class: 'struct',
        hash: '0',
        fields: [
          { name: 'left', type: 'string' },
          { name: 'right', type: 'string' },
        ],
      },
    ]);
    const factory = new ConverterFactory(protocols);
    const pair = factory.toConverter('Pair') as StructConverter;
    expect(factory.toConverter('Pair')).toBe(pair);
    expect(pair.convertorsList[0].converter).toBe(factory.toConverter('string'));
    expect(pair.convertorsList[1].converter).toBe(factory.toConverter('string'));
    expect(new ConverterFactory(protocols).toConverter('Pair')).not.toBe(pair);
    expect(pair.parentObject).not.toBe(pair.parentObject);
  });

  it('invalidates cached parents when their schema dependencies are reloaded', () => {
    const protocols = new Protocols();
    protocols.load([
      {
        type: 'Item',
        type_class: 'struct',
        hash: '0',
        fields: [{ name: 'value', type: 'int8' }],
      },
    ]);
    const factory = new ConverterFactory(protocols);
    const before = factory.toConverter('Item[1]');
    expect(before.createDefault()).toEqual([{ value: 0 }]);

    protocols.load([
      {
        type: 'Item',
        type_class: 'struct',
        hash: '1',
        fields: [{ name: 'value', type: 'string' }],
      },
    ]);
    const after = factory.toConverter('Item[1]');
    expect(after).not.toBe(before);
    expect(after.createDefault()).toEqual([{ value: '' }]);
    const value = [{ value: 'updated' }];
    const buffer = new Buffer(new ArrayBuffer(after.size(value)));
    after.serialize(value, buffer);
    buffer.offset = 0;
    expect(after.deserialize(buffer)).toEqual(value);
  });

  it('reports circular schemas and recovers after a failed resolution', () => {
    const protocols = new Protocols();
    protocols.load([
      {
        type: 'Recursive',
        type_class: 'struct',
        hash: '0',
        fields: [{ name: 'child', type: 'Recursive[]' }],
      },
    ]);
    const factory = new ConverterFactory(protocols);
    expect(() => factory.toConverter('Recursive')).toThrow('Circular type dependency: Recursive');
    expect(() => factory.toConverter('Recursive')).toThrow('Circular type dependency: Recursive');
    protocols.load([{ type: 'Recursive', type_class: 'struct', hash: '1', fields: [] }]);
    expect(factory.toConverter('Recursive').createDefault()).toEqual({});
  });

  it('reads an unaligned typed array from a subview and returns an independent copy', () => {
    const storage = new Uint8Array(32).fill(0xaa);
    const view = new DataView(storage.buffer, 5, 9);
    view.setUint8(0, 7);
    view.setFloat32(1, 3.25, true);
    view.setFloat32(5, -7.5, true);
    const converter = new ConverterFactory().toConverter('float32[2]');
    const buffer = new Buffer(view);
    expect(buffer.readUint8()).toBe(7);
    const result = converter.deserialize(buffer);
    storage.fill(0);

    expect(result).toEqual(new Float32Array([3.25, -7.5]));
    expect(buffer.offset).toBe(buffer.size);
  });

  it('rejects a typed array whose declared payload exceeds the view', () => {
    const storage = new Uint8Array(32);
    new DataView(storage.buffer).setUint32(0, 3, true);
    const converter = new ConverterFactory().toConverter('uint32[]');
    expect(() => converter.deserialize(new Buffer(storage.subarray(0, 8)))).toThrow(RangeError);
  });

  it('should serialize scalar correctly', () => {
    const name = 'int32';
    const converter = getConverter(name);
    const value = 42;
    const buffer = new Buffer(new ArrayBuffer(4));

    converter.serialize(value, buffer);

    expect(buffer.offset).toBe(4);
  });

  it('should deserialize scalar type type', () => {
    const name = 'int32';
    const converter = getConverter(name);
    const value = 42;
    const buffer = new Buffer(new ArrayBuffer(4));

    converter.serialize(value, buffer);
    buffer.offset = 0;

    expect(converter.deserialize(buffer)).toBe(value);
  });

  it('should serialize sized array of scalar types', () => {
    const name = 'int32[3]';
    const converter = getConverter(name);
    const value = new Int32Array([1, 2, 3]);
    const buffer = new Buffer(new ArrayBuffer(converter.size(value)));

    converter.serialize(value, buffer);

    expect(buffer.offset).toEqual(12);
  });

  it('should deserializie sized array of scalar types', () => {
    const name = 'int32[3]';
    const converter = getConverter(name);
    const value = new Int32Array([1, 2, 3]);
    const buffer = new Buffer(new ArrayBuffer(converter.size(value)));

    converter.serialize(value, buffer);
    buffer.offset = 0;

    expect(converter.deserialize(buffer)).toEqual(value);
  });

  it('should throw an error when the basis type is not found in the converters map', () => {
    expect(() => getConverter('customType')).toThrowError('Unknown type: customType not found');
  });

  it('should throw an error when the map key type is not found in the converters map', () => {
    expect(() => {
      getConverter('int32{customType}');
    }).toThrowError('Unknown type: customType not found');
  });

  it('should serialize multidimensional array', () => {
    const converter = getConverter('int32[3][2]');
    const value = [new Int32Array([1, 2, 3]), new Int32Array([4, 5, 4])];
    const size = converter.size(value);
    const buffer = new Buffer(new ArrayBuffer(size));

    converter.serialize(value, buffer);

    expect(buffer.offset).toEqual(24);
  });

  it('should deserialize multidimensional array', () => {
    const converter = getConverter('int32[3][2]');
    const value = [new Int32Array([1, 2, 3]), new Int32Array([4, 5, 4])];
    const size = converter.size(value);
    const buffer = new Buffer(new ArrayBuffer(size));

    converter.serialize(value, buffer);
    buffer.offset = 0;

    expect(converter.deserialize(buffer)).toEqual(value);
  });

  it('should serialize map of scalar typess', () => {
    const converter = getConverter('string{int32}');
    const value = new Map<number, string>([
      [1, 'one'],
      [2, 'two'],
      [3, 'three'],
    ]);
    const buffer = new Buffer(new ArrayBuffer(converter.size(value)));

    converter.serialize(value, buffer);

    expect(buffer.offset).toEqual(39);
  });

  it('should serialize and deserialize a map of basic types correctly', () => {
    const converter = getConverter('string{int32}');
    const value = new Map<number, string>([
      [1, 'one'],
      [2, 'two'],
      [3, 'three'],
    ]);
    const buffer = new Buffer(new ArrayBuffer(converter.size(value)));

    converter.serialize(value, buffer);
    buffer.offset = 0;

    expect(converter.deserialize(buffer)).is.deep.eq(value);
  });

  it('should calculate the correct size for flat array', () => {
    const converter = getConverter('int32[5]');
    const value = new Int32Array([1, 2, 3, 4, 5]);

    expect(converter.size(value)).toBe(4 * 5);
  });

  it('should calculate size for nested array', () => {
    const converter = getConverter('int32[3][2]');
    const value = [Int32Array.from([1, 2, 3]), Int32Array.from([4, 5, 6])];

    expect(converter.size(value)).toBe(24);
  });

  it('should throw an error for unknown map key type', () => {
    const serializeFn = () => getConverter('int32{undefined}');

    expect(serializeFn).toThrowError('Unknown type: undefined not found');
  });

  it('should throw an error when the array length is out of bounds', () => {
    const converter = getConverter('int32[3]');
    const value = [1, 2, 3, 4]; // Array length is out of bounds
    const serialize = () => converter.serialize(value, new Buffer(new ArrayBuffer(converter.size(value))));

    expect(serialize).toThrowError('Array length mismatch: 4 !== 3');
  });

  it('it should serialize nested maps with nested structs', () => {
    const converter = getConverter('int32[3][]{string}{string}');
    const value = new Map<string, Map<string, Int32Array[]>>([
      ['key1', new Map<string, Int32Array[]>([['key2', [new Int32Array([1, 2, 3]), new Int32Array([4, 5, 6])]]])],
    ]);
    const buffer = new Buffer(new ArrayBuffer(converter.size(value)));

    converter.serialize(value, buffer);
    expect(buffer.offset).toEqual(buffer.size);
  });

  it('it should deserialize nested maps with nested structs', () => {
    const converter = getConverter('int32[3][]{string}{string}');
    const value = new Map<string, Map<string, Int32Array[]>>([
      ['key1', new Map<string, Int32Array[]>([['key2', [new Int32Array([1, 2, 3]), new Int32Array([4, 5, 6])]]])],
    ]);

    const buffer = new Buffer(new ArrayBuffer(converter.size(value)));
    converter.serialize(value, buffer);
    buffer.offset = 0;

    expect(converter.deserialize(buffer)).toEqual(value);
  });

  function getConverter(type: IType): Converter {
    const factory = new ConverterFactory();
    return factory.toConverter(type);
  }
});
