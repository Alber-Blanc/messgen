import type { Cursor } from '../../Cursor';
import type { ArrayTypeDefinition } from '../../types';
import { Converter } from '../Converter';
import type { GetType } from '../ConverterFactory';

export class ArrayConverter extends Converter<unknown[], readonly unknown[]> {
  private readonly converter: Converter;
  private readonly arraySize?: number;

  constructor(typeDef: ArrayTypeDefinition, getType: GetType) {
    super(typeDef.type);
    this.converter = getType(typeDef.elementType);
    this.arraySize = typeDef.arraySize;
  }

  serialize(value: readonly unknown[], cursor: Cursor): void {
    this.checkLength(value.length);
    if (this.arraySize === undefined) {
      cursor.writeUint32(value.length);
    }
    for (const item of value) {
      this.converter.serialize(item, cursor);
    }
  }

  deserialize(cursor: Cursor): unknown[] {
    const length = this.arraySize ?? cursor.readUint32();
    const result = [];
    for (let i = 0; i < length; i++) {
      result.push(this.converter.deserialize(cursor));
    }
    return result;
  }

  size(value: readonly unknown[]): number {
    this.checkLength(value.length);
    let size = this.arraySize === undefined ? 4 : 0;
    for (const item of value) {
      size += this.converter.size(item);
    }
    return size;
  }

  createDefault(): unknown[] {
    return Array.from({ length: this.arraySize ?? 0 }, () => this.converter.createDefault());
  }

  private checkLength(length: number): void {
    if (this.arraySize !== undefined && length !== this.arraySize) {
      throw new Error(`Array length mismatch: ${length} !== ${this.arraySize}`);
    }
  }
}
