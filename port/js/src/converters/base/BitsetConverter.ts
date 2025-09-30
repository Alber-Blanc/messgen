import { Converter } from '../Converter';
import type { IValue, BitsetTypeDefinition } from '../../types';
import type { Buffer } from '../../Buffer';
import type { GetType } from './../ConverterFactory';

export class BitsetConverter extends Converter {
  private converter: Converter;
  private readonly bitsByName: Map<string, number>;
  private readonly namesByOffset: Map<number, string>;

  constructor(typeDef: BitsetTypeDefinition, getType: GetType) {
    super(typeDef.typeName);
    this.converter = getType(typeDef.type);
    this.bitsByName = new Map();
    this.namesByOffset = new Map();

    for (const bit of typeDef.bits) {
      if (bit.offset < 0) {
        throw new Error(`Invalid bit offset=${bit.offset} for bit="${bit.name}"`);
      }
      if (this.bitsByName.has(bit.name)) {
        throw new Error(`Duplicate bit name="${bit.name}" in bitset=${this.name}`);
      }
      if (this.namesByOffset.has(bit.offset)) {
        throw new Error(`Duplicate bit offset=${bit.offset} in bitset=${this.name}`);
      }

      this.bitsByName.set(bit.name, bit.offset);
      this.namesByOffset.set(bit.offset, bit.name);
    }
  }

  deserialize(buffer: Buffer): Set<string> {
    const raw = this.converter.deserialize(buffer) as number;
    const result = new Set<string>();

    for (const [offset, name] of this.namesByOffset) {
      if (raw & (1 << offset)) {
        result.add(name);
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

  default(): Set<string> {
    return new Set<string>();
  }

  private toRaw(value: IValue): number {
    if (typeof value === 'number') {
      return value;
    }

    const names = this.normalize(value);
    let raw = 0;

    for (const name of names) {
      raw |= 1 << this.getOffset(name);
    }

    return raw;
  }

  private normalize(value: IValue): Iterable<string> {
    if (value instanceof Set || Array.isArray(value)) {
      return value;
    }
    throw new Error(`Invalid bitset value type: ${typeof value}`);
  }

  private getOffset(name: string): number {
    const offset = this.bitsByName.get(name);
    if (offset === undefined) {
      throw new Error(`Unknown bit name="${name}" for bitset=${this.name}`);
    }
    return offset;
  }
}
