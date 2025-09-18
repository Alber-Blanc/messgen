// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable @typescript-eslint/no-loss-of-precision */
import { describe, it, expect, beforeAll } from 'vitest';
import { execSync } from 'child_process';
import { Codec } from '../src/Codec';
import { uploadTypes, uploadProtocols } from './utils';
import type { Protocol, RawType } from '../src/protocol';

describe('Codec', () => {
  let types: RawType[];
  let protocols: Protocol[];
  let codec: Codec;

  const crossProtoMessage = new Int8Array([-17, -51, -85, -112, 120, 86, 52, 18, 1]).buffer;

  beforeAll(() => {
    execSync('npm run gen:json');
    types = uploadTypes('./types.json');
    protocols = uploadProtocols('./protocols.json');
    codec = new Codec(types, protocols);
  });

  it('should load types', () => {
    expect(new Codec(types, protocols)).toBeDefined();
  });

  it('should load types and protocols', () => {
    expect(new Codec(types, protocols)).toBeDefined();
  });

  describe('#serialize', () => {
    it('should serialize and deserialize a message', () => {
      const { buffer } = new Int8Array([
        -17, -51, -85, -112, 120, 86, 52, 18, -17, -51, -85, -112, 120, 86, 52, 18,
        18, -5, 89, -116, 66, -54, -64, -13, 63, 120, 86, 52, 18, 120, 86, 52, 18,
        82, 6, -98, 63, 52, 18, 18, -18, 1,
      ]);
      const bigint = BigInt('0x1234567890abcdef');
      const rawData = {
        f0: bigint,
        f1: bigint,
        f1_pad: 0x12,
        f2: 1.2345678901234567890,
        f3: 0x12345678,
        f4: 0x12345678,
        f5: 1.2345678901234567890,
        f6: 0x1234,
        f7: 0x12,
        f8: -0x12,
        f9: true,
      };

      const message = codec.serialize(1, 0, rawData);

      expect(message.buffer).toEqual(buffer);
    });

    it('should serialize and deserialize cross proto message', () => {
      const rawData = {
        f0: BigInt('0x1234567890abcdef'),
        cross0: 1,
      };

      const message = codec.serialize(2, 0, rawData);

      expect(message.buffer).toEqual(crossProtoMessage);
    });

    it('should serialize chinese characters', () => {
      const rawData = {
        f0: 0n,
        f1_vec: new BigInt64Array([]),
        str: '你好',
      };

      const message = codec.serialize(1, 2, rawData);

      expect(message.buffer).toEqual(new Int8Array([-17, -51, -85, -112, 120, 86, 52, 18, 1]).buffer);
    });
  });

  describe('#deserialize', () => {
    it('should deserialize structure', () => {
      const bigint = BigInt('0x1234567890abcdef');
      const rawData = {
        f0: bigint,
        f1: bigint,
        f1_pad: 0x12,
        f2: 1.2345678901234567890,
        f3: 0x12345678,
        f4: 0x12345678,
        f5: 1.2345678901234567890,
        f6: 0x1234,
        f7: 0x12,
        f8: -0x12,
        f9: true,
      };

      const message = codec.serialize(1, 0, rawData);

      expect(codec.deserialize(1, 0, message.buffer)).toEqual({
        ...rawData,
        f5: expect.closeTo(rawData.f5, 5),
      });
    });

    it('should deserialize a message with cors', () => {
      const rawData = {
        f0: BigInt('0x1234567890abcdef'),
        cross0: 1,
      };

      const message = codec.serialize(2, 0, rawData);

      expect(codec.deserialize(2, 0, message.buffer)).toEqual(rawData);
    });

    it('should deserialize chinese characters', () => {
      const rawData = {
        f0: 0n,
        f1_vec: new BigInt64Array([]),
        str: '你好',
      };

      const data = codec.deserialize(1, 2, codec.serialize(1, 2, rawData).buffer);

      expect(data).toEqual(rawData);
    });
  });

  describe('#deserializeType', () => {
    it('should deserialize cross type by name', () => {
      const rawData = {
        f0: BigInt('0x1234567890abcdef'),
        cross0: 1,
      };

      const message = codec.serialize(2, 0, rawData);

      expect(codec.deserializeType('cross_proto', message.buffer)).toEqual(rawData);
    });
  });
});
