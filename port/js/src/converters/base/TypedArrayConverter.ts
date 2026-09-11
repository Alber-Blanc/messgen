import type { Cursor } from '../../Cursor';
import type { IType, TypedArrayTypeDefinition } from '../../types';
import { Converter } from '../Converter';
import type { GetType } from '../ConverterFactory';

const TYPED_ARRAY_MAP = new Map<IType, TypedArrayConstructor>([
  ['int8', Int8Array],
  ['uint8', Uint8Array],
  ['int16', Int16Array],
  ['uint16', Uint16Array],
  ['int32', Int32Array],
  ['uint32', Uint32Array],
  ['int64', BigInt64Array],
  ['uint64', BigUint64Array],
  ['float32', Float32Array],
  ['float64', Float64Array],
]);

export class TypedArrayConverter extends Converter<TypedArray> {
  private converter: Converter;
  private arraySize?: number;
  private TypedArrayConstructor: {
    BYTES_PER_ELEMENT: number;
    new (length: number): TypedArray;
    new (buffer: ArrayBufferLike): TypedArray;
  };

  constructor(typeDef: TypedArrayTypeDefinition, getType: GetType) {
    super(typeDef.type);
    this.converter = getType(typeDef.elementType);
    this.arraySize = typeDef.arraySize;
    const arrayConstructor = TYPED_ARRAY_MAP.get(typeDef.elementType);
    if (!arrayConstructor) {
      throw new Error(`Unknown typed array type: ${typeDef.elementType}`);
    }
    this.TypedArrayConstructor = arrayConstructor;
  }

  serialize(value: TypedArray, cursor: Cursor): void {
    this.checkLength(value.length);
    if (this.arraySize === undefined) {
      cursor.writeUint32(value.length);
    }
    for (const item of value) {
      this.converter.serialize(item, cursor);
    }
  }

  deserialize(cursor: Cursor): TypedArray {
    const length = this.arraySize ?? cursor.readUint32();
    const bytes = cursor.readBuffer(length * this.TypedArrayConstructor.BYTES_PER_ELEMENT);
    return new this.TypedArrayConstructor(bytes);
  }

  size(value: TypedArray): number {
    this.checkLength(value.length);
    return (this.arraySize === undefined ? 4 : 0) + value.length * this.TypedArrayConstructor.BYTES_PER_ELEMENT;
  }

  createDefault(): TypedArray {
    return new this.TypedArrayConstructor(this.arraySize ?? 0);
  }

  private checkLength(length: number): void {
    if (this.arraySize !== undefined && length !== this.arraySize) {
      throw new Error(`Array length mismatch: ${length} !== ${this.arraySize}`);
    }
  }
}

export type TypedArrayConstructor =
  | Int8ArrayConstructor
  | Uint8ArrayConstructor
  | Int16ArrayConstructor
  | Uint16ArrayConstructor
  | Int32ArrayConstructor
  | Uint32ArrayConstructor
  | Float32ArrayConstructor
  | Float64ArrayConstructor
  | BigUint64ArrayConstructor
  | BigInt64ArrayConstructor;

export type TypedArray =
  | Int8Array
  | Uint8Array
  | Int16Array
  | Uint16Array
  | Int32Array
  | Uint32Array
  | Float32Array
  | Float64Array
  | BigUint64Array
  | BigInt64Array;
