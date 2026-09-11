import { describe, expect, expectTypeOf, it, vi } from 'vitest';
import { Codec, Cursor, DecimalConverter, ExternalConverter, TypeClass } from './index';
import type { Protocol, RawType, Converter, Decimal } from './index';

type Messages = { Message: { text: string } };
const types: RawType[] = [
  {
    type: 'Message',
    type_class: 'struct',
    hash: '3',
    fields: [{ name: 'text', type: 'string' }],
  },
];
const protocols: Protocol[] = [
  {
    name: 'Example',
    proto_id: 1,
    messages: { 2: { message_id: 2, name: 'message', type: 'Message', hash: '7' } },
  },
];

describe('Codec API', () => {
  it('types named payloads and shares converters between both entry points', () => {
    const codec = new Codec<Messages>(types, protocols);
    const converter = codec.getTypeConverter('Message');
    expectTypeOf(converter).toEqualTypeOf<Converter<Messages['Message']>>();
    expectTypeOf(codec.serializeType).parameter(0).toEqualTypeOf<'Message'>();
    const serialize = vi.spyOn(converter, 'serialize');
    const byName = codec.serializeType('Message', { text: '你好🌍' });
    const byId = codec.serialize(1, 2, { text: '你好🌍' });
    expect(serialize).toHaveBeenCalledTimes(2);
    expect(new Uint8Array(byName.buffer)).toEqual(new Uint8Array(byId.buffer));
    const decoded = codec.deserializeType('Message', byName.buffer);
    expectTypeOf(decoded).toEqualTypeOf<Messages['Message']>();
    expect(decoded).toEqual({ text: '你好🌍' });
    expect(codec.messageInfo(1, 2).messageHash()).toBe(4n);
  });

  it('accepts byte subviews through both deserialize entry points', () => {
    const codec = new Codec<Messages>(types, protocols);
    const encoded = codec.serializeType('Message', { text: 'hello' });
    const storage = new Uint8Array(encoded.size + 10).fill(0xaa);
    storage.set(new Uint8Array(encoded.buffer), 5);
    const input = storage.subarray(5, 5 + encoded.size);
    expect(codec.deserializeType('Message', input)).toEqual({ text: 'hello' });
    expect(codec.deserialize(1, 2, new DataView(input.buffer, input.byteOffset, input.byteLength))).toEqual({
      text: 'hello',
    });
  });

  it('keeps useful errors for missing types, protocols and messages', () => {
    const codec = new Codec(types, protocols);
    expect(() => codec.serialize(9, 2, {})).toThrow('Protocol not found with ID: 9');
    expect(() => codec.deserialize(9, 2, new ArrayBuffer(0))).toThrow('Protocol not found with ID: 9');
    expect(() => codec.serialize(1, 9, {})).toThrow('Converter not found for message Id: 9');
    expect(() => codec.deserialize(1, 9, new ArrayBuffer(0))).toThrow('Converter not found for message Id: 9');
    expect(() => codec.deserializeType('missing', new ArrayBuffer(0))).toThrow('Converter not found for type: missing');
    expect(() => codec.messageInfo(9, 2)).toThrow('Unsupported proto_id=9');
    expect(() => codec.messageInfo(1, 9)).toThrow('Unsupported proto_id=1 message_id=9');
  });

  it('supports distinct converter input and output types', () => {
    const converter = new DecimalConverter();
    expectTypeOf(converter).toMatchTypeOf<Converter<Decimal, Decimal | number | string>>();
    const cursor = new Cursor(new ArrayBuffer(converter.size()));
    converter.serialize('12.5', cursor);
    cursor.offset = 0;
    expect(converter.deserialize(cursor).equals('12.5')).toBe(true);
  });

  it('reports unsupported external operations explicitly', () => {
    const converter = new ExternalConverter({ typeName: 'External', typeClass: TypeClass.EXTERNAL });
    expect(converter.createDefault()).toBe(null);
    const cursor = new Cursor(new ArrayBuffer(0));
    expect(() => converter.size({})).toThrow('external type External');
    expect(() => converter.serialize({}, cursor)).toThrow('external type External');
    expect(() => converter.deserialize(cursor)).toThrow('external type External');
  });
});
