import { describe, expect, it } from 'vitest';
import { encodeUTF8, decodeUTF8 } from './utf8.js';

describe('UTF8 function test', () => {
  it('Encoding decoding test', () => {
    const testStr = '✈✈✈ Hello world! ✈✈✈';
    const byteArr = encodeUTF8(testStr);
    const dstStr = decodeUTF8(byteArr);
    expect(testStr).toBe(dstStr);
  });
});
