import { describe, it, expect } from 'vitest';
import { ConverterFactory } from './ConverterFactory';
import type { IType } from '../types';
import type { Converter } from './Converter';
import { Buffer } from '../Buffer';
import { Protocols } from '../protocol';
import type { StructConverter } from './base/StructConverter';
import { captureError } from '../../tests/utils';

describe('ConverterFactory', () => {
  describe('converter cache', () => {
    it('should reuse converters within one factory', () => {
      const { factory } = createPairFactory();
      const pair = factory.toConverter('Pair');

      const cached = factory.toConverter('Pair');

      expect(cached).toBe(pair);
    });

    it.each([0, 1])('should reuse the converter for nested field %i', (index) => {
      const { factory } = createPairFactory();
      const scalar = factory.toConverter('string');

      const pair = factory.toConverter('Pair') as StructConverter;

      expect(pair.convertorsList[index].converter).toBe(scalar);
    });

    it('should keep converters independent across factories', () => {
      const { factory, protocols } = createPairFactory();
      const pair = factory.toConverter('Pair');

      const other = new ConverterFactory(protocols).toConverter('Pair');

      expect(other).not.toBe(pair);
    });

    it('should create a fresh parent object on every access', () => {
      const { factory } = createPairFactory();
      const pair = factory.toConverter('Pair') as StructConverter;
      const first = pair.parentObject;

      const second = pair.parentObject;

      expect(second).not.toBe(first);
    });

    it('should use the initial schema for nested defaults', () => {
      const { factory } = createItemFactory();
      const converter = factory.toConverter('Item[1]');

      const value = converter.createDefault();

      expect(value).toEqual([{ value: 0 }]);
    });

    it('should invalidate cached parents after a dependency is reloaded', () => {
      const { factory, protocols } = createItemFactory();
      const before = factory.toConverter('Item[1]');

      loadUpdatedItem(protocols);
      const after = factory.toConverter('Item[1]');

      expect(after).not.toBe(before);
    });

    it('should use the updated schema for nested defaults', () => {
      const { factory, protocols } = createItemFactory();
      factory.toConverter('Item[1]');
      loadUpdatedItem(protocols);
      const converter = factory.toConverter('Item[1]');

      const value = converter.createDefault();

      expect(value).toEqual([{ value: '' }]);
    });

    it('should round-trip values using the updated schema', () => {
      const { factory, protocols } = createItemFactory();
      factory.toConverter('Item[1]');
      loadUpdatedItem(protocols);
      const converter = factory.toConverter('Item[1]');
      const value = [{ value: 'updated' }];
      const buffer = new Buffer(new ArrayBuffer(converter.size(value)));
      converter.serialize(value, buffer);
      buffer.offset = 0;

      const result = converter.deserialize(buffer);

      expect(result).toEqual(value);
    });
  });

  describe('circular schemas', () => {
    it('should report a circular dependency', () => {
      const { factory } = createRecursiveFactory();

      const resolve = () => factory.toConverter('Recursive');

      expect(resolve).toThrow('Circular type dependency: Recursive');
    });

    it('should report the same dependency after a failed resolution', () => {
      const { factory } = createRecursiveFactory();
      captureError(() => factory.toConverter('Recursive'));

      const resolve = () => factory.toConverter('Recursive');

      expect(resolve).toThrow('Circular type dependency: Recursive');
    });

    it('should recover after the circular schema is replaced', () => {
      const { factory, protocols } = createRecursiveFactory();
      captureError(() => factory.toConverter('Recursive'));
      protocols.load([{ type: 'Recursive', type_class: 'struct', hash: '1', fields: [] }]);

      const value = factory.toConverter('Recursive').createDefault();

      expect(value).toEqual({});
    });
  });

  describe('typed array subviews', () => {
    it('should read the field preceding an unaligned array', () => {
      const { buffer } = createUnalignedArray();

      const value = buffer.readUint8();

      expect(value).toBe(7);
    });

    it('should return an independent copy of an unaligned array', () => {
      const { buffer, converter, storage } = createUnalignedArray();
      buffer.readUint8();

      const value = converter.deserialize(buffer);
      storage.fill(0);

      expect(value).toEqual(new Float32Array([3.25, -7.5]));
    });

    it('should advance the offset to the end of the subview', () => {
      const { buffer, converter } = createUnalignedArray();
      buffer.readUint8();

      converter.deserialize(buffer);

      expect(buffer.offset).toBe(buffer.size);
    });

    it('should reject an array whose declared payload exceeds the view', () => {
      const storage = new Uint8Array(32);
      new DataView(storage.buffer).setUint32(0, 3, true);
      const converter = getConverter('uint32[]');
      const buffer = new Buffer(storage.subarray(0, 8));

      const deserialize = () => converter.deserialize(buffer);

      expect(deserialize).toThrow(RangeError);
    });
  });

  it('should serialize scalar correctly', () => {
    const name = 'int32';
    const converter = getConverter(name);
    const value = 42;
    const buffer = new Buffer(new ArrayBuffer(4));

    converter.serialize(value, buffer);

    expect(buffer.offset).toBe(4);
  });

  it('should deserialize scalar type', () => {
    const name = 'int32';
    const converter = getConverter(name);
    const value = 42;
    const buffer = new Buffer(new ArrayBuffer(4));
    converter.serialize(value, buffer);
    buffer.offset = 0;

    const result = converter.deserialize(buffer);

    expect(result).toBe(value);
  });

  it('should serialize sized array of scalar types', () => {
    const name = 'int32[3]';
    const converter = getConverter(name);
    const value = new Int32Array([1, 2, 3]);
    const buffer = new Buffer(new ArrayBuffer(converter.size(value)));

    converter.serialize(value, buffer);

    expect(buffer.offset).toEqual(12);
  });

  it('should deserialize sized array of scalar types', () => {
    const name = 'int32[3]';
    const converter = getConverter(name);
    const value = new Int32Array([1, 2, 3]);
    const buffer = new Buffer(new ArrayBuffer(converter.size(value)));
    converter.serialize(value, buffer);
    buffer.offset = 0;

    const result = converter.deserialize(buffer);

    expect(result).toEqual(value);
  });

  it('should throw an error when the basis type is not found in the converters map', () => {
    const typeName = 'customType';

    const resolve = () => getConverter(typeName);

    expect(resolve).toThrowError('Unknown type: customType not found');
  });

  it('should throw an error when the map key type is not found in the converters map', () => {
    const typeName = 'int32{customType}';

    const resolve = () => getConverter(typeName);

    expect(resolve).toThrowError('Unknown type: customType not found');
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

    const result = converter.deserialize(buffer);

    expect(result).toEqual(value);
  });

  it('should serialize map of scalar types', () => {
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

    const result = converter.deserialize(buffer);

    expect(result).toEqual(value);
  });

  it('should calculate the correct size for flat array', () => {
    const converter = getConverter('int32[5]');
    const value = new Int32Array([1, 2, 3, 4, 5]);

    const size = converter.size(value);

    expect(size).toBe(4 * 5);
  });

  it('should calculate size for nested array', () => {
    const converter = getConverter('int32[3][2]');
    const value = [Int32Array.from([1, 2, 3]), Int32Array.from([4, 5, 6])];

    const size = converter.size(value);

    expect(size).toBe(24);
  });

  it('should throw an error for unknown map key type', () => {
    const typeName = 'int32{undefined}';

    const resolve = () => getConverter(typeName);

    expect(resolve).toThrowError('Unknown type: undefined not found');
  });

  it('should throw an error when the array length is out of bounds', () => {
    const converter = getConverter('int32[3]');
    const value = [1, 2, 3, 4];

    const serialize = () => converter.serialize(value, new Buffer(new ArrayBuffer(converter.size(value))));

    expect(serialize).toThrowError('Array length mismatch: 4 !== 3');
  });

  it('should serialize nested maps with nested structs', () => {
    const converter = getConverter('int32[3][]{string}{string}');
    const value = new Map<string, Map<string, Int32Array[]>>([
      ['key1', new Map<string, Int32Array[]>([['key2', [new Int32Array([1, 2, 3]), new Int32Array([4, 5, 6])]]])],
    ]);
    const buffer = new Buffer(new ArrayBuffer(converter.size(value)));

    converter.serialize(value, buffer);

    expect(buffer.offset).toEqual(buffer.size);
  });

  it('should deserialize nested maps with nested structs', () => {
    const converter = getConverter('int32[3][]{string}{string}');
    const value = new Map<string, Map<string, Int32Array[]>>([
      ['key1', new Map<string, Int32Array[]>([['key2', [new Int32Array([1, 2, 3]), new Int32Array([4, 5, 6])]]])],
    ]);
    const buffer = new Buffer(new ArrayBuffer(converter.size(value)));
    converter.serialize(value, buffer);
    buffer.offset = 0;

    const result = converter.deserialize(buffer);

    expect(result).toEqual(value);
  });

  function createPairFactory() {
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
    return { protocols, factory: new ConverterFactory(protocols) };
  }

  function createItemFactory() {
    const protocols = new Protocols();
    protocols.load([
      {
        type: 'Item',
        type_class: 'struct',
        hash: '0',
        fields: [{ name: 'value', type: 'int8' }],
      },
    ]);
    return { protocols, factory: new ConverterFactory(protocols) };
  }

  function loadUpdatedItem(protocols: Protocols) {
    protocols.load([
      {
        type: 'Item',
        type_class: 'struct',
        hash: '1',
        fields: [{ name: 'value', type: 'string' }],
      },
    ]);
  }

  function createRecursiveFactory() {
    const protocols = new Protocols();
    protocols.load([
      {
        type: 'Recursive',
        type_class: 'struct',
        hash: '0',
        fields: [{ name: 'child', type: 'Recursive[]' }],
      },
    ]);
    return { protocols, factory: new ConverterFactory(protocols) };
  }

  function createUnalignedArray() {
    const storage = new Uint8Array(32).fill(0xaa);
    const view = new DataView(storage.buffer, 5, 9);
    view.setUint8(0, 7);
    view.setFloat32(1, 3.25, true);
    view.setFloat32(5, -7.5, true);
    return { storage, buffer: new Buffer(view), converter: getConverter('float32[2]') };
  }

  function getConverter(type: IType): Converter {
    const factory = new ConverterFactory();
    return factory.toConverter(type);
  }
});
