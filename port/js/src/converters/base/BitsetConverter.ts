import { Converter } from '../Converter';
import type { IValue, BitsetTypeDefinition } from '../../types';
import type { Buffer } from '../../Buffer';
import type { GetType } from './../ConverterFactory';

export class BitsetConverter extends Converter {
  private converter: Converter;
  private readonly offsets: number[];

  constructor(typeDef: BitsetTypeDefinition, getType: GetType) {
    super(typeDef.typeName);
    this.converter = getType(typeDef.type);

    this.offsets = typeDef.bits.map((b) => {
      if (b.offset < 0) {
        throw new Error(`Invalid bit offset=${b.offset} for bit="${b.name}"`);
      }
      return b.offset;
    });
  }

  deserialize(buffer: Buffer): Set<number> {
    const raw = this.converter.deserialize(buffer) as number;
    const result = new Set<number>();

    for (const offset of this.offsets) {
      if (raw & (1 << offset)) {
        result.add(offset);
      }
    }

    return result;
  }

  serialize(value: IValue, buffer: Buffer): void {
    const raw = this.toRaw(value);
    this.converter.serialize(raw, buffer);
  }

  size(value: IValue): number {
    return this.converter.size(typeof value === 'number' ? value : 0);
  }

  default(): Set<number> {
    return new Set();
  }

  private toRaw(value: IValue): number {
    if (typeof value === 'number') {
      return value;
    }

    const entries = this.normalize(value);
    let raw = 0;

    for (const v of entries) {
      if (!this.offsets.includes(v)) {
        throw new Error(`Unsupported bit offset=${v} for bitset=${this.name}`);
      }
      raw |= 1 << v;
    }

    return raw;
  }

  private normalize(value: IValue): Iterable<number> {
    if (value instanceof Set || Array.isArray(value)) {
      return value as Iterable<number>;
    }
    throw new Error(`Invalid bitset value type: ${typeof value}`);
  }
}
