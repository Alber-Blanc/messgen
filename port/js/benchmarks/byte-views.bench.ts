import { bench, describe } from 'vitest';
import { Codec } from '../src/Codec';
import type { RawType } from '../src/protocol';

type Messages = {
  Key: { key: string };
  Value: { value: string };
  Snapshot: { rows: { key: Uint8Array; value: Uint8Array }[] };
};

const types: RawType[] = [
  { type: 'Key', type_class: 'struct', hash: '0', fields: [{ name: 'key', type: 'string' }] },
  { type: 'Value', type_class: 'struct', hash: '0', fields: [{ name: 'value', type: 'string' }] },
  {
    type: 'Row',
    type_class: 'struct',
    hash: '0',
    fields: [
      { name: 'key', type: 'bytes' },
      { name: 'value', type: 'bytes' },
    ],
  },
  { type: 'Snapshot', type_class: 'struct', hash: '0', fields: [{ name: 'rows', type: 'Row[]' }] },
];

const codec = new Codec<Messages>(types);
const rowCount = 100_000;
const input = createSnapshot();
const expectedLastKey = 'key:99999'.padEnd(100, 'k');
const expectedLastValue = 'value:99999'.padEnd(200, 'v');

describe('100k records: decode a bytes envelope, then its keys and values', () => {
  for (const copyBytes of [true, false]) {
    bench(
      copyBytes ? 'copy bytes' : 'borrow bytes',
      () => {
        const snapshot = codec.deserializeType('Snapshot', input, { copyBytes });
        const result = snapshot.rows.map(({ key, value }) => ({
          key: codec.deserializeType('Key', key).key,
          value: codec.deserializeType('Value', value).value,
        }));
        const last = result[rowCount - 1];
        if (result.length !== rowCount || last.key !== expectedLastKey || last.value !== expectedLastValue) {
          throw new Error('Decoded snapshot does not match the input');
        }
      },
      { time: 1_000, iterations: 10, warmupTime: 500, warmupIterations: 5 },
    );
  }
});

function createSnapshot(): ArrayBufferLike {
  const rows = Array.from({ length: rowCount }, (_, i) => ({
    key: new Uint8Array(codec.serializeType('Key', { key: ('key:' + i).padEnd(100, 'k') }).buffer),
    value: new Uint8Array(codec.serializeType('Value', { value: ('value:' + i).padEnd(200, 'v') }).buffer),
  }));
  return codec.serializeType('Snapshot', { rows }).buffer;
}
