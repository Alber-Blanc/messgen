/* eslint-disable @typescript-eslint/no-loss-of-precision */
import { describe, it, expect, beforeAll } from 'vitest';
import { Codec } from './Codec';
import { uploadTypes, uploadProtocols } from '../tests/utils';
import type { Protocol, RawType } from './protocol';

describe('Codec', () => {
  let types: RawType[];
  let fixturesTypes: RawType[];
  let protocols: Protocol[];
  let codec: Codec;

  beforeAll(() => {
    types = uploadTypes('./fixtures/reference/types.json');
    fixturesTypes = uploadTypes('./fixtures/reference/fixture-types.json');
    protocols = uploadProtocols('./fixtures/reference/protocols.json');
    codec = new Codec(types, protocols);
  });

  it('should load types', () => {
    const definitions = types;

    const instance = new Codec(definitions);

    expect(instance).toBeDefined();
  });

  it('should load types and protocols', () => {
    const definitions = types;
    const messages = protocols;

    const instance = new Codec(definitions, messages);

    expect(instance).toBeDefined();
  });

  it('should load external types', () => {
    const definitions = fixturesTypes;

    const instance = new Codec(definitions, []);

    expect(instance).toBeDefined();
  });

  describe('#serialize', () => {
    it('should serialize and deserialize a message', () => {
      const { buffer } = new Int8Array([
        -17, -51, -85, -112, 120, 86, 52, 18, -17, -51, -85, -112, 120, 86, 52, 18, 18, -5, 89, -116, 66, -54, -64, -13,
        63, 120, 86, 52, 18, 120, 86, 52, 18, 82, 6, -98, 63, 52, 18, 18, -18, 1, 1, 5,
      ]);
      const bigint = BigInt('0x1234567890abcdef');
      const rawData = {
        f0: bigint,
        f1: bigint,
        f1_pad: 0x12,
        f2: 1.234567890123456789,
        f3: 0x12345678,
        f4: 0x12345678,
        f5: 1.234567890123456789,
        f6: 0x1234,
        f7: 0x12,
        f8: -0x12,
        f9: true,
        e0: 1,
        b0: 0b101,
      };

      const message = codec.serialize(1, 0, rawData);

      expect(new Uint8Array(message.buffer)).toEqual(new Uint8Array(buffer));
    });

    it('should serialize Chinese characters', () => {
      const rawData = {
        f0: 0n,
        f1_vec: new BigInt64Array([]),
        str: '你好',
      };

      const message = codec.serialize(1, 2, rawData);

      expect(new Uint8Array(message.buffer)).toEqual(
        new Uint8Array([
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0, // f0: int64
          0,
          0,
          0,
          0, // f1_vec: empty vector
          6,
          0,
          0,
          0,
          0xe4,
          0xbd,
          0xa0,
          0xe5,
          0xa5,
          0xbd, // str: UTF-8 bytes
        ]),
      );
    });
  });

  describe('#deserialize', () => {
    it('should deserialize structure', () => {
      const bigint = BigInt('0x1234567890abcdef');
      const rawData = {
        f0: bigint,
        f1: bigint,
        f1_pad: 0x12,
        f2: 1.234567890123456789,
        f3: 0x12345678,
        f4: 0x12345678,
        f5: 1.234567890123456789,
        f6: 0x1234,
        f7: 0x12,
        f8: -0x12,
        f9: true,
        e0: 0,
        b0: 0,
      };
      const message = codec.serialize(1, 0, rawData);

      const result = codec.deserialize(1, 0, message.buffer);

      expect(result).toEqual({
        ...rawData,
        f5: Math.fround(rawData.f5),
      });
    });

    it('should deserialize Chinese characters', () => {
      const rawData = {
        f0: 0n,
        f1_vec: new BigInt64Array([]),
        str: '你好',
      };
      const message = codec.serialize(1, 2, rawData);

      const data = codec.deserialize(1, 2, message.buffer);

      expect(data).toEqual(rawData);
    });
  });

  describe('#deserializeType', () => {
    it('should deserialize cross type by name', () => {
      const rawData = {
        f0: 0n,
        f1_vec: new BigInt64Array([-0n, 5n, 1n]),
        str: 'Hello messgen!',
      };
      const message = codec.serialize(1, 2, rawData);

      const result = codec.deserializeType('mynamespace/types/var_size_struct', message.buffer);

      expect(result).toEqual(rawData);
    });
  });

  describe('#messageInfo', () => {
    it('should get message info by id', () => {
      const messageInfo = codec.messageInfo(1, 1);

      const hash = messageInfo.messageHash();

      expect(hash).toBe(13272587043423170596n);
    });

    it('should get the name of the protocol the message belongs to', () => {
      const messageInfo = codec.messageInfo(1, 1);

      const name = messageInfo.protoName();

      expect(name).toBe('mynamespace/proto/test_proto');
    });

    it('should get the name of the message', () => {
      const messageInfo = codec.messageInfo(1, 1);

      const name = messageInfo.messageName();

      expect(name).toBe('complex_struct');
    });
  });

  describe('#getTypeConverter', () => {
    it('should get type converter by type name', () => {
      const typeName = 'mynamespace/types/var_size_struct';

      const converter = codec.getTypeConverter(typeName);

      expect(converter.name).toBe(typeName);
    });

    it('should throw error if type converter not found', () => {
      const typeName = 'non/existent/type';

      const getConverter = () => codec.getTypeConverter(typeName);

      expect(getConverter).toThrowError();
    });
  });
});
