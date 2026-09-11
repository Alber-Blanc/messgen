import { describe, expect, expectTypeOf, it, vi } from 'vitest';
import { Codec, Cursor, DecimalConverter, ExternalConverter, TypeClass } from './index';
import type { Protocol, RawType, Converter, Decimal } from './index';

type Messages = { Message: { text: string } };
const types: RawType[] = [
  { type: 'Message', type_class: 'struct', hash: '3', fields: [{ name: 'text', type: 'string' }] },
];
const protocols: Protocol[] = [
  { name: 'Example', proto_id: 1, messages: { 2: { message_id: 2, name: 'message', type: 'Message', hash: '7' } } },
];

describe('Codec API', () => {
  it('types the converter for a named payload', () => {
    const codec = new Codec<Messages>(types, protocols);

    const converter = codec.getTypeConverter('Message');

    expectTypeOf(converter).toEqualTypeOf<Converter<Messages['Message']>>();
  });

  it('restricts serialization to known type names', () => {
    const codec = new Codec<Messages>(types, protocols);

    const serialize = codec.serializeType;

    expectTypeOf(serialize).parameter(0).toEqualTypeOf<'Message'>();
  });

  it('infers the decoded payload type', () => {
    const codec = new Codec<Messages>(types, protocols);
    const encoded = codec.serializeType('Message', { text: '你好🌍' });

    const decoded = codec.deserializeType('Message', encoded.buffer);

    expectTypeOf(decoded).toEqualTypeOf<Messages['Message']>();
  });

  it('shares the converter between named and protocol entry points', () => {
    const codec = new Codec<Messages>(types, protocols);
    const serialize = vi.spyOn(codec.getTypeConverter('Message'), 'serialize');

    codec.serializeType('Message', { text: '你好🌍' });
    codec.serialize(1, 2, { text: '你好🌍' });

    expect(serialize).toHaveBeenCalledTimes(2);
  });

  it('produces the same bytes through both entry points', () => {
    const codec = new Codec<Messages>(types, protocols);
    const expected = codec.serializeType('Message', { text: '你好🌍' });

    const encoded = codec.serialize(1, 2, { text: '你好🌍' });

    expect(new Uint8Array(encoded.buffer)).toEqual(new Uint8Array(expected.buffer));
  });

  it('decodes a named Unicode payload', () => {
    const codec = new Codec<Messages>(types, protocols);
    const encoded = codec.serializeType('Message', { text: '你好🌍' });

    const decoded = codec.deserializeType('Message', encoded.buffer);

    expect(decoded).toEqual({ text: '你好🌍' });
  });

  it('preserves the message hash', () => {
    const codec = new Codec<Messages>(types, protocols);

    const hash = codec.messageInfo(1, 2).messageHash();

    expect(hash).toBe(4n);
  });

  it.each(['name', 'protocol'] as const)('accepts a byte subview through the %s entry point', (entryPoint) => {
    const codec = new Codec<Messages>(types, protocols);
    const encoded = codec.serializeType('Message', { text: 'hello' });
    const storage = new Uint8Array(encoded.size + 10).fill(0xaa);
    storage.set(new Uint8Array(encoded.buffer), 5);
    const input = storage.subarray(5, 5 + encoded.size);

    const decoded =
      entryPoint === 'name'
        ? codec.deserializeType('Message', input)
        : codec.deserialize(1, 2, new DataView(input.buffer, input.byteOffset, input.byteLength));

    expect(decoded).toEqual({ text: 'hello' });
  });

  it.each([
    {
      name: 'serialize protocol',
      run: (codec: Codec) => codec.serialize(9, 2, {}),
      message: 'Protocol not found with ID: 9',
    },
    {
      name: 'deserialize protocol',
      run: (codec: Codec) => codec.deserialize(9, 2, new ArrayBuffer(0)),
      message: 'Protocol not found with ID: 9',
    },
    {
      name: 'serialize message',
      run: (codec: Codec) => codec.serialize(1, 9, {}),
      message: 'Converter not found for message Id: 9',
    },
    {
      name: 'deserialize message',
      run: (codec: Codec) => codec.deserialize(1, 9, new ArrayBuffer(0)),
      message: 'Converter not found for message Id: 9',
    },
    {
      name: 'named type',
      run: (codec: Codec) => codec.deserializeType('missing', new ArrayBuffer(0)),
      message: 'Converter not found for type: missing',
    },
    { name: 'protocol metadata', run: (codec: Codec) => codec.messageInfo(9, 2), message: 'Unsupported proto_id=9' },
    {
      name: 'message metadata',
      run: (codec: Codec) => codec.messageInfo(1, 9),
      message: 'Unsupported proto_id=1 message_id=9',
    },
  ])('reports a missing $name', ({ run, message }) => {
    const codec = new Codec(types, protocols);

    const action = () => run(codec);

    expect(action).toThrow(message);
  });

  it('supports distinct converter input and output types', () => {
    const createConverter = () => new DecimalConverter();

    const converter = createConverter();

    expectTypeOf(converter).toMatchTypeOf<Converter<Decimal, Decimal | number | string>>();
  });

  it('decodes a decimal serialized from a string', () => {
    const converter = new DecimalConverter();
    const cursor = new Cursor(new ArrayBuffer(converter.size()));
    converter.serialize('12.5', cursor);
    cursor.offset = 0;

    const value = converter.deserialize(cursor);

    expect(value.equals('12.5')).toBe(true);
  });

  it('provides a null default for an external type', () => {
    const converter = new ExternalConverter({ typeName: 'External', typeClass: TypeClass.EXTERNAL });

    const value = converter.createDefault();

    expect(value).toBe(null);
  });

  it.each([
    { name: 'sizing', run: (converter: ExternalConverter, _cursor: Cursor) => converter.size({}) },
    { name: 'serialization', run: (converter: ExternalConverter, cursor: Cursor) => converter.serialize({}, cursor) },
    { name: 'deserialization', run: (converter: ExternalConverter, cursor: Cursor) => converter.deserialize(cursor) },
  ])('reports unsupported external $name', ({ run }) => {
    const converter = new ExternalConverter({ typeName: 'External', typeClass: TypeClass.EXTERNAL });
    const cursor = new Cursor(new ArrayBuffer(0));

    const action = () => run(converter, cursor);

    expect(action).toThrow('external type External');
  });
});
