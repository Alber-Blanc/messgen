import { IS_LITTLE_ENDIAN } from './config';
import { Utf8Codec } from './utils/utf8';

export type BinaryInput = ArrayBufferLike | ArrayBufferView;

/** Owns the byte view and position for a single read or write operation. */
export class Cursor {
  readonly dataView: DataView;
  private _offset = 0;

  constructor(input: BinaryInput) {
    this.dataView = ArrayBuffer.isView(input)
      ? new DataView(input.buffer, input.byteOffset, input.byteLength)
      : new DataView(input);
  }

  get buffer(): ArrayBufferLike {
    return this.dataView.buffer;
  }

  get size(): number {
    return this.dataView.byteLength;
  }

  get offset(): number {
    return this._offset;
  }

  set offset(value: number) {
    if (!Number.isInteger(value) || value < 0 || value > this.size) {
      throw new RangeError('Buffer offset is out of bounds');
    }
    this._offset = value;
  }

  readInt8(): number {
    const value = this.dataView.getInt8(this._offset);
    this._offset += 1;
    return value;
  }

  writeInt8(value: number): void {
    this.dataView.setInt8(this._offset, value);
    this._offset += 1;
  }

  readUint8(): number {
    const value = this.dataView.getUint8(this._offset);
    this._offset += 1;
    return value;
  }

  writeUint8(value: number): void {
    this.dataView.setUint8(this._offset, value);
    this._offset += 1;
  }

  readInt16(): number {
    const value = this.dataView.getInt16(this._offset, IS_LITTLE_ENDIAN);
    this._offset += 2;
    return value;
  }

  writeInt16(value: number): void {
    this.dataView.setInt16(this._offset, value, IS_LITTLE_ENDIAN);
    this._offset += 2;
  }

  readUint16(): number {
    const value = this.dataView.getUint16(this._offset, IS_LITTLE_ENDIAN);
    this._offset += 2;
    return value;
  }

  writeUint16(value: number): void {
    this.dataView.setUint16(this._offset, value, IS_LITTLE_ENDIAN);
    this._offset += 2;
  }

  readInt32(): number {
    const value = this.dataView.getInt32(this._offset, IS_LITTLE_ENDIAN);
    this._offset += 4;
    return value;
  }

  writeInt32(value: number): void {
    this.dataView.setInt32(this._offset, value, IS_LITTLE_ENDIAN);
    this._offset += 4;
  }

  readUint32(): number {
    const value = this.dataView.getUint32(this._offset, IS_LITTLE_ENDIAN);
    this._offset += 4;
    return value;
  }

  writeUint32(value: number): void {
    this.dataView.setUint32(this._offset, value, IS_LITTLE_ENDIAN);
    this._offset += 4;
  }

  readBigInt64(): bigint {
    const value = this.dataView.getBigInt64(this._offset, IS_LITTLE_ENDIAN);
    this._offset += 8;
    return value;
  }

  writeBigInt64(value: bigint): void {
    this.dataView.setBigInt64(this._offset, value, IS_LITTLE_ENDIAN);
    this._offset += 8;
  }

  readBigUint64(): bigint {
    const value = this.dataView.getBigUint64(this._offset, IS_LITTLE_ENDIAN);
    this._offset += 8;
    return value;
  }

  writeBigUint64(value: bigint): void {
    this.dataView.setBigUint64(this._offset, value, IS_LITTLE_ENDIAN);
    this._offset += 8;
  }

  readFloat32(): number {
    const value = this.dataView.getFloat32(this._offset, IS_LITTLE_ENDIAN);
    this._offset += 4;
    return value;
  }

  writeFloat32(value: number): void {
    this.dataView.setFloat32(this._offset, value, IS_LITTLE_ENDIAN);
    this._offset += 4;
  }

  readFloat64(): number {
    const value = this.dataView.getFloat64(this._offset, IS_LITTLE_ENDIAN);
    this._offset += 8;
    return value;
  }

  writeFloat64(value: number): void {
    this.dataView.setFloat64(this._offset, value, IS_LITTLE_ENDIAN);
    this._offset += 8;
  }

  readString(): string {
    const length = this.dataView.getUint32(this._offset, IS_LITTLE_ENDIAN);
    this.ensureAvailable(4 + length);
    const start = this._offset + 4;
    const bytes = new Uint8Array(this.buffer, this.dataView.byteOffset + start, length);
    const value = Utf8Codec.decode(bytes);
    this._offset = start + length;
    return value;
  }

  writeString(value: string): void {
    this.ensureAvailable(4);
    const start = this._offset + 4;
    const bytes = new Uint8Array(this.buffer, this.dataView.byteOffset + start, this.size - start);
    const written = Utf8Codec.encodeInto(value, bytes);
    this.dataView.setUint32(this._offset, written, IS_LITTLE_ENDIAN);
    this._offset = start + written;
  }

  readBytes(): Uint8Array {
    const length = this.dataView.getUint32(this._offset, IS_LITTLE_ENDIAN);
    this.ensureAvailable(4 + length);
    const start = this._offset + 4;
    const value = new Uint8Array(this.buffer, this.dataView.byteOffset + start, length).slice();
    this._offset = start + length;
    return value;
  }

  writeBytes(value: Uint8Array): void {
    this.ensureAvailable(4 + value.byteLength);
    this.dataView.setUint32(this._offset, value.byteLength, IS_LITTLE_ENDIAN);
    const start = this._offset + 4;
    new Uint8Array(this.buffer, this.dataView.byteOffset + start, value.byteLength).set(value);
    this._offset = start + value.byteLength;
  }

  /** Returns an independent copy, including when the cursor wraps a subview. */
  readBuffer(byteLength: number): ArrayBufferLike {
    this.ensureAvailable(byteLength);
    const start = this.dataView.byteOffset + this._offset;
    const value = this.buffer.slice(start, start + byteLength);
    this._offset += byteLength;
    return value;
  }

  private ensureAvailable(byteLength: number): void {
    if (!Number.isInteger(byteLength) || byteLength < 0 || byteLength > this.size - this._offset) {
      throw new RangeError('Buffer offset is out of bounds');
    }
  }
}
