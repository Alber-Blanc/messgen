import { describe, expect, it } from 'vitest';
import { Utf8Codec } from './utf8.js';

describe('Utf8Codec', () => {
  it('roundtrip encode/decode', () => {
    const testStr = '✈✈✈ Hello world! ✈✈✈';
    const dst = new Uint8Array(Utf8Codec.byteLength(testStr));
    const written = Utf8Codec.encodeInto(testStr, dst);
    expect(written).toBe(dst.length);
    expect(Utf8Codec.decode(dst)).toBe(testStr);
  });

  it('byte length matches text encoder for ASCII, multibyte, and surrogate pairs', () => {
    const cases = ['hello', 'héllo', '日本語', '𐐷 surrogates 🌍', ''];
    const enc = new TextEncoder();
    for (const s of cases) {
      expect(Utf8Codec.byteLength(s)).toBe(enc.encode(s).length);
    }
  });
});
