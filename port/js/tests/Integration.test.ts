/* eslint-disable @typescript-eslint/no-loss-of-precision */
import { beforeAll, describe, expect, it } from 'vitest';
import { Codec } from '../src';
import { uploadBinary, uploadProtocols, uploadTypes } from './utils';

const bigint = BigInt('0x1234567890abcdef');
const float = 1.234567890123456789;

describe('integration with Python reference binaries', () => {
  let codec: Codec;

  beforeAll(() => {
    const types = uploadTypes('./fixtures/reference/types.json');
    const protocols = uploadProtocols('./fixtures/reference/protocols.json');
    codec = new Codec(types, protocols);
  });

  describe.each([
    { name: 'simple_struct', messageId: 0, createValue: createSimpleStruct },
    { name: 'var_size_struct', messageId: 2, createValue: createVariableStruct },
    { name: 'empty_struct', messageId: 4, createValue: () => ({}) },
    { name: 'complex_struct', messageId: 1, createValue: createComplexStruct },
    { name: 'flat_struct', messageId: 9, createValue: createFlatStruct },
  ])('$name', ({ name, messageId, createValue }) => {
    it('should serialize to the reference bytes', () => {
      const value = createValue(float);
      const reference = uploadBinary('./fixtures/reference/bin/' + name + '.bin');

      const buffer = codec.serialize(1, messageId, value);

      expect(new Uint8Array(buffer.buffer)).toEqual(new Uint8Array(reference));
    });

    it('should allocate the reference size', () => {
      const value = createValue(float);
      const reference = uploadBinary('./fixtures/reference/bin/' + name + '.bin');

      const buffer = codec.serialize(1, messageId, value);

      expect(buffer.size).toBe(reference.length);
    });

    it('should deserialize the reference bytes', () => {
      const reference = uploadBinary('./fixtures/reference/bin/' + name + '.bin');
      const expected = createValue(Math.fround(float));

      const value = codec.deserialize(1, messageId, new Uint8Array(reference));

      expect(value).toEqual(expected);
    });
  });
});

function createSimpleStruct(float32: number) {
  return {
    f0: bigint,
    f1: bigint,
    f1_pad: 0x12,
    f2: float,
    f3: 0x12345678,
    f4: 0x12345678,
    f5: float32,
    f6: 0x1234,
    f7: 0x12,
    f8: -0x12,
    f9: true,
    e0: 0,
    b0: 0,
  };
}

function createVariableStruct() {
  return {
    f0: bigint,
    f1_vec: new BigInt64Array([-bigint, 5n, 1n]),
    str: 'Hello messgen!',
  };
}

function createComplexStruct(float32: number) {
  const simpleStruct = createSimpleStruct(float32);
  return {
    arr_simple_struct: Array(2).fill(simpleStruct),
    arr_int: new BigInt64Array(4).fill(bigint),
    arr_var_size_struct: Array(2).fill({
      f0: bigint,
      f1_vec: new BigInt64Array([bigint, 5n, 1n]),
      str: 'Hello messgen!',
    }),
    vec_float: new Float64Array(3).fill(float),
    vec_enum: [0, 1],
    vec_simple_struct: Array(3).fill(simpleStruct),
    vec_vec_var_size_struct: [],
    vec_arr_vec_int: [],
    str: 'Example String',
    bs: new Uint8Array([0x62, 0x79, 0x74, 0x65, 0x20, 0x73, 0x74, 0x72, 0x69, 0x6e, 0x67]),
    str_vec: ['string1', 'string2', 'string3'],
    map_str_by_int: new Map(Array.from({ length: 3 }, (_, i) => [i, 'string' + i])),
    map_vec_by_str: new Map(Array.from({ length: 3 }, (_, i) => ['key' + i, new Int32Array(3).fill(0x1234)])),
    bitset0: 1 | 4,
    array_of_size_zero: new Int32Array(0),
  };
}

function createFlatStruct(float32: number) {
  return {
    f0: bigint,
    f1: bigint,
    f2: float,
    f3: 0x12345678,
    f4: 0x12345678,
    f5: float32,
    f6: 0x1234,
    f7: 0x12,
    f8: -0x12,
  };
}
