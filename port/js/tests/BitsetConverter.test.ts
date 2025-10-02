import { describe, expect, it } from 'vitest';
import type { BasicType, BitsetBit, BitsetTypeDefinition } from '../src';
import { BitsetConverter, Buffer, TypeClass } from '../src';
import { initGetType } from './utils';
import { MessgenTestSimpleBitset } from './types';

describe('BitsetConverter', () => {
  describe('#base', () => {
    it('should return default value of 0', () => {
      const converter = initBitsetConverter([{ name: 'ONE', offset: 0 }]);

      const result = converter.default();

      expect(result).toBe(0);
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
      const flags = MessgenTestSimpleBitset.ONE | MessgenTestSimpleBitset.ERROR; // 0b101

      converter.serialize(flags, buffer);
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

      // Set only flag at offset 0
      converter.serialize(MessgenTestSimpleBitset.ONE, buffer);
      buffer.offset = 0;

      expect(buffer.dataView.getUint8(0)).toBe(0b001);
    });

    it('should serialize numeric value directly', () => {
      const converter = initBitsetConverter([
        { name: 'ONE', offset: 0 },
        { name: 'TWO', offset: 1 },
      ]);
      const buffer = new Buffer(new ArrayBuffer(1));

      converter.serialize(0b11, buffer);
      buffer.offset = 0;

      expect(buffer.dataView.getUint8(0)).toBe(0b11);
    });

    it('should throw on invalid bits set', () => {
      const converter = initBitsetConverter([{ name: 'ONE', offset: 0 }]);
      const buffer = new Buffer(new ArrayBuffer(1));

      // Trying to set bit at offset 1 which is not defined
      const invalidFlags = (1 << 1);
      expect(() => converter.serialize(invalidFlags, buffer)).toThrowError(/Invalid bits set/);
    });

    it('should accept 0 as valid value', () => {
      const converter = initBitsetConverter([{ name: 'ONE', offset: 0 }]);
      const buffer = new Buffer(new ArrayBuffer(1));

      converter.serialize(0, buffer);
      buffer.offset = 0;
      const rawValue = buffer.dataView.getUint8(0);

      expect(rawValue).toBe(0);
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

      expect(result).toBe(0b11);
    });

    it('should ignore undefined bits', () => {
      const converter = initBitsetConverter([
        { name: 'ONE', offset: 0 },
        { name: 'TWO', offset: 1 },
      ]);
      const buffer = new Buffer(new ArrayBuffer(1));
      // Set bits 0, 1, and 2, but only 0 and 1 are defined
      buffer.dataView.setUint8(0, 0b111);

      const result = converter.deserialize(buffer);

      // Should only return defined bits (0 and 1)
      expect(result).toBe(0b11);
    });

    it('should handle high bit in uint16', () => {
      const converter = initBitsetConverter([{ name: 'HIGH', offset: 15 }], 'uint16');
      const buffer = new Buffer(new ArrayBuffer(2));
      buffer.dataView.setUint16(0, 1 << 15, true);

      const result = converter.deserialize(buffer);

      expect(result).toBe(1 << 15);
    });

    it('should handle multiple flags in uint32', () => {
      const converter = initBitsetConverter([
        { name: 'BIT_0', offset: 0 },
        { name: 'BIT_10', offset: 10 },
        { name: 'BIT_20', offset: 20 },
        { name: 'BIT_31', offset: 31 },
      ], 'uint32');
      const buffer = new Buffer(new ArrayBuffer(4));
      const flags = (1 << 0) | (1 << 10) | (1 << 20) | (1 << 31);
      buffer.dataView.setUint32(0, flags >>> 0, true);

      const result = converter.deserialize(buffer);

      expect(result).toBe(flags);
    });
  });

  describe('#edge cases', () => {
    it('should throw on negative offset', () => {
      expect(() => {
        initBitsetConverter([{ name: 'NEGATIVE', offset: -1 }]);
      }).toThrowError(/Invalid bit offset=-1/);
    });

    it('should throw on offset > 31', () => {
      expect(() => {
        initBitsetConverter([{ name: 'TOO_HIGH', offset: 32 }]);
      }).toThrowError(/Invalid bit offset=32/);
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
