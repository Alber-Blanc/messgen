import { Buffer as NodeBuffer } from 'node:buffer';
import { describe, expect, it } from 'vitest';
import { Cursor } from './Cursor';
import { Buffer } from './Buffer';
import { captureError } from '../tests/utils';

describe('Cursor', () => {
  it('should keep Buffer as an alias of the same constructor', () => {
    const expected = Cursor;

    const constructor = Buffer;

    expect(constructor).toBe(expected);
  });

  it('should construct a Cursor through the Buffer alias', () => {
    const input = new ArrayBuffer(0);

    const cursor = new Buffer(input);

    expect(cursor).toBeInstanceOf(Cursor);
  });

  it('should write little-endian values inside a byte subview', () => {
    const { storage, cursor } = createSubview();

    writeMixedValues(cursor);

    expect(Array.from(storage.subarray(5, 7))).toEqual([0x34, 0x12]);
  });

  it.each(['before', 'after'] as const)('should preserve bytes %s the destination view', (side) => {
    const { storage, cursor } = createSubview();
    const outside = side === 'before' ? storage.subarray(0, 5) : storage.subarray(55);

    writeMixedValues(cursor);

    expect(outside).toEqual(new Uint8Array(outside.length).fill(0xaa));
  });

  it('should use the view size rather than the backing buffer size', () => {
    const storage = new Uint8Array(64);

    const cursor = new Cursor(storage.subarray(5, 55));

    expect(cursor.size).toBe(50);
  });

  it('should read mixed values through a DataView with a nonzero byte offset', () => {
    const { storage, cursor } = createSubview();
    writeMixedValues(cursor);
    const reader = new Cursor(new DataView(storage.buffer, 5, cursor.offset));

    const values = [reader.readUint16(), reader.readString(), reader.readBytes(), reader.readBigInt64()];

    expect(values).toEqual([0x1234, 'Привет🌍', new Uint8Array([1, 2, 3]), -123456789n]);
  });

  it('should advance past all mixed values read from a subview', () => {
    const { storage, cursor } = createSubview();
    writeMixedValues(cursor);
    const reader = new Cursor(new DataView(storage.buffer, 5, cursor.offset));

    reader.readUint16();
    reader.readString();
    reader.readBytes();
    reader.readBigInt64();

    expect(reader.offset).toBe(reader.size);
  });

  it('should read a sliced Node Buffer', () => {
    const storage = NodeBuffer.alloc(32, 0xaa);
    const view = storage.subarray(7, 16);
    new Cursor(view).writeString('hello');

    const value = new Cursor(view).readString();

    expect(value).toBe('hello');
  });

  it.each([6, 16])('should preserve byte %i outside a sliced Node Buffer', (index) => {
    const storage = NodeBuffer.alloc(32, 0xaa);
    const cursor = new Cursor(storage.subarray(7, 16));

    cursor.writeString('hello');

    expect(storage[index]).toBe(0xaa);
  });

  describe.each(['readString', 'readBytes'] as const)('%s with a truncated view', (method) => {
    it('should reject a payload extending past the view', () => {
      const cursor = createTruncatedView();

      const error = captureError(() => cursor[method]());

      expect(error).toBeInstanceOf(RangeError);
    });

    it('should preserve the offset after a failed read', () => {
      const cursor = createTruncatedView();

      captureError(() => cursor[method]());

      expect(cursor.offset).toBe(0);
    });
  });

  describe.each([
    ['numeric read', (cursor: Cursor) => cursor.readUint32()],
    ['numeric write', (cursor: Cursor) => cursor.writeUint32(42)],
    ['raw buffer read', (cursor: Cursor) => cursor.readBuffer(4)],
  ] as const)('truncated %s', (_name, operation) => {
    it('should throw a RangeError', () => {
      const cursor = new Cursor(new Uint8Array(8).subarray(1, 4));

      const error = captureError(() => operation(cursor));

      expect(error).toBeInstanceOf(RangeError);
    });

    it('should preserve the cursor offset', () => {
      const cursor = new Cursor(new Uint8Array(8).subarray(1, 4));

      captureError(() => operation(cursor));

      expect(cursor.offset).toBe(0);
    });
  });

  it('should reject a partial string write', () => {
    const cursor = new Cursor(new ArrayBuffer(6));

    const error = captureError(() => cursor.writeString('abc'));

    expect(error).toBeInstanceOf(RangeError);
  });

  it('should preserve the offset after a partial string write', () => {
    const cursor = new Cursor(new ArrayBuffer(6));

    captureError(() => cursor.writeString('abc'));

    expect(cursor.offset).toBe(0);
  });

  it('should reject bytes that do not fit in the destination view', () => {
    const storage = new Uint8Array(32).fill(0xaa);
    const cursor = new Cursor(storage.subarray(3, 8));

    const error = captureError(() => cursor.writeBytes(new Uint8Array([1, 2])));

    expect(error).toBeInstanceOf(RangeError);
  });

  it('should preserve the offset after a failed byte write', () => {
    const storage = new Uint8Array(32).fill(0xaa);
    const cursor = new Cursor(storage.subarray(3, 8));

    captureError(() => cursor.writeBytes(new Uint8Array([1, 2])));

    expect(cursor.offset).toBe(0);
  });

  it('should preserve the destination after a failed byte write', () => {
    const storage = new Uint8Array(32).fill(0xaa);
    const cursor = new Cursor(storage.subarray(3, 8));

    captureError(() => cursor.writeBytes(new Uint8Array([1, 2])));

    expect(storage).toEqual(new Uint8Array(32).fill(0xaa));
  });

  it('should return an independent byte copy', () => {
    const storage = new Uint8Array([2, 0, 0, 0, 10, 20]);
    const cursor = new Cursor(storage);

    const value = cursor.readBytes();
    storage.fill(0);

    expect(value).toEqual(new Uint8Array([10, 20]));
  });

  describe('bytes without copying', () => {
    it('should read exactly the byte field inside a subview', () => {
      const { cursor } = createByteSubview();

      const value = cursor.readBytes();

      expect(value).toEqual(new Uint8Array([10, 20, 30]));
    });

    it('should preserve the absolute byte offset of the field', () => {
      const { cursor } = createByteSubview();

      const value = cursor.readBytes();

      expect(value.byteOffset).toBe(11);
    });

    it('should share changes to the source bytes', () => {
      const { cursor, storage } = createByteSubview();

      const value = cursor.readBytes();
      storage[11] = 99;

      expect(value).toEqual(new Uint8Array([99, 20, 30]));
    });

    it('should write through to the source bytes', () => {
      const { cursor, storage } = createByteSubview();

      const value = cursor.readBytes();
      value[0] = 99;

      expect(storage[11]).toBe(99);
    });

    it('should preserve the field following the bytes', () => {
      const { cursor } = createByteSubview();

      cursor.readBytes();
      const next = cursor.readUint32();

      expect(next).toBe(0x12345678);
    });

    it('should advance by the prefix and payload length', () => {
      const { cursor } = createByteSubview();

      cursor.readBytes();

      expect(cursor.offset).toBe(9);
    });

    it.each([3, 8])('should reject a truncated field in a %i-byte view', (length) => {
      const storage = new Uint8Array(32);
      new DataView(storage.buffer).setUint32(5, 8, true);
      const cursor = new Cursor(storage.subarray(5, 5 + length), { copyBytes: false });

      const read = () => cursor.readBytes();

      expect(read).toThrow(RangeError);
    });

    it('should preserve the offset after a truncated read', () => {
      const storage = new Uint8Array(32);
      new DataView(storage.buffer).setUint32(5, 8, true);
      const cursor = new Cursor(storage.subarray(5, 12), { copyBytes: false });

      captureError(() => cursor.readBytes());

      expect(cursor.offset).toBe(0);
    });

    it('should support an empty byte field', () => {
      const cursor = new Cursor(new Uint8Array([0, 0, 0, 0, 42]), { copyBytes: false });

      const value = cursor.readBytes();

      expect(value).toEqual(new Uint8Array(0));
    });

    it('should advance past an empty byte field', () => {
      const cursor = new Cursor(new Uint8Array([0, 0, 0, 0, 42]), { copyBytes: false });

      cursor.readBytes();
      const next = cursor.readUint8();

      expect(next).toBe(42);
    });

    it('should support shared input buffers', () => {
      const storage = new Uint8Array(new SharedArrayBuffer(8));
      storage.set([2, 0, 0, 0, 10, 20], 1);
      const cursor = new Cursor(storage.subarray(1, 7), { copyBytes: false });

      const value = cursor.readBytes();

      expect(value.buffer).toBe(storage.buffer);
    });

    it('should keep raw buffer reads independent', () => {
      const storage = new Uint8Array([10, 20]);
      const cursor = new Cursor(storage, { copyBytes: false });

      const value = cursor.readBuffer(2);
      storage.fill(0);

      expect(new Uint8Array(value)).toEqual(new Uint8Array([10, 20]));
    });
  });

  it('should return an independent raw buffer copy', () => {
    const storage = new Uint8Array([10, 20, 30, 40]);
    const cursor = new Cursor(storage.subarray(2));

    const value = cursor.readBuffer(2);
    storage.fill(0);

    expect(new Uint8Array(value)).toEqual(new Uint8Array([30, 40]));
  });

  it('should advance past byte and raw buffer reads', () => {
    const cursor = new Cursor(new Uint8Array([2, 0, 0, 0, 10, 20, 30, 40]));

    cursor.readBytes();
    cursor.readBuffer(2);

    expect(cursor.offset).toBe(cursor.size);
  });

  describe.each([-1, 0.5, NaN, Infinity, 5])('invalid offset %s', (offset) => {
    it('should throw a RangeError', () => {
      const cursor = new Cursor(new ArrayBuffer(4));

      const error = captureError(() => {
        cursor.offset = offset;
      });

      expect(error).toBeInstanceOf(RangeError);
    });

    it('should preserve the previous offset', () => {
      const cursor = new Cursor(new ArrayBuffer(4));

      captureError(() => {
        cursor.offset = offset;
      });

      expect(cursor.offset).toBe(0);
    });
  });

  describe.each(['', '\ud800', '\udc00', '\ud800x', '\ud800\ud800\udc00', '你好🌍'])('UTF-8 %j', (value) => {
    it('should write the complete string and following field', () => {
      const bytes = new TextEncoder().encode(value);
      const cursor = new Cursor(new ArrayBuffer(4 + bytes.length + 4));

      cursor.writeString(value);
      cursor.writeUint32(0x12345678);

      expect(cursor.offset).toBe(cursor.size);
    });

    it('should read the decoded string', () => {
      const cursor = createStringWithNextField(value);
      const expected = new TextDecoder().decode(new TextEncoder().encode(value));

      const result = cursor.readString();

      expect(result).toBe(expected);
    });

    it('should preserve the following field', () => {
      const cursor = createStringWithNextField(value);

      cursor.readString();
      const result = cursor.readUint32();

      expect(result).toBe(0x12345678);
    });

    it('should advance past both fields', () => {
      const cursor = createStringWithNextField(value);

      cursor.readString();
      cursor.readUint32();

      expect(cursor.offset).toBe(cursor.size);
    });
  });
});

