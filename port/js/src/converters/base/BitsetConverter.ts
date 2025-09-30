import { Converter } from '../Converter';
import type { IValue, BitsetTypeDefinition } from '../../types';
import type { Buffer } from '../../Buffer';
import type { GetType } from './../ConverterFactory';

export class BitsetConverter extends Converter {
  private converter: Converter;
  private readonly bitsByName: Record<string, number>;
  private readonly namesByOffset: string[];

  constructor(typeDef: BitsetTypeDefinition, getType: GetType) {
    super(typeDef.typeName);

    this.converter = getType(typeDef.type);

    this.bitsByName = {};
    this.namesByOffset = [];
    for (const bit of typeDef.bits) {
      this.bitsByName[bit.name] = bit.offset;
      this.namesByOffset[bit.offset] = bit.name;
    }
  }

  serialize(value: IValue, buffer: Buffer) {
    let raw = 0;

    if (typeof value === 'number') {
      raw = value;
    } else if (value instanceof Set) {
      for (const name of value) {
        const offs = this.bitsByName[name];
        if (offs === undefined) {
          throw new Error(`Unsupported bit name=${name} for bitset=${this.name}`);
        }
        raw |= 1 << offs;
      }
    } else if (Array.isArray(value)) {
      for (const name of value) {
        const offs = this.bitsByName[name];
        if (offs === undefined) {
          throw new Error(`Unsupported bit name=${name} for bitset=${this.name}`);
        }
        raw |= 1 << offs;
      }
    } else {
      throw new Error(`Unsupported bitset value type: ${typeof value}`);
    }

    this.converter.serialize(raw, buffer);
  }

  deserialize(buffer: Buffer) {
    const raw = this.converter.deserialize(buffer) as number;
    const result = new Set<string>();

    for (let offs = 0; offs < this.namesByOffset.length; offs++) {
      if (raw & (1 << offs)) {
        const name = this.namesByOffset[offs];
        if (name) {
          result.add(name);
        }
      }
    }

    return result;
  }

  size(value: IValue) {
    return this.converter.size(
      typeof value === 'number' ? value : 0,
    );
  }

  default() {
    return new Set<string>();
  }
}
