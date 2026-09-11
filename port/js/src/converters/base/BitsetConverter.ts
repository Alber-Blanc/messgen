import { Converter } from '../Converter';
import type { BitsetTypeDefinition } from '../../types';
import type { Cursor } from '../../Cursor';
import type { GetType } from './../ConverterFactory';

export class BitsetConverter extends Converter<number> {
  private converter: Converter<number>;
  private mask: number;

  constructor(typeDef: BitsetTypeDefinition, getType: GetType) {
    super(typeDef.typeName);
    this.converter = getType(typeDef.type) as Converter<number>;

    this.mask = typeDef.bits.reduce((mask, bit) => {
      if (bit.offset < 0 || bit.offset > 31) {
        throw new Error(`Invalid bit offset=${bit.offset} for bit="${bit.name}"`);
      }
      return mask | (1 << bit.offset);
    }, 0);
  }

  deserialize(buffer: Cursor): number {
    const raw = this.converter.deserialize(buffer);
    return raw & this.mask;
  }

  serialize(value: unknown, buffer: Cursor): void {
    const flags = this.toNumber(value);
    if ((flags & ~this.mask) !== 0) {
      throw new Error(`Invalid bits set in value: ${(flags & ~this.mask).toString(2)}`);
    }
    this.converter.serialize(flags, buffer);
  }

  size(value: unknown): number {
    const flags = this.toNumber(value);
    return this.converter.size(flags);
  }

  createDefault(): number {
    return 0;
  }

  private toNumber(value: unknown): number {
    if (typeof value === 'number') {
      return value;
    }
    throw new Error(`Bitset value must be a number, got: ${typeof value}`);
  }
}
