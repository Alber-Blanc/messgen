import { describe, it, expect } from 'vitest';
import Decimal from 'decimal.js';
import { DecimalConverter } from './DecimalConverter';
import { Buffer } from '../../Buffer';

describe('DecimalConverter', () => {
  const converter = new DecimalConverter();

  describe('#deserialize', () => {
    it.each([
      { hex: '0x308462D53C8ABAC0', expected: '123456.7890123456' },
      { hex: '0x31C0000000000001', expected: '1' },
      { hex: '0x31C000000000007B', expected: '123' },
      { hex: '0x318000000000007B', expected: '1.23' },
      { hex: '0x320000000000007B', expected: '12300' },
      { hex: '0xB1C000000000007B', expected: '-123' },
      { hex: '0xB1A000000000007B', expected: '-12.3' },
      { hex: '0x31C0000000000000', expected: '0' },
      { hex: '0x3E40000000000000', expected: '0' },
      { hex: '0x2540000000000000', expected: '0' },
      { hex: '0x31C000000098967F', expected: '9999999' },
      { hex: '0x2E40000000000001', expected: '1e-28' },
      { hex: '0x3540000000000009', expected: '9e+28' },
      { hex: '0x2FE38D7EA4C67FFF', expected: '999999999999999e-15' },
      { hex: '0x31A0000000000005', expected: '5e-1' },
      { hex: '0x318000000000000F', expected: '15e-2' },
      { hex: '0x316000000000007D', expected: '125e-3' },
      { hex: '0x316000000000007E', expected: '126e-3' },
      { hex: '0x3D0000000098967F', expected: '9999999e+90' },
      { hex: '0x6C7386F26FC0FFFF', expected: '9999999999999999' },
      { hex: '0x607B86F26FC0FFFF', expected: '9999999999999999e-383' },
      { hex: '0x5FE38D7EA4C68000', expected: '1e+384' },
      { hex: '0x256000000098967F', expected: '9999999e-99' },
      { hex: '0x3100000000000001', expected: '1e-6' },
      { hex: '0x77FB86F26FC0FFFF', expected: '9999999999999999e369' },
      { hex: '0x600386F26FC0FFFF', expected: '9999999999999999e-398' },
      { hex: '0x5FE05AF3107A4000', expected: '1e+383' },
    ])('should decode $hex to $expected', ({ hex, expected }) => {
      const buffer = new Buffer(toBytes(hex));
      const expectedValue = new Decimal(expected).toString();

      const value = converter.deserialize(buffer);

      expect(value.toString()).toBe(expectedValue);
    });

    describe.each([
      { hex: '0x7800000000000000', expected: 'Infinity', negative: false },
      { hex: '0xF800000000000000', expected: '-Infinity', negative: true },
    ])('infinity $hex', ({ hex, expected, negative }) => {
      it('should decode the value', () => {
        const buffer = new Buffer(toBytes(hex));

        const value = converter.deserialize(buffer);

        expect(value.toString()).toBe(expected);
      });

      it('should return a non-finite value', () => {
        const buffer = new Buffer(toBytes(hex));

        const value = converter.deserialize(buffer);

        expect(value.isFinite()).toBe(false);
      });

      it('should preserve the sign', () => {
        const buffer = new Buffer(toBytes(hex));

        const value = converter.deserialize(buffer);

        expect(value.isNegative()).toBe(negative);
      });
    });

    describe.each([
      { hex: '0x0000000000000000', negative: false },
      { hex: '0x8000000000000000', negative: true },
    ])('underflow $hex', ({ hex, negative }) => {
      it('should decode to zero', () => {
        const buffer = new Buffer(toBytes(hex));

        const value = converter.deserialize(buffer);

        expect(value.isZero()).toBe(true);
      });

      it('should preserve the sign', () => {
        const buffer = new Buffer(toBytes(hex));

        const value = converter.deserialize(buffer);

        expect(value.isNegative()).toBe(negative);
      });
    });

    it('should decode NaN', () => {
      const buffer = new Buffer(toBytes('0x7C00000000000000'));

      const value = converter.deserialize(buffer);

      expect(value.isNaN()).toBe(true);
    });
  });

  describe('#serialize', () => {
    it.each([
      { value: 0, expectedHex: '0x31C0000000000000' },
      { value: 1, expectedHex: '0x31C0000000000001' },
      { value: 123, expectedHex: '0x31C000000000007B' },
      { value: '1.23', expectedHex: '0x318000000000007B' },
      { value: '12300', expectedHex: '0x320000000000007B' },
      { value: -123, expectedHex: '0xB1C000000000007B' },
      { value: '-12.3', expectedHex: '0xB1A000000000007B' },
      { value: '0.5', expectedHex: '0x31A0000000000005' },
      { value: '0.15', expectedHex: '0x318000000000000F' },
      { value: '0.125', expectedHex: '0x316000000000007D' },
      { value: '9999999', expectedHex: '0x31C000000098967F' },
      { value: '1e-28', expectedHex: '0x2E40000000000001' },
      { value: '9e+28', expectedHex: '0x3540000000000009' },
      { value: '9999999999999999', expectedHex: '0x6C7386F26FC0FFFF' },
      { value: '9999999999999999e-383', expectedHex: '0x607B86F26FC0FFFF' },
      { value: Infinity, expectedHex: '0x7800000000000000' },
      { value: -Infinity, expectedHex: '0xF800000000000000' },
      { value: NaN, expectedHex: '0x7C00000000000000' },
    ])('should encode $value to $expectedHex', ({ value, expectedHex }) => {
      const buffer = new Buffer(new ArrayBuffer(8));
      const expected = BigInt(expectedHex);

      converter.serialize(value, buffer);

      expect(fromBytes(new Uint8Array(buffer.buffer))).toBe(expected);
    });
  });
});

function toBytes(hex: string): Uint8Array {
  const bigint = BigInt(hex);
  const bytes = new Uint8Array(8);
  for (let i = 0; i < 8; i++) {
    bytes[i] = Number((bigint >> BigInt(i * 8)) & 0xffn);
  }
  return bytes;
}

function fromBytes(bytes: Uint8Array): bigint {
  let bits = 0n;
  for (let i = 0; i < 8; i++) {
    bits |= BigInt(bytes[i]) << BigInt(i * 8);
  }
  return bits;
}
