import { describe, expect, it } from 'vitest';
import { Utf8Codec } from './utf8.js';

describe('Utf8Codec', () => {
  it('should byte length matches text encoder for ASCII, multibyte, and surrogate pairs', () => {
    const cases = ['hello', 'héllo', '日本語', '𐐷 surrogates 🌍', ''];
    const enc = new TextEncoder();
    for (const s of cases) {
      expect(Utf8Codec.byteLength(s)).toBe(enc.encode(s).length);
    }
  });
  describe('#byteLength', () => {
    it('should return 0 for empty string', () => {
      expect(Utf8Codec.byteLength('')).toBe(0);
    });

    it('should calculate byte length for ASCII characters', () => {
      expect(Utf8Codec.byteLength('hello')).toBe(5);
    });

    it('should calculate byte length for multibyte characters', () => {
      expect(Utf8Codec.byteLength('héllo')).toBe(6); // 'é' is 2 bytes
    });
    it('should calculate byte length for surrogate pairs', () => {
      expect(Utf8Codec.byteLength('𐐷')).toBe(4); // '𐐷' is 4 bytes
    });
  });
});
