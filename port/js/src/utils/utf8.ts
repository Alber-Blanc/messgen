export class Utf8Codec {
  private static readonly encoder = new TextEncoder();

  private static readonly decoder = new TextDecoder('utf-8');

  static byteLength(str: string): number {
    let len = 0;
    for (let ci = 0; ci < str.length; ci++) {
      const c = str.charCodeAt(ci);
      if (c < 0x80) {
        len += 1;
      } else if (c < 0x800) {
        len += 2;
      } else if (c >= 0xd800 && c <= 0xdbff && str.charCodeAt(ci + 1) >= 0xdc00 && str.charCodeAt(ci + 1) <= 0xdfff) {
        len += 4;
        ci++;
      } else {
        len += 3;
      }
    }
    return len;
  }

  static encodeInto(str: string, dst: Uint8Array): number {
    const { read, written } = Utf8Codec.encoder.encodeInto(str, dst);
    if (read !== str.length) {
      throw new RangeError('Buffer is too small to encode the string');
    }
    return written;
  }

  static decode(bytes: Uint8Array): string {
    return Utf8Codec.decoder.decode(bytes);
  }
}
