import type { MapTypeDefinition } from '../../types';
import { Converter } from '../Converter';
import type { Cursor } from '../../Cursor';
import type { GetType } from '../ConverterFactory';

type MapValue = Map<unknown, unknown>;
type MapInput = MapValue | Record<string, unknown>;

export class MapConverter extends Converter<MapValue, MapInput> {
  protected readonly keyConverter: Converter;
  protected readonly valueConverter: Converter;

  constructor(typeDef: MapTypeDefinition, getType: GetType) {
    super(typeDef.type);
    this.keyConverter = getType(typeDef.keyType);
    this.valueConverter = getType(typeDef.valueType);
  }

  serialize(value: MapInput, cursor: Cursor): void {
    const entries = value instanceof Map ? value : Object.entries(value);
    cursor.writeUint32(entries instanceof Map ? entries.size : entries.length);
    for (const [key, val] of entries) {
      this.keyConverter.serialize(key, cursor);
      this.valueConverter.serialize(val, cursor);
    }
  }

  deserialize(cursor: Cursor): MapValue {
    const size = cursor.readUint32();
    const result: MapValue = new Map();
    for (let i = 0; i < size; i++) {
      const key = this.keyConverter.deserialize(cursor);
      const value = this.valueConverter.deserialize(cursor);
      result.set(key, value);
    }
    return result;
  }

  size(value: MapInput): number {
    let size = 4;
    const entries = value instanceof Map ? value : Object.entries(value);
    for (const [key, val] of entries) {
      size += this.keyConverter.size(key) + this.valueConverter.size(val);
    }
    return size;
  }

  createDefault(): MapValue {
    return new Map();
  }
}
