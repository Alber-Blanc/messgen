import type { Cursor } from '../../Cursor';
import type { BasicType } from '../../types';
import { Converter } from '../Converter';
import { Utf8Codec } from '../../utils/utf8';

type ScalarValue = number | bigint | boolean | string | Uint8Array;

interface ScalarTypeConfig {
  size: number | ((value: ScalarValue) => number);
  read: (cursor: Cursor) => ScalarValue;
  write: (cursor: Cursor, value: ScalarValue) => void;
  createDefault: () => ScalarValue;
}

export const SCALAR_TYPES = new Map<BasicType, ScalarTypeConfig>([
  [
    'int8',
    {
      size: 1,
      read: (cursor) => cursor.readInt8(),
      write: (cursor, value) => cursor.writeInt8(value as number),
      createDefault: () => 0,
    },
  ],
  [
    'uint8',
    {
      size: 1,
      read: (cursor) => cursor.readUint8(),
      write: (cursor, value) => cursor.writeUint8(value as number),
      createDefault: () => 0,
    },
  ],
  [
    'int16',
    {
      size: 2,
      read: (cursor) => cursor.readInt16(),
      write: (cursor, value) => cursor.writeInt16(value as number),
      createDefault: () => 0,
    },
  ],
  [
    'uint16',
    {
      size: 2,
      read: (cursor) => cursor.readUint16(),
      write: (cursor, value) => cursor.writeUint16(value as number),
      createDefault: () => 0,
    },
  ],
  [
    'int32',
    {
      size: 4,
      read: (cursor) => cursor.readInt32(),
      write: (cursor, value) => cursor.writeInt32(value as number),
      createDefault: () => 0,
    },
  ],
  [
    'uint32',
    {
      size: 4,
      read: (cursor) => cursor.readUint32(),
      write: (cursor, value) => cursor.writeUint32(value as number),
      createDefault: () => 0,
    },
  ],
  [
    'int64',
    {
      size: 8,
      read: (cursor) => cursor.readBigInt64(),
      write: (cursor, value) => cursor.writeBigInt64(BigInt(value as number | bigint | string | boolean)),
      createDefault: () => 0n,
    },
  ],
  [
    'uint64',
    {
      size: 8,
      read: (cursor) => cursor.readBigUint64(),
      write: (cursor, value) => cursor.writeBigUint64(BigInt(value as number | bigint | string | boolean)),
      createDefault: () => 0n,
    },
  ],
  [
    'float32',
    {
      size: 4,
      read: (cursor) => cursor.readFloat32(),
      write: (cursor, value) => cursor.writeFloat32(value as number),
      createDefault: () => 0,
    },
  ],
  [
    'float64',
    {
      size: 8,
      read: (cursor) => cursor.readFloat64(),
      write: (cursor, value) => cursor.writeFloat64(value as number),
      createDefault: () => 0,
    },
  ],
  [
    'bool',
    {
      size: 1,
      read: (cursor) => Boolean(cursor.readUint8()),
      write: (cursor, value) => cursor.writeUint8(value ? 1 : 0),
      createDefault: () => false,
    },
  ],
  [
    'char',
    {
      size: 1,
      read: (cursor) => String.fromCharCode(cursor.readUint8()),
      write: (cursor, value) => cursor.writeUint8((value as string).charCodeAt(0)),
      createDefault: () => ' ',
    },
  ],
  [
    'string',
    {
      size: (value) => Utf8Codec.byteLength(value as string) + 4,
      read: (cursor) => cursor.readString(),
      write: (cursor, value) => cursor.writeString(value as string),
      createDefault: () => '',
    },
  ],
  [
    'bytes',
    {
      size: (value) => 4 + (value as Uint8Array).byteLength,
      read: (cursor) => cursor.readBytes(),
      write: (cursor, value) => cursor.writeBytes(value as Uint8Array),
      createDefault: () => new Uint8Array(0),
    },
  ],
]);

export class ScalarConverter extends Converter<ScalarValue> {
  private config: ScalarTypeConfig;

  constructor(name: BasicType) {
    super(name);
    const config = SCALAR_TYPES.get(name);
    if (!config) {
      throw new Error(`Unsupported scalar type "${name}"`);
    }
    this.config = config;
  }

  serialize(value: ScalarValue, cursor: Cursor): void {
    this.config.write(cursor, value);
  }

  deserialize(cursor: Cursor): ScalarValue {
    return this.config.read(cursor);
  }

  size(value: ScalarValue): number {
    return typeof this.config.size === 'number' ? this.config.size : this.config.size(value);
  }

  createDefault(): ScalarValue {
    return this.config.createDefault();
  }
}
