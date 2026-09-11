import { Buffer as NodeBuffer } from 'node:buffer';
import { describe, expect, it } from 'vitest';
import { Cursor } from './Cursor';
import { Buffer } from './Buffer';

describe('Cursor', () => {
  it('keeps Buffer as an alias of the same constructor', () => {
    expect(Buffer).toBe(Cursor);
    expect(new Buffer(new ArrayBuffer(0))).toBeInstanceOf(Cursor);
  });

  it('reads and writes little-endian values inside a byte subview', () => {
    const storage = new Uint8Array(64).fill(0xaa);
    const view = storage.subarray(5, 55);
    const cursor = new Cursor(view);
    cursor.writeUint16(0x1234);
    cursor.writeString('Привет🌍');
    cursor.writeBytes(new Uint8Array([1, 2, 3]));
    cursor.writeBigInt64(-123456789n);
    const end = cursor.offset;

    expect(Array.from(storage.subarray(5, 7))).toEqual([0x34, 0x12]);
    expect(storage.subarray(0, 5)).toEqual(new Uint8Array(5).fill(0xaa));
    expect(storage.subarray(55)).toEqual(new Uint8Array(9).fill(0xaa));
    expect(cursor.size).toBe(50);

    const reader = new Cursor(new DataView(storage.buffer, 5, end));
    expect(reader.readUint16()).toBe(0x1234);
    expect(reader.readString()).toBe('Привет🌍');
    expect(reader.readBytes()).toEqual(new Uint8Array([1, 2, 3]));
    expect(reader.readBigInt64()).toBe(-123456789n);
    expect(reader.offset).toBe(reader.size);
  });

  it('supports a sliced Node Buffer without reading its surrounding bytes', () => {
    const storage = NodeBuffer.alloc(32, 0xaa);
    const view = storage.subarray(7, 16);
    const writer = new Cursor(view);
    writer.writeString('hello');

    expect(new Cursor(view).readString()).toBe('hello');
    expect(storage[6]).toBe(0xaa);
    expect(storage[16]).toBe(0xaa);
  });

  it.each(['readString', 'readBytes'] as const)('bounds %s by the view, not its backing buffer', (method) => {
    const storage = new Uint8Array(32);
    new DataView(storage.buffer).setUint32(5, 8, true);
    const cursor = new Cursor(storage.subarray(5, 12));

    expect(() => cursor[method]()).toThrow(RangeError);
    expect(cursor.offset).toBe(0);
  });

  it('does not advance after a truncated numeric read or write', () => {
    const cursor = new Cursor(new ArrayBuffer(3));
    expect(() => cursor.readUint32()).toThrow(RangeError);
    expect(() => cursor.writeUint32(42)).toThrow(RangeError);
    expect(cursor.offset).toBe(0);
  });

  it('rejects partial string writes', () => {
    const cursor = new Cursor(new ArrayBuffer(6));
    expect(() => cursor.writeString('abc')).toThrow(RangeError);
    expect(cursor.offset).toBe(0);
  });

  it('rejects bytes that do not fit in the destination view', () => {
    const storage = new Uint8Array(32).fill(0xaa);
    const cursor = new Cursor(storage.subarray(3, 8));
    expect(() => cursor.writeBytes(new Uint8Array([1, 2]))).toThrow(RangeError);
    expect(cursor.offset).toBe(0);
    expect(storage).toEqual(new Uint8Array(32).fill(0xaa));
  });

  it('returns independent byte and buffer copies', () => {
    const storage = new Uint8Array([2, 0, 0, 0, 10, 20, 30, 40]);
    const cursor = new Cursor(storage);
    const bytes = cursor.readBytes();
    const buffer = new Uint8Array(cursor.readBuffer(2));
    storage.fill(0);

    expect(bytes).toEqual(new Uint8Array([10, 20]));
    expect(buffer).toEqual(new Uint8Array([30, 40]));
    expect(cursor.offset).toBe(cursor.size);
  });

  it('rejects truncated raw buffers instead of returning a shorter slice', () => {
    const cursor = new Cursor(new Uint8Array(8).subarray(1, 4));
    expect(() => cursor.readBuffer(4)).toThrow(RangeError);
    expect(cursor.offset).toBe(0);
  });

  it.each([-1, 0.5, NaN, Infinity, 5])('rejects invalid offsets: %s', (offset) => {
    const cursor = new Cursor(new ArrayBuffer(4));
    expect(() => {
      cursor.offset = offset;
    }).toThrow(RangeError);
    expect(cursor.offset).toBe(0);
  });

  it.each(['', '\ud800', '\udc00', '\ud800x', '\ud800\ud800\udc00', '你好🌍'])(
    'writes complete UTF-8 and preserves the following field: %j',
    (value) => {
      const bytes = new TextEncoder().encode(value);
      const cursor = new Cursor(new ArrayBuffer(4 + bytes.length + 4));
      cursor.writeString(value);
      cursor.writeUint32(0x12345678);
      expect(cursor.offset).toBe(cursor.size);

      cursor.offset = 0;
      expect(cursor.readString()).toBe(new TextDecoder().decode(bytes));
      expect(cursor.readUint32()).toBe(0x12345678);
      expect(cursor.offset).toBe(cursor.size);
    },
  );
});
