import type { Buffer } from '../../Buffer';
import { SIZE_TYPE } from '../../config';
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

export class TypedArrayConverter extends Converter {
  private converter: Converter;
  private sizeConverter: Converter;
  private arraySize?: number;
  private TypedArrayConstructor: TypedArrayConstructor;

  constructor(typeDef: TypedArrayTypeDefinition, getType: GetType) {
    super(typeDef.type);
    this.converter = getType(typeDef.elementType);
    this.sizeConverter = getType(SIZE_TYPE);
    this.arraySize = typeDef.arraySize;

    const arrayConstructor = TYPED_ARRAY_MAP.get(typeDef.elementType);

    if (!arrayConstructor) {
      throw new Error(`Unknown typed array type: ${typeDef.elementType}`);
    }
    this.TypedArrayConstructor = arrayConstructor;
  }

  serialize(value: TypedArray, buffer: Buffer): void {
    const { length } = value;

    if (this.arraySize !== undefined && length !== this.arraySize) {
      throw new Error(`Array length mismatch: ${length} !== ${this.arraySize}`);
    }

    if (this.arraySize === undefined) {
      this.sizeConverter.serialize(length, buffer);
    }

    for (let i = 0; i < length; i++) {
      this.converter.serialize(value[i], buffer);
    }
  }

  deserialize(buffer: Buffer): TypedArray {
    const length = this.arraySize ?? this.sizeConverter.deserialize(buffer);
    const TypedArray = this.TypedArrayConstructor;

    const typedArray = new TypedArray(buffer.dataView.buffer.slice(
      buffer.offset,
      buffer.offset + length * TypedArray.BYTES_PER_ELEMENT,
    ));

    buffer.offset += typedArray.byteLength;
    return typedArray;
  }

  size(value: TypedArray): number {
    const { length } = value;
    if (this.arraySize !== undefined && length !== this.arraySize) {
      throw new Error(`Array length mismatch: ${length} !== ${this.arraySize}`);
    }

    const size = this.arraySize === undefined ? this.sizeConverter.size(length) : 0;
    return size + this.converter.size(value) * length;
  }

  default(): TypedArray {
    return new this.TypedArrayConstructor(this.arraySize ?? 0);
  }
}

export type TypedArrayConstructor =
  Int8ArrayConstructor | Uint8ArrayConstructor |
  Int16ArrayConstructor | Uint16ArrayConstructor |
  Int32ArrayConstructor | Uint32ArrayConstructor |
  Float32ArrayConstructor | Float64ArrayConstructor |
  BigUint64ArrayConstructor | BigInt64ArrayConstructor |
  Float64ArrayConstructor;

export type TypedArray =
  Int8Array | Uint8Array | Int16Array | Uint16Array |
  Int32Array | Uint32Array | Float32Array | Float64Array |
  BigUint64Array | BigInt64Array | Float64Array;
