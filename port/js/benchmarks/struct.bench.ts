import { bench, describe } from 'vitest';
import { Codec } from '../src/Codec';
import { uploadBinary, uploadProtocols, uploadTypes } from '../tests/utils';
import type { MessageId } from '../src/types';

const serializedMsgs = [
  [0, uploadBinary('../../../tests/data/serialized/bin/simple_struct.bin')],
  [2, uploadBinary('../../../tests/data/serialized/bin/var_size_struct.bin')],
  [3, uploadBinary('../../../tests/data/serialized/bin/struct_with_enum.bin')],
  [4, uploadBinary('../../../tests/data/serialized/bin/empty_struct.bin')],
  [5, uploadBinary('../../../tests/data/serialized/bin/complex_struct_with_empty.bin')],
  [6, uploadBinary('../../../tests/data/serialized/bin/complex_struct_custom_alloc.bin')],
  [7, uploadBinary('../../../tests/data/serialized/bin/flat_struct.bin')],
] as unknown as [MessageId, Buffer][];

const protoId = 1;

describe('Codec deserialization benchmark', () => {
  const types = uploadTypes('./types.json');
  const protocols = uploadProtocols('./protocols.json');
  const codec = new Codec(types, protocols);

  bench('deserialize 10,000 iterations', () => {
    for (const [msgId, msgData] of serializedMsgs) {
      codec.deserialize(protoId, msgId, new Uint8Array(msgData).buffer);
    }
  }, {
    iterations: 1000,
  });
});
