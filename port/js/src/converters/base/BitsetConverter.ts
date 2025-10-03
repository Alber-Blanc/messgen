import { Converter } from '../Converter';
import type { IValue, BitsetTypeDefinition } from '../../types';
import type { Buffer } from '../../Buffer';
import type { GetType } from './../ConverterFactory';

export class BitsetConverter extends Converter {
  private converter: Converter;
  private readonly mask: number;

  constructor(typeDef: BitsetTypeDefinition, getType: GetType) {
    super(typeDef.typeName);
    this.converter = getType(typeDef.type);

    this.mask = typeDef.bits.reduce((mask, bit) => {
      if (bit.offset < 0 || bit.offset > 31) {
        throw new Error(`Invalid bit offset=${bit.offset} for bit="${bit.name}"`);
      }
      return mask | (1 << bit.offset);
    }, 0);
  }

  deserialize(buffer: Buffer): number {
    const raw = this.converter.deserialize(buffer) as number;
    return raw & this.mask;
  }

  serialize(value: IValue, buffer: Buffer): void {
    const flags = this.toNumber(value);
    if ((flags & ~this.mask) !== 0) {
      throw new Error(`Invalid bits set in value: ${(flags & ~this.mask).toString(2)}`);
    }
    this.converter.serialize(flags, buffer);
  }

  size(value: IValue): number {
    const flags = this.toNumber(value);
    return this.converter.size(flags);
  }

  default(): number {
    return 0;
  }

  private toNumber(value: IValue): number {
    if (typeof value === 'number') {
      return value;
    }
    throw new Error(`Bitset value must be a number, got: ${typeof value}`);
  }
}
