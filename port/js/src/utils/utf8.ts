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
      } else if (c >= 0xd800 && c <= 0xdbff) {
        len += 4;
        ci++;
      } else {
        len += 3;
      }
    }
    return len;
  }

  static encodeInto(str: string, dst: Uint8Array): number {
    return Utf8Codec.encoder.encodeInto(str, dst).written;
  }

  static decode(bytes: Uint8Array): string {
    return Utf8Codec.decoder.decode(bytes);
  }
}
