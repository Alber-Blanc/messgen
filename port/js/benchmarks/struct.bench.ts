import { bench, describe } from 'vitest';
import { Codec } from '../src/Codec';
import { uploadBinary, uploadProtocols, uploadTypes } from '../tests/utils';

const messages = [
  [0, 'simple_struct'],
  [1, 'complex_struct'],
  [2, 'var_size_struct'],
  [4, 'empty_struct'],
  [9, 'flat_struct'],
  [10, 'complex_types_with_flat_groups'],
] as const;

const serializedMessages = messages.map(([id, name]) => ({
  id,
  data: uploadBinary(`./fixtures/reference/bin/${name}.bin`),
}));

describe('Codec: reference messages from the Python implementation', () => {
  const codec = new Codec(
    uploadTypes('./fixtures/reference/types.json'),
    uploadProtocols('./fixtures/reference/protocols.json'),
  );
  bench('deserialize 6 messages', () => {
    for (const { id, data } of serializedMessages) {
      codec.deserialize(1, id, data);
    }
  });
});
