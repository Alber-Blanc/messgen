import { describe, it, expect } from 'vitest';
import Decimal from 'decimal.js';
import { DecimalConverter } from './DecimalConverter';
import { Buffer } from '../../Buffer';

describe('DecimalConverter', () => {
  const converter = new DecimalConverter();

  describe('#deserialize', () => {
    it('should decode 0x308462D53C8ABAC0 to 123456.7890123456', () => {
      const data = toBytes('0x308462D53C8ABAC0');

      const value = converter.deserialize(new Buffer(data.buffer));

      expect(value.toString()).toBe('123456.7890123456');
    });

    it('should decode 0x31C0000000000001 to 1', () => {
      const data = toBytes('0x31C0000000000001');

      const value = converter.deserialize(new Buffer(data.buffer));

      expect(value.toString()).toBe('1');
    });

    it('should decode 0x31C000000000007B to 123', () => {
      const data = toBytes('0x31C000000000007B');

      const value = converter.deserialize(new Buffer(data.buffer));

      expect(value.toString()).toBe('123');
    });

    it('should decode 0x318000000000007B to 1.23', () => {
      const data = toBytes('0x318000000000007B');

      const value = converter.deserialize(new Buffer(data.buffer));

      expect(value.toString()).toBe('1.23');
    });

    it('should decode 0x320000000000007B to 12300', () => {
      const data = toBytes('0x320000000000007B');

      const value = converter.deserialize(new Buffer(data.buffer));

      expect(value.toString()).toBe('12300');
    });

    it('should decode 0xB1C000000000007B to -123', () => {
      const data = toBytes('0xB1C000000000007B');

      const value = converter.deserialize(new Buffer(data.buffer));

      expect(value.toString()).toBe('-123');
    });

    it('should decode 0xB1A000000000007B to -12.3', () => {
      const data = toBytes('0xB1A000000000007B');

      const value = converter.deserialize(new Buffer(data.buffer));

      expect(value.toString()).toBe('-12.3');
    });

    it('should decode 0x31C0000000000000 to 0', () => {
      const data = toBytes('0x31C0000000000000');

      const value = converter.deserialize(new Buffer(data.buffer));

      expect(value.toString()).toBe('0');
    });

    it('should decode 0x3E40000000000000 to 0 (positive sub‑normal zero)', () => {
      const data = toBytes('0x3E40000000000000');

      const value = converter.deserialize(new Buffer(data.buffer));

      expect(value.toString()).toBe('0');
    });

    it('should decode 0x2540000000000000 to 0 (negative sub‑normal zero)', () => {
      const data = toBytes('0x2540000000000000');

      const value = converter.deserialize(new Buffer(data.buffer));

      expect(value.toString()).toBe('0');
    });

    it('should decode 0x31C000000098967F to 9999999', () => {
      const data = toBytes('0x31C000000098967F');

      const value = converter.deserialize(new Buffer(data.buffer));

      expect(value.toString()).toBe('9999999');
    });

    it('should decode 0x2E40000000000001 to 1e-28', () => {
      const data = toBytes('0x2E40000000000001');

      const value = converter.deserialize(new Buffer(data.buffer));

      expect(value.toString()).toBe('1e-28');
    });

    it('should decode 0x3540000000000009 to 9e+28', () => {
      const data = toBytes('0x3540000000000009');

      const value = converter.deserialize(new Buffer(data.buffer));

      expect(value.toString()).toBe('9e+28');
    });

    it('should decode 0x2FE38D7EA4C67FFF to 0.999999999999999', () => {
      const data = toBytes('0x2FE38D7EA4C67FFF');

      const value = converter.deserialize(new Buffer(data.buffer));

      expect(value.toString()).toBe('0.999999999999999');
    });

    it('should decode 0x31A0000000000005 to 0.5', () => {
      const data = toBytes('0x31A0000000000005');
      const value = converter.deserialize(new Buffer(data.buffer));
      expect(value.toString()).toBe('0.5');
    });

    it('should decode 0x318000000000000F to 0.15', () => {
      const data = toBytes('0x318000000000000F');

      const value = converter.deserialize(new Buffer(data.buffer));

      expect(value.toString()).toBe('0.15');
    });

    it('should decode 0x316000000000007D to 0.125', () => {
      const data = toBytes('0x316000000000007D');

      const value = converter.deserialize(new Buffer(data.buffer));

      expect(value.toString()).toBe('0.125');
    });

    it('should decode 0x316000000000007E to 0.126', () => {
      const data = toBytes('0x316000000000007E');

      const value = converter.deserialize(new Buffer(data.buffer));

      expect(value.toString()).toBe('0.126');
    });

    it('should decode 0x3D0000000098967F to 9999999e+90', () => {
      const data = toBytes('0x3D0000000098967F');

      const value = converter.deserialize(new Buffer(data.buffer));

      expect(value.eq(new Decimal('9999999e+90'))).toBe(true);
    });

    it('should decode 0x256000000098967F to 9999999e-99', () => {
      const data = toBytes('0x256000000098967F');

      const value = converter.deserialize(new Buffer(data.buffer));

      expect(value.eq(new Decimal('9999999e-99'))).toBe(true);
    });

    it('should decode 0x3100000000000001 to 0.000001', () => {
      const data = toBytes('0x3100000000000001');

      const value = converter.deserialize(new Buffer(data.buffer));

      expect(value.toString()).toBe('0.000001');
    });

    it('should decode 0x6C7386F26FC0FFFF to 9999999999999999', () => {
      const data = toBytes('0x6C7386F26FC0FFFF');

      const value = converter.deserialize(new Buffer(data.buffer));

      expect(value.toString()).toBe('9999999999999999');
    });

    it('should decode 0x7800000000000000 to Infinity', () => {
      const data = toBytes('0x7800000000000000');

      const value = converter.deserialize(new Buffer(data.buffer));

      expect(value.toString()).toBe('Infinity');
    });

    it('should decode 0x607B86F26FC0FFFF to 9999999999999999e-383', () => {
      const data = toBytes('0x607B86F26FC0FFFF');

      const value = converter.deserialize(new Buffer(data.buffer));

      expect(value.eq('9999999999999999e-383')).toBe(true);
    });

    it('should decode 0x5FE05AF3107A4000 to 1e+383', () => {
      const data = toBytes('0x5FE05AF3107A4000');

      const value = converter.deserialize(new Buffer(data.buffer));

      expect(value.toString()).toBe('1e+383');
    });

    it('should decode 0x5FE38D7EA4C68000 to 1e+384', () => {
      const data = toBytes('0x5FE38D7EA4C68000');

      const value = converter.deserialize(new Buffer(data.buffer));

      expect(value.toString()).toBe('1e+384');
    });

    it('should decode 0xF800000000000000 to -Infinity', () => {
      const data = toBytes('0xF800000000000000');

      const value = converter.deserialize(new Buffer(data.buffer));

      expect(value.toString()).toBe('-Infinity');
    });

    it('should decode 0x7C00000000000000 to NaN', () => {
      const data = toBytes('0x7C00000000000000');

      const value = converter.deserialize(new Buffer(data.buffer));

      expect(value.isNaN()).toBe(true);
    });

    it('should decode 0x308462D53C8ABAC0 to 123456.7890123456', () => {
      expectDecimal('0x308462D53C8ABAC0', '123456.7890123456');
    });

    it('should decode 0x31C0000000000001 to 1', () => {
      expectDecimal('0x31C0000000000001', '1');
    });

    it('should decode 0x31C000000000007B to 123', () => {
      expectDecimal('0x31C000000000007B', '123');
    });

    it('should decode 0x318000000000007B to 1.23', () => {
      expectDecimal('0x318000000000007B', '1.23');
    });

    it('should decode 0x320000000000007B to 12300', () => {
      expectDecimal('0x320000000000007B', '12300');
    });

    it('should decode 0xB1C000000000007B to -123', () => {
      expectDecimal('0xB1C000000000007B', '-123');
    });

    it('should decode 0xB1A000000000007B to -12.3', () => {
      expectDecimal('0xB1A000000000007B', '-12.3');
    });

    it('should decode 0x31C0000000000000 to 0', () => {
      expectDecimal('0x31C0000000000000', '0');
    });

    it('should decode 0x3E40000000000000 to +0 (0e+100)', () => {
      expectDecimal('0x3E40000000000000', '0');
    });

    it('should decode 0x31C000000098967F to 9999999', () => {
      expectDecimal('0x31C000000098967F', '9999999');
    });

    it('should decode 0x2E40000000000001 to 1e-28', () => {
      expectDecimal('0x2E40000000000001', '1e-28');
    });

    it('should decode 0x3540000000000009 to 9e+28', () => {
      expectDecimal('0x3540000000000009', '9e+28');
    });

    it('should decode 0x2FE38D7EA4C67FFF to 999999999999999e-15', () => {
      expectDecimal('0x2FE38D7EA4C67FFF', '999999999999999e-15');
    });

    it('should decode 0x31A0000000000005 to 5e-1', () => {
      expectDecimal('0x31A0000000000005', '5e-1');
    });

    it('should decode 0x318000000000000F to 15e-2', () => {
      expectDecimal('0x318000000000000F', '15e-2');
    });

    it('should decode 0x316000000000007D to 125e-3', () => {
      expectDecimal('0x316000000000007D', '125e-3');
    });

    it('should decode 0x316000000000007E to 126e-3', () => {
      expectDecimal('0x316000000000007E', '126e-3');
    });

    it('should decode 0x3D0000000098967F to 9999999e90', () => {
      expectDecimal('0x3D0000000098967F', '9999999e+90');
    });

    it('should decode 0x256000000098967F to 9999999e-99', () => {
      expectDecimal('0x256000000098967F', '9999999e-99');
    });

    it('should decode 0x3100000000000001 to 1e-6', () => {
      expectDecimal('0x3100000000000001', '1e-6');
    });

    it('should decode 0x6C7386F26FC0FFFF to 9999999999999999', () => {
      expectDecimal('0x6C7386F26FC0FFFF', '9999999999999999');
    });

    it('should decode 0x77FB86F26FC0FFFF to 9999999999999999e369', () => {
      expectDecimal('0x77FB86F26FC0FFFF', '9999999999999999e369');
    });

    it('should decode overflow +Inf from 0x7800000000000000', () => {
      const data = toBytes('0x7800000000000000');
      const buf = new Buffer(data.buffer);

      const result = converter.deserialize(buf);

      expect(result.isFinite()).toBe(false);
      expect(result.isNegative()).toBe(false);
    });

    it('should decode overflow -Inf from 0xF800000000000000', () => {
      const data = toBytes('0xF800000000000000');
      const buf = new Buffer(data.buffer);

      const result = converter.deserialize(buf);

      expect(result.isFinite()).toBe(false);
      expect(result.isNegative()).toBe(true);
    });

    it('should decode 0x607B86F26FC0FFFF to 9999999999999999e-383', () => {
      expectDecimal('0x607B86F26FC0FFFF', '9999999999999999e-383');
    });

    it('should decode 0x600386F26FC0FFFF to 9999999999999999e-398', () => {
      expectDecimal('0x600386F26FC0FFFF', '9999999999999999e-398');
    });

    it('should decode positive underflow → +0 from 0x0000000000000000', () => {
      const data = toBytes('0x0000000000000000');
      const buf = new Buffer(data.buffer);

      const result = converter.deserialize(buf);

      expect(result.isZero()).toBe(true);
      expect(result.isNegative()).toBe(false);
    });

    it('should decode negative underflow → -0 from 0x8000000000000000', () => {
      const data = toBytes('0x8000000000000000');
      const buf = new Buffer(data.buffer);

      const result = converter.deserialize(buf);

      expect(result.isZero()).toBe(true);
      expect(result.isNegative()).toBe(true);
    });

    it('should decode 0x5FE05AF3107A4000 to 1e+383', () => {
      expectDecimal('0x5FE05AF3107A4000', '1e+383');
    });

    it('should decode 0x5FE38D7EA4C68000 to 1e+384', () => {
      expectDecimal('0x5FE38D7EA4C68000', '1e+384');
    });

    it('should decode NaN from 0x7C00000000000000', () => {
      const data = toBytes('0x7C00000000000000');
      const buf = new Buffer(data.buffer);
      const result = converter.deserialize(buf);
      expect(result.isNaN()).toBe(true);
    });
  });
  describe('#serialize', () => {
    it('should encode 0 → 0x31C0000000000000', () => {
      expectSerialize(0, '0x31C0000000000000');
    });

    it('should encode 1 → 0x31C0000000000001', () => {
      expectSerialize(1, '0x31C0000000000001');
    });

    it('should encode 123 → 0x31C000000000007B', () => {
      expectSerialize(123, '0x31C000000000007B');
    });

    it('should encode 1.23 → 0x318000000000007B', () => {
      expectSerialize('1.23', '0x318000000000007B');
    });

    it('should encode 12300 → 0x320000000000007B', () => {
      expectSerialize('12300', '0x320000000000007B');
    });

    it('should encode -123 → 0xB1C000000000007B', () => {
      expectSerialize(-123, '0xB1C000000000007B');
    });

    it('should encode -12.3 → 0xB1A000000000007B', () => {
      expectSerialize('-12.3', '0xB1A000000000007B');
    });

    it('should encode 0.5 → 0x31A0000000000005', () => {
      expectSerialize('0.5', '0x31A0000000000005');
    });

    it('should encode 0.15 → 0x318000000000000F', () => {
      expectSerialize('0.15', '0x318000000000000F');
    });

    it('should encode 0.125 → 0x316000000000007D', () => {
      expectSerialize('0.125', '0x316000000000007D');
    });

    it('should encode 9999999 → 0x31C000000098967F', () => {
      expectSerialize('9999999', '0x31C000000098967F');
    });

    it('should encode 1e-28 → 0x2E40000000000001', () => {
      expectSerialize('1e-28', '0x2E40000000000001');
    });

    it('should encode 9e+28 → 0x3540000000000009', () => {
      expectSerialize('9e+28', '0x3540000000000009');
    });

    it('should encode 9999999999999999 → 0x6C7386F26FC0FFFF', () => {
      expectSerialize('9999999999999999', '0x6C7386F26FC0FFFF');
    });

    it('should encode 9999999999999999e-383 → 0x607B86F26FC0FFFF', () => {
      expectSerialize('9999999999999999e-383', '0x607B86F26FC0FFFF');
    });

    it('should encode +Infinity → 0x7800000000000000', () => {
      expectSerialize(Infinity, '0x7800000000000000');
    });

    it('should encode -Infinity → 0xF800000000000000', () => {
      expectSerialize(-Infinity, '0xF800000000000000');
    });

    it('should encode NaN → 0x7C00000000000000', () => {
      const buf = new Buffer(new ArrayBuffer(8));
      converter.serialize(NaN, buf);

      const bits = fromBytes(new Uint8Array(buf.buffer));
      expect(bits).toBe(0x7C00000000000000n);
    });

    function expectSerialize(value: Decimal | string | number, expectedHex: string) {
      const buf = new Buffer(new ArrayBuffer(8));
      converter.serialize(value, buf);

      const actual = fromBytes(new Uint8Array(buf.buffer));
      expect(actual).toBe(BigInt(expectedHex));
    }

    function fromBytes(bytes: Uint8Array): bigint {
      let bits = 0n;
      for (let i = 0; i < 8; i++) {
        bits |= BigInt(bytes[i]) << BigInt(i * 8);
      }
      return bits;
    }
  });

  function expectDecimal(bitsHex: string, expected: string) {
    const data = toBytes(bitsHex);
    const buf = new Buffer(data.buffer);
    const result = converter.deserialize(buf);
    expect(result.eq(new Decimal(expected))).toBe(true);
  }

  function toBytes(hex: string): Uint8Array {
    const bigint = BigInt(hex);
    const bytes = new Uint8Array(8);
    for (let i = 0; i < 8; i++) {
      bytes[i] = Number((bigint >> BigInt(i * 8)) & 0xffn);
    }
    return bytes;
  }
});
