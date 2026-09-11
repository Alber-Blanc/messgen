import { describe, expect, it } from 'vitest';
import { Utf8Codec } from './utf8';

describe('Utf8Codec', () => {
  it.each([
    '',
    'hello',
    'héllo',
    'Привет',
    '你好',
    '日本語',
    '🌍',
    '𐐷',
    '𐐷 surrogates 🌍',
    '\ud800',
    '\udc00',
    '\ud800x',
    '\ud800\ud800\udc00',
  ])('should match TextEncoder byte length for %j', (value) => {
    const expected = new TextEncoder().encode(value).length;

    const length = Utf8Codec.byteLength(value);

    expect(length).toBe(expected);
  });

  it.each([
    { name: 'empty string', value: '', expected: 0 },
    { name: 'ASCII', value: 'hello', expected: 5 },
    { name: 'multibyte characters', value: 'héllo', expected: 6 },
    { name: 'surrogate pair', value: '𐐷', expected: 4 },
  ])('should calculate the byte length of $name', ({ value, expected }) => {
    const input = value;

    const length = Utf8Codec.byteLength(input);

    expect(length).toBe(expected);
  });
});
