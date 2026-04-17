import { bench, describe } from 'vitest';
import { encodeUTF8 } from '../src/utils/utf8';

// --- byteLength implementations ---------------------------------------------

// A) TextEncoder.encode().length — the slow baseline (allocates)
function byteLengthTextEncoder(str: string): number {
  return new TextEncoder().encode(str).length;
}

// A2) Cached TextEncoder
const SHARED_ENCODER = new TextEncoder();
function byteLengthCachedTextEncoder(str: string): number {
  return SHARED_ENCODER.encode(str).length;
}

// B) charCodeAt loop (current fix)
function byteLengthCharCode(str: string): number {
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

// C) ASCII fast-path + charCodeAt fallback
function byteLengthAsciiFast(str: string): number {
  const n = str.length;
  let len = 0;
  let ci = 0;
  // ASCII hot loop
  for (; ci < n; ci++) {
    const c = str.charCodeAt(ci);
    if (c >= 0x80) break;
    len++;
  }
  if (ci === n) return len;
  // Slow path for remainder
  for (; ci < n; ci++) {
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

// D) Node Buffer.byteLength (native)
const hasBuffer = typeof Buffer !== 'undefined';
function byteLengthBuffer(str: string): number {
  return Buffer.byteLength(str, 'utf8');
}

// E) Blob size — native, but allocates a Blob
function byteLengthBlob(str: string): number {
  return new Blob([str]).size;
}

// --- Test strings -----------------------------------------------------------

const shortAscii = 'hello world';
const mediumAscii = 'The quick brown fox jumps over the lazy dog. '.repeat(5); // ~230 chars
const longAscii = 'a'.repeat(10_000);
const shortMixed = 'héllo wörld 🌍';
const mediumMixed = 'Привет мир! Здравствуй, солнце. Καλημέρα κόσμε. '.repeat(5);
const longMixed = ('Привет мир 🌍 hello world ').repeat(500); // mixed, ~12.5k chars

const cases: Array<[string, string]> = [
  ['short-ascii', shortAscii],
  ['medium-ascii', mediumAscii],
  ['long-ascii', longAscii],
  ['short-mixed', shortMixed],
  ['medium-mixed', mediumMixed],
  ['long-mixed', longMixed],
];

// --- Benchmarks -------------------------------------------------------------

for (const [label, str] of cases) {
  describe(`byteLength: ${label} (${str.length} chars)`, () => {
    bench('TextEncoder (new each call)', () => {
      byteLengthTextEncoder(str);
    });
    bench('TextEncoder (cached)', () => {
      byteLengthCachedTextEncoder(str);
    });
    bench('charCodeAt loop', () => {
      byteLengthCharCode(str);
    });
    bench('ASCII fast-path', () => {
      byteLengthAsciiFast(str);
    });
    if (hasBuffer) {
      bench('Buffer.byteLength (Node)', () => {
        byteLengthBuffer(str);
      });
    }
    bench('Blob size', () => {
      byteLengthBlob(str);
    });
  });
}

// --- Full write-path comparison --------------------------------------------
// Simulates the ScalarConverter write: size() + write() for a string field.

const DST = new ArrayBuffer(1 << 20);
const DV = new DataView(DST);
const U8 = new Uint8Array(DST);

// Current impl (after fix): byteLength for size, encodeUTF8 for write.
function writeCurrent(str: string, offset: number): number {
  const size = byteLengthCharCode(str);
  const encoded = encodeUTF8(str);
  DV.setUint32(offset, size, true);
  U8.set(encoded, offset + 4);
  return size + 4;
}

// encodeInto into destination directly — no intermediate array, no double encode.
function writeEncodeInto(str: string, offset: number): number {
  // Best-case upper bound for UTF-8 in JS strings is 3 * str.length
  // (surrogate pairs encode as 4 bytes but consume 2 UTF-16 units, so 3*len is a safe bound).
  const view = U8.subarray(offset + 4, offset + 4 + str.length * 3);
  const { written } = SHARED_ENCODER.encodeInto(str, view);
  DV.setUint32(offset, written, true);
  return written + 4;
}

// Double-encode (original slow version before the fix)
function writeDoubleEncode(str: string, offset: number): number {
  const size = byteLengthTextEncoder(str);
  const encoded = SHARED_ENCODER.encode(str);
  DV.setUint32(offset, size, true);
  U8.set(encoded, offset + 4);
  return size + 4;
}

for (const [label, str] of cases) {
  describe(`write path: ${label} (${str.length} chars)`, () => {
    bench('double-encode (TextEncoder + encode) — BEFORE fix', () => {
      writeDoubleEncode(str, 0);
    });
    bench('charCodeAt size + encodeUTF8 — PREV fix', () => {
      writeCurrent(str, 0);
    });
    bench('encodeInto (single pass, native)', () => {
      writeEncodeInto(str, 0);
    });
  });
}

// --- Full serialize-flow comparison: size() → write() → size() -------------
// This mirrors how Codec/ScalarConverter actually drive the string converter:
// size() runs during pre-allocation, write() during encoding, size() again to
// advance the offset after write. Three calls per string in a flat message.

let flowCache: { s: string; b: Uint8Array } | null = null;
function flowEncodeCached(str: string): Uint8Array {
  if (flowCache !== null && flowCache.s === str) {
    return flowCache.b;
  }
  const b = SHARED_ENCODER.encode(str);
  flowCache = { s: str, b };
  return b;
}

function resetFlowCache(): void {
  flowCache = null;
}

function flowSizeCached(str: string): number {
  return flowEncodeCached(str).length + 4;
}
function flowWriteCached(str: string, offset: number): number {
  const encoded = flowEncodeCached(str);
  const size = encoded.length;
  DV.setUint32(offset, size, true);
  U8.set(encoded, offset + 4);
  return size + 4;
}

// Previous (charCodeAt size + encodeUTF8 write), no cache reuse across calls
function flowSizePrev(str: string): number {
  return byteLengthCharCode(str) + 4;
}
function flowWritePrev(str: string, offset: number): number {
  const encoded = encodeUTF8(str);
  const size = encoded.length;
  DV.setUint32(offset, size, true);
  U8.set(encoded, offset + 4);
  return size + 4;
}

// Original (double-encode)
function flowSizeOrig(str: string): number {
  return byteLengthTextEncoder(str) + 4;
}
function flowWriteOrig(str: string, offset: number): number {
  const size = byteLengthTextEncoder(str);
  const encoded = SHARED_ENCODER.encode(str);
  DV.setUint32(offset, size, true);
  U8.set(encoded, offset + 4);
  return size + 4;
}

for (const [label, str] of cases) {
  describe(`serialize flow (size→write→size): ${label} (${str.length} chars)`, () => {
    bench('ORIGINAL (3x encode)', () => {
      flowSizeOrig(str);
      flowWriteOrig(str, 0);
      flowSizeOrig(str);
    });
    bench('PREV FIX (charCodeAt + 1 encode)', () => {
      flowSizePrev(str);
      flowWritePrev(str, 0);
      flowSizePrev(str);
    });
    bench('CACHED (1 native encode shared)', () => {
      flowSizeCached(str);
      flowWriteCached(str, 0);
      flowSizeCached(str);
      resetFlowCache();
    });
    bench('CACHED (hot, no reset — same-ref reuse)', () => {
      flowSizeCached(str);
      flowWriteCached(str, 0);
      flowSizeCached(str);
    });
  });
}
