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

describe('DecimalConverter deserialize little-endian', () => {
  const converter = new DecimalConverter();
  const cases: Array<[string, string]> = [
    ['0x308462D53C8ABAC0', '123456.7890123456'],
    ['0x31C0000000000001', '1'],
    ['0x31C000000000007B', '123'],
    ['0x318000000000007B', '1.23'],
    ['0x320000000000007B', '12300'],
    ['0xB1C000000000007B', '-123'],
    ['0xB1A000000000007B', '-12.3'],
    ['0x31C0000000000000', '0'],
    ['0x3E40000000000000', '0'],
    ['0x2540000000000000', '0'],
    ['0x31C000000098967F', '9999999'],
    ['0x2E40000000000001', '1e-28'],
    ['0x3540000000000009', '9e+28'],
    ['0x2FE38D7EA4C67FFF', '0.999999999999999'],
    ['0x31A0000000000005', '0.5'],
    ['0x318000000000000F', '0.15'],
    ['0x316000000000007D', '0.125'],
    ['0x316000000000007E', '0.126'],
    ['0x3D0000000098967F', '9999999e+90'],
    ['0x256000000098967F', '9999999e-99'],
    ['0x3100000000000001', '0.000001'],
    ['0x6C7386F26FC0FFFF', '9999999999999999'],
    ['0x7800000000000000', 'Infinity'],
    ['0x607B86F26FC0FFFF', '9999999999999999e-383'],
    ['0x5FE05AF3107A4000', '1e+383'],
    ['0x5FE38D7EA4C68000', '1e+384'],
    ['0xF800000000000000', '-Infinity'],
    ['0x7C00000000000000', 'NaN'],
  ];

  cases.forEach(([hex, expected]) => {
    it(`deserializes ${hex} to ${expected}`, () => {
      const data = hexToLEBytes(hex);
      const value = converter.deserialize(new Buffer(data.buffer));
      if (expected === 'NaN') {
        expect(value.isNaN()).toBe(true);
      } else {
        expect(value.toString()).toBe(expected);
      }
    });
  });
});

describe('DecimalConverter serialize little-endian', () => {
  const converter = new DecimalConverter();
  const cases: Array<[string, string]> = [
    ['123456.7890123456', '0x308462D53C8ABAC0'],
    ['1', '0x31C0000000000001'],
    ['123', '0x31C000000000007B'],
    ['1.23', '0x318000000000007B'],
    ['12300', '0x320000000000007B'],
    ['-123', '0xB1C000000000007B'],
    ['-12.3', '0xB1A000000000007B'],
    ['0', '0x31C0000000000000'],
    ['0e+100', '0x3E40000000000000'],
    ['0e-100', '0x2540000000000000'],
    ['9999999', '0x31C000000098967F'],
    ['1e-28', '0x2E40000000000001'],
    ['9e+28', '0x3540000000000009'],
    ['999999999999999e-15', '0x2FE38D7EA4C67FFF'],
    ['5e-1', '0x31A0000000000005'],
    ['15e-2', '0x318000000000000F'],
    ['125e-3', '0x316000000000007D'],
    ['126e-3', '0x316000000000007E'],
    ['9999999e90', '0x3D0000000098967F'],
    ['9999999e-99', '0x256000000098967F'],
    ['1e-6', '0x3100000000000001'],
    ['9999999999999999', '0x6C7386F26FC0FFFF'],
    ['9999999999999999e369', '0x77FB86F26FC0FFFF'],
    ['9999999999999999e370', '0x7800000000000000'],
    ['-9999999999999999e370', '0xF800000000000000'],
    ['9999999999999999e-383', '0x607B86F26FC0FFFF'],
    ['9999999999999999e-398', '0x600386F26FC0FFFF'],
    ['-9999999999999999e-398', '0xE00386F26FC0FFFF'],
    ['9999999999999999e-399', '0x0000000000000000'],
    ['-9999999999999999e-399', '0x8000000000000000'],
    ['1e+383', '0x5FE05AF3107A4000'],
    ['1e+384', '0x5FE38D7EA4C68000'],
    ['1e999', '0x7800000000000000'],
    ['-1e999', '0xF800000000000000'],
    ['0e-999', '0x0000000000000000'],
    ['NaN', '0x7C00000000000000'],
  ];

  cases.forEach(([input, hex]) => {
    it(`serializes ${input} to ${hex}`, () => {
      const bytes = converter.serialize(new Decimal(input));
      const dv = new DataView(bytes.buffer);
      expect(dv.getBigUint64(0, true)).toBe(BigInt(hex));
    });
  });
});
