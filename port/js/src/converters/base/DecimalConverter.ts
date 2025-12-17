import Decimal from 'decimal.js';
import { Converter } from '../Converter';
import type { Buffer } from '../../Buffer';

export class DecimalConverter extends Converter {
  private static readonly TYPE_NAME = 'dec64';

  private static readonly MAX_COEFFICIENT = (10n ** 16n) - 1n;
  private static readonly MAX_EXPONENT = 369;
  private static readonly MIN_EXPONENT = -398;

  private static readonly SIGN_BIT_POSITION = 63n;
  private static readonly COMBINATION_BIT_OFFSET = 58n;
  private static readonly COMBINATION_MASK = 0b11111n;

  private static readonly SPECIAL_NAN_COMBINATION = 0b11111n;
  private static readonly SPECIAL_INF_COMBINATION = 0b11110n;

  private static readonly EXPONENT_BIT_WIDTH = 10;
  private static readonly COEFF_BITS_NORMAL = 53;
  private static readonly COEFF_BITS_COMPACT = 51;
  private static readonly IMPLICIT_BIT = 0b100n;

  constructor() {
    super(DecimalConverter.TYPE_NAME);
  }

  serialize(input: Input, buffer: Buffer): void {
    const value = input instanceof Decimal ? input : new Decimal(input);
    const bits = this.toBinary(value);

    this.write(bits, buffer);
  }

  deserialize(buffer: Buffer): Decimal {
    const bits = this.read(buffer);

    return this.parse(bits);
  }

  size(): number {
    return 8;
  }

  default(): Decimal {
    return new Decimal('0');
  }

  private toBinary(value: Decimal): bigint {
    if (value.isNaN()) {
      return this.toNaN();
    }
    if (!value.isFinite()) {
      return this.toInfinity(value.isNegative());
    }
    return this.toFinite(value);
  }

  private toNaN(): bigint {
    return DecimalConverter.SPECIAL_NAN_COMBINATION << DecimalConverter.COMBINATION_BIT_OFFSET;
  }

  private toInfinity(isNegative: boolean): bigint {
    const sign = isNegative ? 1n : 0n;
    return (sign << DecimalConverter.SIGN_BIT_POSITION)
      | (DecimalConverter.SPECIAL_INF_COMBINATION << DecimalConverter.COMBINATION_BIT_OFFSET);
  }

  private toFinite(value: Decimal): bigint {
    const sign = value.isNegative() ? 1n : 0n;
    const { coefficient, exponent } = this.normalize(value.abs());

    if (this.isOverflow(sign, coefficient, exponent)) {
      return (sign << DecimalConverter.SIGN_BIT_POSITION)
        | (DecimalConverter.SPECIAL_INF_COMBINATION << DecimalConverter.COMBINATION_BIT_OFFSET);
    }
    if (this.isUnderflow(coefficient, exponent)) {
      return sign << DecimalConverter.SIGN_BIT_POSITION;
    }

    return this.encode(sign, coefficient, exponent);
  }

  private normalize(value: Decimal): NormalizedDecimal {
    let exponent = 0;
    let v = value;

    while (!v.isInteger() && exponent > DecimalConverter.MIN_EXPONENT) {
      v = v.mul(10);
      exponent--;
    }

    let coefficient = BigInt(v.toFixed(0));

    while (coefficient !== 0n && coefficient % 10n === 0n && exponent < DecimalConverter.MAX_EXPONENT) {
      coefficient /= 10n;
      exponent++;
    }

    while (exponent > DecimalConverter.MAX_EXPONENT && coefficient * 10n <= DecimalConverter.MAX_COEFFICIENT) {
      coefficient *= 10n;
      exponent--;
    }

    return { coefficient, exponent };
  }

  private isOverflow(sign: bigint, coefficient: bigint, exponent: number): boolean {
    return (sign === 0n && coefficient > DecimalConverter.MAX_COEFFICIENT)
      || exponent > DecimalConverter.MAX_EXPONENT;
  }

  private isUnderflow(coefficient: bigint, exponent: number): boolean {
    return coefficient > DecimalConverter.MAX_COEFFICIENT
      || exponent < DecimalConverter.MIN_EXPONENT;
  }

  private encode(sign: bigint, coefficient: bigint, exponent: number): bigint {
    let bits = sign;
    let coeffBits = DecimalConverter.COEFF_BITS_NORMAL;

    if (coefficient > ((1n << BigInt(DecimalConverter.COEFF_BITS_NORMAL)) - 1n)) {
      bits = (bits << 2n) | 0b11n;
      coeffBits = DecimalConverter.COEFF_BITS_COMPACT;
    }

    bits = (bits << BigInt(DecimalConverter.EXPONENT_BIT_WIDTH))
      | BigInt(exponent - DecimalConverter.MIN_EXPONENT);
    bits = (bits << BigInt(coeffBits))
      | (coefficient & ((1n << BigInt(coeffBits)) - 1n));

    return bits;
  }

  private write(bits: bigint, buffer: Buffer): void {
    for (let i = 0; i < 8; i++) {
      buffer.dataView.setUint8(
        buffer.offset + i,
        Number((bits >> BigInt(i * 8)) & 0xffn),
      );
    }
    buffer.offset += 8;
  }

  private read(buffer: Buffer): bigint {
    let bits = 0n;
    for (let i = 0; i < 8; i++) {
      bits |= BigInt(buffer.dataView.getUint8(buffer.offset + i)) << BigInt(i * 8);
    }

    buffer.offset += 8;
    return bits;
  }

  private parse(bits: bigint): Decimal {
    if (bits === 0n) {
      return new Decimal('0');
    }

    const sign = bits >> DecimalConverter.SIGN_BIT_POSITION;
    const combination = (bits >> DecimalConverter.COMBINATION_BIT_OFFSET)
      & DecimalConverter.COMBINATION_MASK;

    if (combination >= DecimalConverter.SPECIAL_INF_COMBINATION) {
      if (combination === DecimalConverter.SPECIAL_INF_COMBINATION) {
        return new Decimal(sign === 0n ? Infinity : -Infinity);
      }
      return new Decimal(NaN);
    }

    const isCompact = (combination >> 3n) === 0b11n;
    const coeffBits = isCompact ? DecimalConverter.COEFF_BITS_COMPACT : DecimalConverter.COEFF_BITS_NORMAL;
    const implicit = isCompact ? DecimalConverter.IMPLICIT_BIT : 0n;

    const exponent = Number((bits >> BigInt(coeffBits)) & ((1n << BigInt(DecimalConverter.EXPONENT_BIT_WIDTH)) - 1n))
      + DecimalConverter.MIN_EXPONENT;
    const coefficient = (implicit << BigInt(coeffBits))
      | (bits & ((1n << BigInt(coeffBits)) - 1n));

    const value = new Decimal(coefficient.toString())
      .mul(new Decimal(10).pow(exponent));
    return sign === 1n ? value.neg() : value;
  }
}

type Input = Decimal | number | string;

interface NormalizedDecimal {
  coefficient: bigint;
  exponent: number
}
