import { readFileSync } from 'node:fs';
import { bench, describe } from 'vitest';
import { Buffer } from '../src/Buffer';
import { ConverterFactory } from '../src/converters/ConverterFactory';
import type { MapConverter } from '../src/converters/base/MapConverter';

const converter = new ConverterFactory().toConverter('string{string}') as MapConverter;

function encodeMap(value: Map<string, string> | Record<string, string>): ArrayBufferLike {
  const buffer = new Buffer(new ArrayBuffer(converter.size(value)));
  converter.serialize(value, buffer);
  return buffer.buffer;
}

function syntheticMap(length: number, alphabet: string): ArrayBufferLike {
  const padding = alphabet.repeat(length);
  const value = new Map<string, string>();
  for (let i = 0; i < 100_000; i++) {
    value.set(`key:${i}:${padding}`.slice(0, length), `value:${i}:${padding}`.slice(0, length));
  }
  return encodeMap(value);
}

function benchmarkMaps(name: string, buffers: ArrayBufferLike[], expectedEntries: number) {
  describe(name, () => {
    bench(
      'deserialize',
      () => {
        let entries = 0;
        for (const buffer of buffers) {
          entries += converter.deserialize(new Buffer(buffer)).size;
        }
        if (entries !== expectedEntries) {
          throw new Error(`Expected ${expectedEntries} entries, got ${entries}`);
        }
      },
      { time: 1_000, iterations: 10, warmupTime: 500, warmupIterations: 5 },
    );
  });
}

benchmarkMaps('100k pairs, 100-character ASCII keys and values', [syntheticMap(100, 'parameter/value.')], 100_000);
benchmarkMaps('100k pairs, 200-character ASCII keys and values', [syntheticMap(200, 'parameter/value.')], 100_000);
benchmarkMaps('100k pairs, 100-character Unicode keys and values', [syntheticMap(100, 'параметр日本語')], 100_000);

// Optional real workload: Charts[].Parameters maps, not JSON parsing or the rest of the document.
const jsonPath = process.env.MESSGEN_BENCH_JSON;
if (jsonPath) {
  const data: { Charts: { Parameters?: Record<string, string> }[] } = JSON.parse(readFileSync(jsonPath, 'utf8'));
  const maps = data.Charts.flatMap(({ Parameters }) => (Parameters ? [Parameters] : []));
  const entries = maps.reduce((count, value) => count + Object.keys(value).length, 0);
  benchmarkMaps(`Charts[].Parameters from ${jsonPath} (${entries} pairs)`, maps.map(encodeMap), entries);
}