function createSubview() {
  const storage = new Uint8Array(64).fill(0xaa);
  return { storage, cursor: new Cursor(storage.subarray(5, 55)) };
}

function createByteSubview() {
  const storage = new Uint8Array(32).fill(0xaa);
  storage.set([0, 0, 3, 0, 0, 0, 10, 20, 30, 0x78, 0x56, 0x34, 0x12], 5);
  const cursor = new Cursor(new DataView(storage.buffer, 5, 13), { copyBytes: false });
  cursor.offset = 2;
  return { storage, cursor };
}

function writeMixedValues(cursor: Cursor): void {
  cursor.writeUint16(0x1234);
  cursor.writeString('Привет🌍');
  cursor.writeBytes(new Uint8Array([1, 2, 3]));
  cursor.writeBigInt64(-123456789n);
}

function createTruncatedView(): Cursor {
  const storage = new Uint8Array(32);
  new DataView(storage.buffer).setUint32(5, 8, true);
  return new Cursor(storage.subarray(5, 12));
}

function createStringWithNextField(value: string): Cursor {
  const bytes = new TextEncoder().encode(value);
  const cursor = new Cursor(new ArrayBuffer(4 + bytes.length + 4));
  cursor.writeString(value);
  cursor.writeUint32(0x12345678);
  cursor.offset = 0;
  return cursor;
}
