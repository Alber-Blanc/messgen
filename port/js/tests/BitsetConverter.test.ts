import { describe, expect, it } from 'vitest';
import type { BasicType, BitsetBit, BitsetTypeDefinition } from '../src';
import { Buffer, TypeClass, BitsetConverter } from '../src';
import { initGetType } from './utils';

describe('BitsetConverter', () => {
  describe('#base', () => {
    it('should return default set', () => {
      const converter = initBitsetConverter([{ name: 'ONE', offset: 0 }]);
      const result = converter.default();
      expect(result).toEqual(new Set());
    });

    it('should return size for base type', () => {
      const converter = initBitsetConverter([{ name: 'ONE', offset: 0 }], 'int32');
      const size = converter.size(0);
      expect(size).toBe(4);
    });
  });

  describe('#serialize', () => {
    it('should set only the specified flags', () => {
      const converter = initBitsetConverter([
        { name: 'ONE', offset: 0 },
        { name: 'TWO', offset: 1 },
        { name: 'ERROR', offset: 2 },
      ]);
      const buffer = new Buffer(new ArrayBuffer(1));

      converter.serialize(new Set(['ONE', 'ERROR']), buffer);
      buffer.offset = 0;
      const rawValue = buffer.dataView.getUint8(0);

      expect(rawValue).toBe(0b101);
    });

    it('should not set flags that are not specified', () => {
      const converter = initBitsetConverter([
        { name: 'ONE', offset: 0 },
        { name: 'TWO', offset: 1 },
      ]);
      const buffer = new Buffer(new ArrayBuffer(1));

      converter.serialize(new Set(['ONE']), buffer);
      buffer.offset = 0;
      const rawValue = buffer.dataView.getUint8(0);

      expect(rawValue).toBe(0b001);
    });

    it('should serialize numeric value directly', () => {
      const converter = initBitsetConverter([
        { name: 'ONE', offset: 0 },
        { name: 'TWO', offset: 1 },
      ]);
      const buffer = new Buffer(new ArrayBuffer(1));

      converter.serialize(0b11, buffer);
      buffer.offset = 0;
      const rawValue = buffer.dataView.getUint8(0);

      expect(rawValue).toBe(0b11);
    });

    it('should serialize array of flags', () => {
      const converter = initBitsetConverter([
        { name: 'ONE', offset: 0 },
        { name: 'TWO', offset: 1 },
      ]);
      const buffer = new Buffer(new ArrayBuffer(1));

      converter.serialize(['TWO'], buffer);
      buffer.offset = 0;
      const rawValue = buffer.dataView.getUint8(0);

      expect(rawValue).toBe(0b010);
    });

    it('should throw on unsupported flag', () => {
      const converter = initBitsetConverter([{ name: 'ONE', offset: 0 }]);
      const buffer = new Buffer(new ArrayBuffer(1));

      expect(() => converter.serialize(new Set(['UNKNOWN']), buffer)).toThrowError();
    });

    it('should throw on unsupported type', () => {
      const converter = initBitsetConverter([{ name: 'ONE', offset: 0 }]);
      const buffer = new Buffer(new ArrayBuffer(1));

      expect(() => converter.serialize('INVALID', buffer)).toThrowError();
    });
  });

  describe('#deserialize', () => {
    it('should decode all set flags', () => {
      const converter = initBitsetConverter([
        { name: 'ONE', offset: 0 },
        { name: 'TWO', offset: 1 },
      ]);
      const buffer = new Buffer(new ArrayBuffer(1));
      buffer.dataView.setUint8(0, 0b11);

      const result = converter.deserialize(buffer);

      expect(result).toEqual(new Set(['ONE', 'TWO']));
    });

    it('should ignore unset flags', () => {
      const converter = initBitsetConverter([
        { name: 'ONE', offset: 0 },
        { name: 'TWO', offset: 1 },
      ]);
      const buffer = new Buffer(new ArrayBuffer(1));
      buffer.dataView.setUint8(0, 0b01);

      const result = converter.deserialize(buffer);

      expect(result).toEqual(new Set(['ONE']));
    });

    it('should return empty set when no flags are set', () => {
      const converter = initBitsetConverter([{ name: 'ONE', offset: 0 }]);
      const buffer = new Buffer(new ArrayBuffer(1));
      buffer.dataView.setUint8(0, 0b00);

      const result = converter.deserialize(buffer);

      expect(result).toEqual(new Set());
    });

    it('should handle high bit in uint16', () => {
      const converter = initBitsetConverter([{ name: 'HIGH', offset: 15 }], 'uint16');
      const buffer = new Buffer(new ArrayBuffer(2));
      buffer.dataView.setUint16(0, 0b1000000000000000, true);

      const result = converter.deserialize(buffer);

      expect(result).toEqual(new Set(['HIGH']));
    });
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
