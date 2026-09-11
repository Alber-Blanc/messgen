import { describe, it, expect } from 'vitest';
import { Buffer } from '../../Buffer';
import { ScalarConverter } from './ScalarConverter';
import type { BasicType } from '../../types';
import { IS_LITTLE_ENDIAN } from '../../config';
import { captureError } from '../../../tests/utils';

describe('ScalarConverter', () => {
  describe('::primitive', () => {
    it('should serialize int8', () => {
      const converter = getConverter('int8');
      const buffer = getBuffer(1);
      const value = 3;

      converter.serialize(value, buffer);

      expect(buffer.dataView.getInt8(0)).toBe(value);
    });

    it('should deserialize int8', () => {
      const value = 3;
      const converter = getConverter('int8');
      const buffer = getBuffer(converter.size(value));
      buffer.dataView.setInt8(0, value);

      const result = converter.deserialize(buffer);

      expect(result).toBe(value);
    });

    it('should serialize negative int8', () => {
      const converter = getConverter('int8');
      const buffer = getBuffer(1);
      const value = -3;

      converter.serialize(value, buffer);

      expect(buffer.dataView.getInt8(0)).toBe(value);
    });

    it('should deserialize negative int8', () => {
      const value = -3;
      const converter = getConverter('int8');
      const buffer = getBuffer(converter.size(value));
      buffer.dataView.setInt8(0, value);

      const result = converter.deserialize(buffer);

      expect(result).toBe(value);
    });

    it('should serialize int16', () => {
      const converter = getConverter('int16');
      const buffer = getBuffer(2);
      const value = 6457;

      converter.serialize(value, buffer);

      expect(buffer.dataView.getInt16(0, IS_LITTLE_ENDIAN)).toBe(value);
    });

    it('should deserialize int16', () => {
      const value = 6457;
      const converter = getConverter('int16');
      const buffer = getBuffer(converter.size(value));
      buffer.dataView.setInt16(0, value, IS_LITTLE_ENDIAN);

      const result = converter.deserialize(buffer);

      expect(result).toBe(value);
    });

    it('should serialize negative int16', () => {
      const converter = getConverter('int16');
      const buffer = getBuffer(2);
      const value = -6457;

      converter.serialize(value, buffer);

      expect(buffer.dataView.getInt16(0, IS_LITTLE_ENDIAN)).toBe(value);
    });

    it('should deserialize negative int16', () => {
      const value = -15359;
      const converter = getConverter('int16');
      const buffer = getBuffer(converter.size(value));
      buffer.dataView.setInt16(0, value, IS_LITTLE_ENDIAN);

      const result = converter.deserialize(buffer);

      expect(result).toBe(value);
    });

    it('should serialize int32', () => {
      const converter = getConverter('int32');
      const buffer = getBuffer(4);
      const value = 3123123;

      converter.serialize(value, buffer);

      expect(buffer.dataView.getInt32(0, IS_LITTLE_ENDIAN)).toBe(value);
    });

    it('should deserialize int32', () => {
      const value = 3123123;
      const converter = getConverter('int32');
      const buffer = getBuffer(converter.size(value));
      buffer.dataView.setInt32(0, value, IS_LITTLE_ENDIAN);

      const result = converter.deserialize(buffer);

      expect(result).toBe(value);
    });

    it('should serialize negative int32', () => {
      const converter = getConverter('int32');
      const buffer = getBuffer(4);
      const value = -323432;

      converter.serialize(value, buffer);

      expect(buffer.dataView.getInt32(0, IS_LITTLE_ENDIAN)).toBe(value);
    });

    it('should deserialize negative int32', () => {
      const value = -312312;
      const converter = getConverter('int32');
      const buffer = getBuffer(converter.size(value));
      buffer.dataView.setInt32(0, value, IS_LITTLE_ENDIAN);

      const result = converter.deserialize(buffer);

      expect(result).toBe(value);
    });

    it('should serialize int64', () => {
      const converter = getConverter('int64');
      const buffer = getBuffer(8);
      const value = 9007199254740991n;

      converter.serialize(value, buffer);

      expect(buffer.dataView.getBigInt64(0, IS_LITTLE_ENDIAN)).toBe(value);
    });

    it('should deserialize int64', () => {
      const value = 9007199254740991n;
      const converter = getConverter('int64');
      const buffer = getBuffer(converter.size(value));
      buffer.dataView.setBigInt64(0, value, IS_LITTLE_ENDIAN);

      const result = converter.deserialize(buffer);

      expect(result).toBe(value);
    });

    it('should serialize negative int64', () => {
      const converter = getConverter('int64');
      const buffer = getBuffer(8);
      const value = -9007199254740991n;

      converter.serialize(value, buffer);

      expect(buffer.dataView.getBigInt64(0, IS_LITTLE_ENDIAN)).toBe(value);
    });

    it('should deserialize negative int64', () => {
      const value = -9007199254740991n;
      const converter = getConverter('int64');
      const buffer = getBuffer(converter.size(value));
      buffer.dataView.setBigInt64(0, value, IS_LITTLE_ENDIAN);

      const result = converter.deserialize(buffer);

      expect(result).toBe(value);
    });

    it('should serialize uint8', () => {
      const converter = getConverter('uint8');
      const buffer = getBuffer(1);
      const value = 3;

      converter.serialize(value, buffer);

      expect(buffer.dataView.getUint8(0)).toBe(value);
    });

    it('should deserialize uint8', () => {
      const value = 3;
      const converter = getConverter('uint8');
      const buffer = getBuffer(converter.size(value));
      buffer.dataView.setUint8(0, value);

      const result = converter.deserialize(buffer);

      expect(result).toBe(value);
    });

    it('should serialize uint16', () => {
      const converter = getConverter('uint16');
      const buffer = getBuffer(2);
      const value = 3;

      converter.serialize(value, buffer);

      expect(buffer.dataView.getUint16(0, IS_LITTLE_ENDIAN)).toBe(value);
    });

    it('should deserialize uint16', () => {
      const value = 32332;
      const converter = getConverter('uint16');
      const buffer = getBuffer(converter.size(value));
      buffer.dataView.setUint16(0, value, IS_LITTLE_ENDIAN);

      const result = converter.deserialize(buffer);

      expect(result).toBe(value);
    });

    it('should serialize uint32', () => {
      const converter = getConverter('uint32');
      const buffer = getBuffer(4);
      const value = 5646233;

      converter.serialize(value, buffer);

      expect(buffer.dataView.getUint32(0, IS_LITTLE_ENDIAN)).toBe(value);
    });

    it('should deserialize uint32', () => {
      const value = 5646233;
      const converter = getConverter('uint32');
      const buffer = getBuffer(converter.size(value));
      buffer.dataView.setUint32(0, value, IS_LITTLE_ENDIAN);

      const result = converter.deserialize(buffer);

      expect(result).toBe(value);
    });

    it('should serialize uint64', () => {
      const converter = getConverter('uint64');
      const buffer = getBuffer(8);
      const value = 9007199254740991n;

      converter.serialize(value, buffer);

      expect(buffer.dataView.getBigUint64(0, IS_LITTLE_ENDIAN)).toBe(value);
    });

    it('should deserialize uint64', () => {
      const value = 9007199254740991n;
      const converter = getConverter('uint64');
      const buffer = getBuffer(converter.size(value));
      buffer.dataView.setBigUint64(0, value, IS_LITTLE_ENDIAN);

      const result = converter.deserialize(buffer);

      expect(result).toBe(value);
    });

    it('should serialize float32', () => {
      const converter = getConverter('float32');
      const buffer = getBuffer(4);
      const value = 3.2;

      converter.serialize(value, buffer);

      expect(buffer.dataView.getFloat32(0, IS_LITTLE_ENDIAN)).toBeCloseTo(value, 5);
    });

    it('should deserialize float32', () => {
      const value = 31231.14;
      const converter = getConverter('float32');
      const buffer = getBuffer(converter.size(value));
      buffer.dataView.setFloat32(0, value, IS_LITTLE_ENDIAN);

      const result = converter.deserialize(buffer);

      expect(result).toBeCloseTo(value, 2);
    });

    it('should serialize float64', () => {
      const converter = getConverter('float64');
      const buffer = getBuffer(8);
      const value = 3123213.2;

      converter.serialize(value, buffer);

      expect(buffer.dataView.getFloat64(0, IS_LITTLE_ENDIAN)).toBeCloseTo(value, 5);
    });

    it('should deserialize float64', () => {
      const value = 3.14;
      const converter = getConverter('float64');
      const buffer = getBuffer(converter.size(value));
      buffer.dataView.setFloat64(0, value, IS_LITTLE_ENDIAN);

      const result = converter.deserialize(buffer);

      expect(result).toBeCloseTo(value, 5);
    });

    it('should serialize char', () => {
      const converter = getConverter('char');
      const buffer = getBuffer(1);
      const value = 'a';

      converter.serialize(value, buffer);

      expect(buffer.dataView.getInt8(0)).toBe(value.charCodeAt(0));
    });

    it('should deserialize char', () => {
      const value = 'a';
      const converter = getConverter('char');
      const buffer = getBuffer(converter.size(value));
      buffer.dataView.setInt8(0, value.charCodeAt(0));

      const result = converter.deserialize(buffer);

      expect(result).toBe(value);
    });

    it('should serialize bool', () => {
      const converter = getConverter('bool');
      const buffer = getBuffer(1);
      const value = true;

      converter.serialize(value, buffer);

      expect(buffer.dataView.getInt8(0)).toBe(1);
    });

    it('should deserialize bool', () => {
      const value = true;
      const converter = getConverter('bool');
      const buffer = getBuffer(converter.size(value));
      buffer.dataView.setInt8(0, 1);

      const result = converter.deserialize(buffer);

      expect(result).toBe(value);
    });

    it('should serialize string', () => {
      const value = 'test';
      const converter = getConverter('string');
      const buffer = getBuffer(converter.size(value));

      converter.serialize(value, buffer);

      expect(new Uint8Array(buffer.buffer)).toEqual(new Uint8Array([4, 0, 0, 0, 116, 101, 115, 116]));
    });

    it('should serialize bytes', () => {
      const value = new Uint8Array([1, 2, 3, 4]);
      const converter = getConverter('bytes');
      const buffer = getBuffer(converter.size(value));

      converter.serialize(value, buffer);

      expect(new Uint8Array(buffer.buffer)).toEqual(new Uint8Array([4, 0, 0, 0, 1, 2, 3, 4]));
    });

    it('should deserialize bytes', () => {
      const converter = getConverter('bytes');
      const buffer = new Buffer(new Uint8Array([4, 0, 0, 0, 1, 2, 3, 4]));

      const result = converter.deserialize(buffer);

      expect(result).toEqual(new Uint8Array([1, 2, 3, 4]));
    });

    it('should advance the offset past the decoded bytes', () => {
      const converter = getConverter('bytes');
      const buffer = new Buffer(new Uint8Array([4, 0, 0, 0, 1, 2, 3, 4]));

      converter.deserialize(buffer);

      expect(buffer.offset).toBe(buffer.size);
    });
  });

  describe('::string offsets', () => {
    describe.each(['', 'parameter/value.'.repeat(14), 'Привет 世界 🌍'.repeat(20)])('string %j', (value) => {
      it('should advance the write offset by the encoded length', () => {
        const { converter, buffer, encoded } = createStringFixture(value);

        converter.serialize(value, buffer);

        expect(buffer.offset).toBe(3 + 4 + encoded.length);
      });

      it('should write the UTF-8 payload at the current offset', () => {
        const { converter, buffer, encoded } = createStringFixture(value);

        converter.serialize(value, buffer);

        expect(new Uint8Array(buffer.buffer, 7, encoded.length)).toEqual(encoded);
      });

      it('should decode the string at the current offset', () => {
        const { converter, buffer } = createSerializedString(value);

        const result = converter.deserialize(buffer);

        expect(result).toBe(value);
      });

      it('should advance the read offset by the encoded length', () => {
        const { converter, buffer, encoded } = createSerializedString(value);

        converter.deserialize(buffer);

        expect(buffer.offset).toBe(3 + 4 + encoded.length);
      });

      it('should preserve the next field', () => {
        const { converter, nextConverter, buffer } = createSerializedString(value);

        converter.deserialize(buffer);
        const next = nextConverter.deserialize(buffer);

        expect(next).toBe(0x12345678);
      });

      it('should consume the buffer after reading the next field', () => {
        const { converter, nextConverter, buffer } = createSerializedString(value);

        converter.deserialize(buffer);
        nextConverter.deserialize(buffer);

        expect(buffer.offset).toBe(buffer.size);
      });
    });

    describe.each([
      { name: 'UTF-8 BOM', bytes: [0xef, 0xbb, 0xbf, 0x61], value: 'a' },
      { name: 'invalid UTF-8', bytes: [0xc3, 0x28], value: '\ufffd(' },
      { name: 'incomplete UTF-8', bytes: [0xf0, 0x9f], value: '\ufffd' },
    ])('$name', ({ bytes, value }) => {
      it('should decode using TextDecoder semantics', () => {
        const { converter, buffer } = createWireString(bytes);

        const result = converter.deserialize(buffer);

        expect(result).toBe(value);
      });

      it('should advance the offset using the wire length', () => {
        const { converter, buffer } = createWireString(bytes);

        converter.deserialize(buffer);

        expect(buffer.offset).toBe(4 + bytes.length);
      });

      it('should preserve the next field', () => {
        const { converter, nextConverter, buffer } = createWireString(bytes);

        converter.deserialize(buffer);
        const next = nextConverter.deserialize(buffer);

        expect(next).toBe(0x12345678);
      });

      it('should consume the buffer after reading the next field', () => {
        const { converter, nextConverter, buffer } = createWireString(bytes);

        converter.deserialize(buffer);
        nextConverter.deserialize(buffer);

        expect(buffer.offset).toBe(buffer.size);
      });
    });

    it('should reject a string extending past the buffer', () => {
      const converter = getConverter('string');
      const buffer = getBuffer(6);
      buffer.dataView.setUint32(0, 3, IS_LITTLE_ENDIAN);

      const deserialize = () => converter.deserialize(buffer);

      expect(deserialize).toThrow(RangeError);
    });

    it('should preserve the offset after rejecting a truncated string', () => {
      const converter = getConverter('string');
      const buffer = getBuffer(6);
      buffer.dataView.setUint32(0, 3, IS_LITTLE_ENDIAN);

      captureError(() => converter.deserialize(buffer));

      expect(buffer.offset).toBe(0);
    });
  });

  describe('::size', () => {
    it('should calculate size of int8', () => {
      const converter = getConverter('int8');
      const value = 3;

      const result = converter.size(value);

      expect(result).toBe(1);
    });

    it('should calculate size of negative int8', () => {
      const converter = getConverter('int8');
      const value = -3;

      const result = converter.size(value);

      expect(result).toBe(1);
    });

    it('should calculate size of int16', () => {
      const converter = getConverter('int16');
      const value = 32233;

      const result = converter.size(value);

      expect(result).toBe(2);
    });

    it('should calculate size of negative int16', () => {
      const converter = getConverter('int16');
      const value = 32233;

      const result = converter.size(value);

      expect(result).toBe(2);
    });

    it('should calculate size of int32', () => {
      const converter = getConverter('int32');
      const value = 322332;

      const result = converter.size(value);

      expect(result).toBe(4);
    });

    it('should calculate size of negative int32', () => {
      const converter = getConverter('int32');
      const value = -322332;

      const result = converter.size(value);

      expect(result).toBe(4);
    });

    it('should calculate size of int64', () => {
      const converter = getConverter('int64');
      const value = 322332n;

      const result = converter.size(value);

      expect(result).toBe(8);
    });

    it('should calculate size of negative int64', () => {
      const converter = getConverter('int64');
      const value = -322332n;

      const result = converter.size(value);

      expect(result).toBe(8);
    });

    it('should calculate size of uint8', () => {
      const converter = getConverter('uint8');
      const value = 3;

      const result = converter.size(value);

      expect(result).toBe(1);
    });

    it('should calculate size of uint16', () => {
      const converter = getConverter('uint16');
      const value = 32233;

      const result = converter.size(value);

      expect(result).toBe(2);
    });

    it('should calculate size of uint32', () => {
      const converter = getConverter('uint32');
      const value = 322332;

      const result = converter.size(value);

      expect(result).toBe(4);
    });

    it('should calculate size of uint64', () => {
      const converter = getConverter('uint64');
      const value = 322332n;

      const result = converter.size(value);

      expect(result).toBe(8);
    });

    it('should calculate size of float32', () => {
      const converter = getConverter('float32');
      const value = 3233.14;

      const result = converter.size(value);

      expect(result).toBe(4);
    });

    it('should calculate size of float64', () => {
      const converter = getConverter('float64');
      const value = 3233.14;

      const result = converter.size(value);

      expect(result).toBe(8);
    });

    it('should calculate size of char', () => {
      const converter = getConverter('char');
      const value = 'a';

      const result = converter.size(value);

      expect(result).toBe(1);
    });

    it('should calculate size of bool', () => {
      const converter = getConverter('bool');
      const value = true;

      const result = converter.size(value);

      expect(result).toBe(1);
    });

    it('should calculate size of string', () => {
      const converter = getConverter('string');
      const value = 'test';

      const result = converter.size(value);

      expect(result).toBe(8);
    });

    it('should calculate size of bytes', () => {
      const converter = getConverter('bytes');
      const value = new Uint8Array([1, 2, 3, 4]);

      const result = converter.size(value);

      expect(result).toBe(8);
    });
  });

  it('should deserialize multiple types from the same buffer', () => {
    const value1 = 3;
    const value2 = 1000;
    const converter1 = getConverter('int8');
    const converter2 = getConverter('int16');
    const buffer = getBuffer(converter1.size(value1) + converter2.size(value2));
    converter1.serialize(value1, buffer);
    converter2.serialize(value2, buffer);
    buffer.offset = 0;

    const deserializedValue1 = converter1.deserialize(buffer);
    const deserializedValue2 = converter2.deserialize(buffer);

    expect([deserializedValue1, deserializedValue2]).toEqual([value1, value2]);
  });

  function createStringFixture(value: string) {
    const converter = getConverter('string');
    const nextConverter = getConverter('uint32');
    const encoded = new TextEncoder().encode(value);
    const buffer = getBuffer(3 + 4 + encoded.length + 4);
    buffer.offset = 3;
    return { converter, nextConverter, encoded, buffer };
  }

  function createSerializedString(value: string) {
    const fixture = createStringFixture(value);
    fixture.converter.serialize(value, fixture.buffer);
    fixture.nextConverter.serialize(0x12345678, fixture.buffer);
    fixture.buffer.offset = 3;
    return fixture;
  }

  function createWireString(bytes: number[]) {
    const converter = getConverter('string');
    const nextConverter = getConverter('uint32');
    const buffer = getBuffer(4 + bytes.length + 4);
    buffer.dataView.setUint32(0, bytes.length, IS_LITTLE_ENDIAN);
    new Uint8Array(buffer.buffer, 4, bytes.length).set(bytes);
    buffer.dataView.setUint32(4 + bytes.length, 0x12345678, IS_LITTLE_ENDIAN);
    return { converter, nextConverter, buffer };
  }

  function getConverter(name: BasicType) {
    return new ScalarConverter(name);
  }

  function getBuffer(size: number) {
    return new Buffer(new ArrayBuffer(size));
  }
});
