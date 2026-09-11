import { describe, expect, expectTypeOf, it } from 'vitest';
import { Codec } from './index';
import type { Protocol, RawType } from './index';

type Payload = { data: Uint8Array; numbers: Uint16Array };
type Envelope = { rows: { key: Uint8Array; value: Uint8Array }[]; trailer: number };
type Messages = { Payload: Payload; Envelope: Envelope };

const types: RawType[] = [
  {
    type: 'Payload',
    type_class: 'struct',
    hash: '0',
    fields: [
      { name: 'data', type: 'bytes' },
      { name: 'numbers', type: 'uint16[2]' },
    ],
  },
  {
    type: 'Row',
    type_class: 'struct',
    hash: '0',
    fields: [
      { name: 'key', type: 'bytes' },
      { name: 'value', type: 'bytes' },
    ],
  },
  {
    type: 'Envelope',
    type_class: 'struct',
    hash: '0',
    fields: [
      { name: 'rows', type: 'Row[]' },
      { name: 'trailer', type: 'uint32' },
    ],
  },
];
const protocols: Protocol[] = [
  { name: 'Example', proto_id: 1, messages: { 2: { message_id: 2, name: 'envelope', type: 'Envelope', hash: '0' } } },
];

describe.each(['name', 'protocol'] as const)('byte fields through the %s entry point', (entryPoint) => {
  it('should decode nested fields from a subview', () => {
    const { codec, input, envelope } = createFixture();

    const result = decodeEnvelope(codec, entryPoint, input);

    expect(result).toEqual(envelope);
  });

  it('should share the input buffer with all nested byte fields', () => {
    const { codec, input } = createFixture();

    const result = decodeEnvelope(codec, entryPoint, input);

    expect(
      result.rows.flatMap(({ key, value }) => [key.buffer === input.buffer, value.buffer === input.buffer]),
    ).toEqual([true, true, true, true]);
  });

  it('should decode a payload directly from a borrowed byte field', () => {
    const { codec, input, payload } = createFixture();
    const envelope = decodeEnvelope(codec, entryPoint, input);

    const result = codec.deserializeType('Payload', envelope.rows[0].value);

    expect(result).toEqual(payload);
  });

  it('should share the original input buffer with bytes in a decoded payload', () => {
    const { codec, input } = createFixture();
    const envelope = decodeEnvelope(codec, entryPoint, input);

    const result = codec.deserializeType('Payload', envelope.rows[0].value);

    expect(result.data.buffer).toBe(input.buffer);
  });
});

it('should infer the named payload type for a byte view', () => {
  const { codec, input } = createFixture();

  const result = codec.deserializeType('Envelope', input);

  expectTypeOf(result).toEqualTypeOf<Envelope>();
});

it('should keep numeric typed arrays independent when bytes are borrowed', () => {
  const { codec, payload } = createFixture();
  const input = new Uint8Array(codec.serializeType('Payload', payload).buffer);

  const result = codec.deserializeType('Payload', input);
  input.fill(0);

  expect(result.numbers).toEqual(payload.numbers);
});

function createFixture() {
  const codec = new Codec<Messages>(types, protocols);
  const payload = { data: new Uint8Array([10, 20, 30]), numbers: new Uint16Array([513, 1027]) };
  const value = new Uint8Array(codec.serializeType('Payload', payload).buffer);
  const envelope: Envelope = {
    rows: [
      { key: new Uint8Array([1, 2]), value },
      { key: new Uint8Array([3, 4]), value },
    ],
    trailer: 0x12345678,
  };
  const encoded = codec.serializeType('Envelope', envelope);
  const storage = new Uint8Array(encoded.size + 10).fill(0xaa);
  storage.set(new Uint8Array(encoded.buffer), 5);
  return { codec, payload, envelope, input: storage.subarray(5, 5 + encoded.size) };
}

function decodeEnvelope(codec: Codec<Messages>, entryPoint: 'name' | 'protocol', input: Uint8Array): Envelope {
  return entryPoint === 'name'
    ? codec.deserializeType('Envelope', input)
    : codec.deserialize<Envelope>(1, 2, new DataView(input.buffer, input.byteOffset, input.byteLength));
}
