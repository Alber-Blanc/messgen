import { describe, expect, it } from 'vitest';
import { BitsetConverter } from '../src/converters/base/BitsetConverter';
import type { BasicType, BitsetBit, BitsetTypeDefinition } from '../src';
import { Buffer, TypeClass } from '../src';
import { initGetType } from './utils';

describe('BitsetConverter', () => {
  it('should serialize set of flags into number', () => {
    const converter = initBitsetConverter([
      { name: 'ONE', offset: 0 },
      { name: 'TWO', offset: 1 },
      { name: 'ERROR', offset: 2 },
    ]);

    const buffer = new Buffer(new ArrayBuffer(2));
    converter.serialize(new Set(['ONE', 'ERROR']), buffer);

    buffer.offset = 0;
    const raw = converter.deserialize(buffer);
    expect(raw).toEqual(new Set(['ONE', 'ERROR']));
  });

  it('should serialize number ', () => {
    const converter = initBitsetConverter([
      { name: 'ONE', offset: 0 },
      { name: 'TWO', offset: 1 },
    ]);

    const buffer = new Buffer(new ArrayBuffer(2));
    converter.serialize(3, buffer);

    buffer.offset = 0;
    const flags = converter.deserialize(buffer);
    console.log(flags);
    expect(flags).toEqual(new Set(['ONE', 'TWO']));
  });

  it('should return default empty set', () => {
    const converter = initBitsetConverter([{ name: 'ONE', offset: 0 }]);
    expect(converter.default()).toEqual(new Set());
  });

  it('should throw on unsupported flag', () => {
    const converter = initBitsetConverter([{ name: 'ONE', offset: 0 }]);
    const buffer = new Buffer(new ArrayBuffer(2));

    expect(() => converter.serialize(new Set(['UNKNOWN']), buffer)).toThrowError();
  });

  it('should return correct size for base type', () => {
    const converter = initBitsetConverter([{ name: 'ONE', offset: 0 }], 'int32');
    const size = converter.size(0);
    expect(size).toBe(4);
  });

  function initBitsetConverter(bits: BitsetBit[], type: BasicType = 'uint8'): BitsetConverter {
    const schema: BitsetTypeDefinition = {
      typeClass: TypeClass.BITSET,
      type,
      typeName: 'testBitset',
      bits,
    };
    const getType = initGetType();
    return new BitsetConverter(schema, getType);
  }
});
