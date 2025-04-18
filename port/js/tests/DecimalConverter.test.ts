import { describe, it, expect } from 'vitest';
import Decimal from 'decimal.js';
import { DecimalConverter } from '../src/converters/base/DecimalConverter';
import { Buffer } from '../src/Buffer';

function hexToLEBytes(hex: string): Uint8Array {
  const bigint = BigInt(hex);
  const bytes = new Uint8Array(8);
  for (let i = 0; i < 8; i++) {
    bytes[i] = Number((bigint >> BigInt(i * 8)) & 0xffn);
  }
  return bytes;
}

describe('DecimalConverter', () => {
  describe('#deserialize', () => {
    const converter = new DecimalConverter();

    it('should decode 0x308462D53C8ABAC0 to 123456.7890123456', () => {
      const data = hexToLEBytes('0x308462D53C8ABAC0');
      const value = converter.deserialize(new Buffer(data.buffer));
      expect(value.toString()).toBe('123456.7890123456');
    });

    it('should decode 0x31C0000000000001 to 1', () => {
      const data = hexToLEBytes('0x31C0000000000001');
      const value = converter.deserialize(new Buffer(data.buffer));
      expect(value.toString()).toBe('1');
    });

    it('should decode 0x31C000000000007B to 123', () => {
      const data = hexToLEBytes('0x31C000000000007B');
      const value = converter.deserialize(new Buffer(data.buffer));
      expect(value.toString()).toBe('123');
    });

    it('should decode 0x318000000000007B to 1.23', () => {
      const data = hexToLEBytes('0x318000000000007B');
      const value = converter.deserialize(new Buffer(data.buffer));
      expect(value.toString()).toBe('1.23');
    });

    it('should decode 0x320000000000007B to 12300', () => {
      const data = hexToLEBytes('0x320000000000007B');
      const value = converter.deserialize(new Buffer(data.buffer));
      expect(value.toString()).toBe('12300');
    });

    it('should decode 0xB1C000000000007B to -123', () => {
      const data = hexToLEBytes('0xB1C000000000007B');
      const value = converter.deserialize(new Buffer(data.buffer));
      expect(value.toString()).toBe('-123');
    });

    it('should decode 0xB1A000000000007B to -12.3', () => {
      const data = hexToLEBytes('0xB1A000000000007B');
      const value = converter.deserialize(new Buffer(data.buffer));
      expect(value.toString()).toBe('-12.3');
    });

    it('should decode 0x31C0000000000000 to 0', () => {
      const data = hexToLEBytes('0x31C0000000000000');
      const value = converter.deserialize(new Buffer(data.buffer));
      expect(value.toString()).toBe('0');
    });

    it('should decode 0x3E40000000000000 to 0 (positive sub‑normal zero)', () => {
      const data = hexToLEBytes('0x3E40000000000000');
      const value = converter.deserialize(new Buffer(data.buffer));
      expect(value.toString()).toBe('0');
    });

    it('should decode 0x2540000000000000 to 0 (negative sub‑normal zero)', () => {
      const data = hexToLEBytes('0x2540000000000000');
      const value = converter.deserialize(new Buffer(data.buffer));
      expect(value.toString()).toBe('0');
    });

    it('should decode 0x31C000000098967F to 9999999', () => {
      const data = hexToLEBytes('0x31C000000098967F');
      const value = converter.deserialize(new Buffer(data.buffer));
      expect(value.toString()).toBe('9999999');
    });

    it('should decode 0x2E40000000000001 to 1e-28', () => {
      const data = hexToLEBytes('0x2E40000000000001');
      const value = converter.deserialize(new Buffer(data.buffer));
      expect(value.toString()).toBe('1e-28');
    });

    it('should decode 0x3540000000000009 to 9e+28', () => {
      const data = hexToLEBytes('0x3540000000000009');
      const value = converter.deserialize(new Buffer(data.buffer));
      expect(value.toString()).toBe('9e+28');
    });

    it('should decode 0x2FE38D7EA4C67FFF to 0.999999999999999', () => {
      const data = hexToLEBytes('0x2FE38D7EA4C67FFF');
      const value = converter.deserialize(new Buffer(data.buffer));
      expect(value.toString()).toBe('0.999999999999999');
    });

    it('should decode 0x31A0000000000005 to 0.5', () => {
      const data = hexToLEBytes('0x31A0000000000005');
      const value = converter.deserialize(new Buffer(data.buffer));
      expect(value.toString()).toBe('0.5');
    });

    it('should decode 0x318000000000000F to 0.15', () => {
      const data = hexToLEBytes('0x318000000000000F');
      const value = converter.deserialize(new Buffer(data.buffer));
      expect(value.toString()).toBe('0.15');
    });

    it('should decode 0x316000000000007D to 0.125', () => {
      const data = hexToLEBytes('0x316000000000007D');
      const value = converter.deserialize(new Buffer(data.buffer));
      expect(value.toString()).toBe('0.125');
    });

    it('should decode 0x316000000000007E to 0.126', () => {
      const data = hexToLEBytes('0x316000000000007E');
      const value = converter.deserialize(new Buffer(data.buffer));
      expect(value.toString()).toBe('0.126');
    });

    it('should decode 0x3D0000000098967F to 9999999e+90', () => {
      const data = hexToLEBytes('0x3D0000000098967F');
      const value = converter.deserialize(new Buffer(data.buffer));
      expect(value.toString()).toBe('9999999e+90');
    });

    it('should decode 0x256000000098967F to 9999999e-99', () => {
      const data = hexToLEBytes('0x256000000098967F');
      const value = converter.deserialize(new Buffer(data.buffer));
      expect(value.toString()).toBe('9999999e-99');
    });

    it('should decode 0x3100000000000001 to 0.000001', () => {
      const data = hexToLEBytes('0x3100000000000001');
      const value = converter.deserialize(new Buffer(data.buffer));
      expect(value.toString()).toBe('0.000001');
    });

    it('should decode 0x6C7386F26FC0FFFF to 9999999999999999', () => {
      const data = hexToLEBytes('0x6C7386F26FC0FFFF');
      const value = converter.deserialize(new Buffer(data.buffer));
      expect(value.toString()).toBe('9999999999999999');
    });

    it('should decode 0x7800000000000000 to Infinity', () => {
      const data = hexToLEBytes('0x7800000000000000');
      const value = converter.deserialize(new Buffer(data.buffer));
      expect(value.toString()).toBe('Infinity');
    });

    it('should decode 0x607B86F26FC0FFFF to 9999999999999999e-383', () => {
      const data = hexToLEBytes('0x607B86F26FC0FFFF');
      const value = converter.deserialize(new Buffer(data.buffer));
      expect(value.toString()).toBe('9999999999999999e-383');
    });

    it('should decode 0x5FE05AF3107A4000 to 1e+383', () => {
      const data = hexToLEBytes('0x5FE05AF3107A4000');
      const value = converter.deserialize(new Buffer(data.buffer));
      expect(value.toString()).toBe('1e+383');
    });

    it('should decode 0x5FE38D7EA4C68000 to 1e+384', () => {
      const data = hexToLEBytes('0x5FE38D7EA4C68000');
      const value = converter.deserialize(new Buffer(data.buffer));
      expect(value.toString()).toBe('1e+384');
    });

    it('should decode 0xF800000000000000 to -Infinity', () => {
      const data = hexToLEBytes('0xF800000000000000');
      const value = converter.deserialize(new Buffer(data.buffer));
      expect(value.toString()).toBe('-Infinity');
    });

    it('should decode 0x7C00000000000000 to NaN', () => {
      const data = hexToLEBytes('0x7C00000000000000');
      const value = converter.deserialize(new Buffer(data.buffer));
      expect(value.isNaN()).toBe(true);
    });
  });

  describe('#serialize', () => {
    const converter = new DecimalConverter();

    it('should encode 123456.7890123456 to 0x308462D53C8ABAC0', () => {
      const buffer = new Buffer(new ArrayBuffer(8));
      converter.serialize(new Decimal('123456.7890123456'), buffer);
      expect(buffer.dataView.getBigUint64(0, true)).toBe(BigInt('0x308462D53C8ABAC0'));
    });

    it('should encode 1 to 0x31C0000000000001', () => {
      const buffer = new Buffer(new ArrayBuffer(8));
      converter.serialize(new Decimal('1'), buffer);
      expect(buffer.dataView.getBigUint64(0, true)).toBe(BigInt('0x31C0000000000001'));
    });

    it('should encode 123 to 0x31C000000000007B', () => {
      const buffer = new Buffer(new ArrayBuffer(8));
      converter.serialize(new Decimal('123'), buffer);
      expect(buffer.dataView.getBigUint64(0, true)).toBe(BigInt('0x31C000000000007B'));
    });

    it('should encode 1.23 to 0x318000000000007B', () => {
      const buffer = new Buffer(new ArrayBuffer(8));
      converter.serialize(new Decimal('1.23'), buffer);
      expect(buffer.dataView.getBigUint64(0, true)).toBe(BigInt('0x318000000000007B'));
    });

    it('should encode 12300 to 0x320000000000007B', () => {
      const buffer = new Buffer(new ArrayBuffer(8));
      converter.serialize(new Decimal('12300'), buffer);
      expect(buffer.dataView.getBigUint64(0, true)).toBe(BigInt('0x320000000000007B'));
    });

    it('should encode -123 to 0xB1C000000000007B', () => {
      const buffer = new Buffer(new ArrayBuffer(8));
      converter.serialize(new Decimal('-123'), buffer);
      expect(buffer.dataView.getBigUint64(0, true)).toBe(BigInt('0xB1C000000000007B'));
    });

    it('should encode -12.3 to 0xB1A000000000007B', () => {
      const buffer = new Buffer(new ArrayBuffer(8));
      converter.serialize(new Decimal('-12.3'), buffer);
      expect(buffer.dataView.getBigUint64(0, true)).toBe(BigInt('0xB1A000000000007B'));
    });

    it('should encode 0 to 0x31C0000000000000', () => {
      const buffer = new Buffer(new ArrayBuffer(8));
      converter.serialize(new Decimal('0'), buffer);
      expect(buffer.dataView.getBigUint64(0, true)).toBe(BigInt('0x31C0000000000000'));
    });

    it('should encode 0e+100 (positive zero) to 0x3E40000000000000', () => {
      const buffer = new Buffer(new ArrayBuffer(8));
      converter.serialize(new Decimal('0e+100'), buffer);
      expect(buffer.dataView.getBigUint64(0, true)).toBe(BigInt('0x3E40000000000000'));
    });

    it('should encode 0e-100 (negative zero) to 0x2540000000000000', () => {
      const buffer = new Buffer(new ArrayBuffer(8));
      converter.serialize(new Decimal('0e-100'), buffer);
      expect(buffer.dataView.getBigUint64(0, true)).toBe(BigInt('0x2540000000000000'));
    });

    it('should encode 9999999 to 0x31C000000098967F', () => {
      const buffer = new Buffer(new ArrayBuffer(8));
      converter.serialize(new Decimal('9999999'), buffer);
      expect(buffer.dataView.getBigUint64(0, true)).toBe(BigInt('0x31C000000098967F'));
    });

    it('should encode 1e-28 to 0x2E40000000000001', () => {
      const buffer = new Buffer(new ArrayBuffer(8));
      converter.serialize(new Decimal('1e-28'), buffer);
      expect(buffer.dataView.getBigUint64(0, true)).toBe(BigInt('0x2E40000000000001'));
    });

    it('should encode 9e+28 to 0x3540000000000009', () => {
      const buffer = new Buffer(new ArrayBuffer(8));
      converter.serialize(new Decimal('9e+28'), buffer);
      expect(buffer.dataView.getBigUint64(0, true)).toBe(BigInt('0x3540000000000009'));
    });

    it('should encode 999999999999999e-15 to 0x2FE38D7EA4C67FFF', () => {
      const buffer = new Buffer(new ArrayBuffer(8));
      converter.serialize(new Decimal('999999999999999e-15'), buffer);
      expect(buffer.dataView.getBigUint64(0, true)).toBe(BigInt('0x2FE38D7EA4C67FFF'));
    });

    it('should encode 5e-1 to 0x31A0000000000005', () => {
      const buffer = new Buffer(new ArrayBuffer(8));
      converter.serialize(new Decimal('5e-1'), buffer);
      expect(buffer.dataView.getBigUint64(0, true)).toBe(BigInt('0x31A0000000000005'));
    });

    it('should encode 15e-2 to 0x318000000000000F', () => {
      const buffer = new Buffer(new ArrayBuffer(8));
      converter.serialize(new Decimal('15e-2'), buffer);
      expect(buffer.dataView.getBigUint64(0, true)).toBe(BigInt('0x318000000000000F'));
    });

    it('should encode 125e-3 to 0x316000000000007D', () => {
      const buffer = new Buffer(new ArrayBuffer(8));
      converter.serialize(new Decimal('125e-3'), buffer);
      expect(buffer.dataView.getBigUint64(0, true)).toBe(BigInt('0x316000000000007D'));
    });

    it('should encode 126e-3 to 0x316000000000007E', () => {
      const buffer = new Buffer(new ArrayBuffer(8));
      converter.serialize(new Decimal('126e-3'), buffer);
      expect(buffer.dataView.getBigUint64(0, true)).toBe(BigInt('0x316000000000007E'));
    });

    it('should encode 9999999e90 to 0x3D0000000098967F', () => {
      const buffer = new Buffer(new ArrayBuffer(8));
      converter.serialize(new Decimal('9999999e90'), buffer);
      expect(buffer.dataView.getBigUint64(0, true)).toBe(BigInt('0x3D0000000098967F'));
    });

    it('should encode 9999999e-99 to 0x256000000098967F', () => {
      const buffer = new Buffer(new ArrayBuffer(8));
      converter.serialize(new Decimal('9999999e-99'), buffer);
      expect(buffer.dataView.getBigUint64(0, true)).toBe(BigInt('0x256000000098967F'));
    });

    it('should encode 1e-6 to 0x3100000000000001', () => {
      const buffer = new Buffer(new ArrayBuffer(8));
      converter.serialize(new Decimal('1e-6'), buffer);
      expect(buffer.dataView.getBigUint64(0, true)).toBe(BigInt('0x3100000000000001'));
    });

    it('should encode 9999999999999999 to 0x6C7386F26FC0FFFF', () => {
      const buffer = new Buffer(new ArrayBuffer(8));
      converter.serialize(new Decimal('9999999999999999'), buffer);
      expect(buffer.dataView.getBigUint64(0, true)).toBe(BigInt('0x6C7386F26FC0FFFF'));
    });

    it('should encode 9999999999999999e369 to 0x77FB86F26FC0FFFF', () => {
      const buffer = new Buffer(new ArrayBuffer(8));
      converter.serialize(new Decimal('9999999999999999e369'), buffer);
      expect(buffer.dataView.getBigUint64(0, true)).toBe(BigInt('0x77FB86F26FC0FFFF'));
    });

    it('should encode 9999999999999999e370 to 0x7800000000000000 (positive overflow → +Inf)', () => {
      const buffer = new Buffer(new ArrayBuffer(8));
      converter.serialize(new Decimal('9999999999999999e370'), buffer);
      expect(buffer.dataView.getBigUint64(0, true)).toBe(BigInt('0x7800000000000000'));
    });

    it('should encode -9999999999999999e370 to 0xF800000000000000 (negative overflow → -Inf)', () => {
      const buffer = new Buffer(new ArrayBuffer(8));
      converter.serialize(new Decimal('-9999999999999999e370'), buffer);
      expect(buffer.dataView.getBigUint64(0, true)).toBe(BigInt('0xF800000000000000'));
    });

    it('should encode 9999999999999999e-383 to 0x607B86F26FC0FFFF', () => {
      const buffer = new Buffer(new ArrayBuffer(8));
      converter.serialize(new Decimal('9999999999999999e-383'), buffer);
      expect(buffer.dataView.getBigUint64(0, true)).toBe(BigInt('0x607B86F26FC0FFFF'));
    });

    it('should encode 9999999999999999e-398 to 0x600386F26FC0FFFF', () => {
      const buffer = new Buffer(new ArrayBuffer(8));
      converter.serialize(new Decimal('9999999999999999e-398'), buffer);
      expect(buffer.dataView.getBigUint64(0, true)).toBe(BigInt('0x600386F26FC0FFFF'));
    });

    it('should encode -9999999999999999e-398 to 0xE00386F26FC0FFFF', () => {
      const buffer = new Buffer(new ArrayBuffer(8));
      converter.serialize(new Decimal('-9999999999999999e-398'), buffer);
      expect(buffer.dataView.getBigUint64(0, true)).toBe(BigInt('0xE00386F26FC0FFFF'));
    });

    it('should encode 9999999999999999e-399 to 0x0000000000000000 (positive underflow → +0)', () => {
      const buffer = new Buffer(new ArrayBuffer(8));
      converter.serialize(new Decimal('9999999999999999e-399'), buffer);
      expect(buffer.dataView.getBigUint64(0, true)).toBe(BigInt('0x0000000000000000'));
    });

    it('should encode -9999999999999999e-399 to 0x8000000000000000 (negative underflow → -0)', () => {
      const buffer = new Buffer(new ArrayBuffer(8));
      converter.serialize(new Decimal('-9999999999999999e-399'), buffer);
      expect(buffer.dataView.getBigUint64(0, true)).toBe(BigInt('0x8000000000000000'));
    });

    it('should encode 1e+383 to 0x5FE05AF3107A4000', () => {
      const buffer = new Buffer(new ArrayBuffer(8));
      converter.serialize(new Decimal('1e+383'), buffer);
      expect(buffer.dataView.getBigUint64(0, true)).toBe(BigInt('0x5FE05AF3107A4000'));
    });

    it('should encode 1e+384 to 0x5FE38D7EA4C68000', () => {
      const buffer = new Buffer(new ArrayBuffer(8));
      converter.serialize(new Decimal('1e+384'), buffer);
      expect(buffer.dataView.getBigUint64(0, true)).toBe(BigInt('0x5FE38D7EA4C68000'));
    });

    it('should encode 1e999 to 0x7800000000000000 (overflow → +Inf)', () => {
      const buffer = new Buffer(new ArrayBuffer(8));
      converter.serialize(new Decimal('1e999'), buffer);
      expect(buffer.dataView.getBigUint64(0, true)).toBe(BigInt('0x7800000000000000'));
    });

    it('should encode -1e999 to 0xF800000000000000 (overflow → -Inf)', () => {
      const buffer = new Buffer(new ArrayBuffer(8));
      converter.serialize(new Decimal('-1e999'), buffer);
      expect(buffer.dataView.getBigUint64(0, true)).toBe(BigInt('0xF800000000000000'));
    });

    it('should encode 0e-999 to 0x0000000000000000 (underflow → +0)', () => {
      const buffer = new Buffer(new ArrayBuffer(8));
      converter.serialize(new Decimal('0e-999'), buffer);
      expect(buffer.dataView.getBigUint64(0, true)).toBe(BigInt('0x0000000000000000'));
    });

    it('should encode NaN to 0x7C00000000000000', () => {
      const buffer = new Buffer(new ArrayBuffer(8));
      converter.serialize(new Decimal('NaN'), buffer);
      expect(buffer.dataView.getBigUint64(0, true)).toBe(BigInt('0x7C00000000000000'));
    });
  });
});
