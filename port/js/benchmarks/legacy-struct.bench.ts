import { Buffer } from '../src/Buffer';
import { bench, describe, expect } from 'vitest';
import { Buffer as LegacyBuffer, Struct } from './deserialize-variant/messgen-old.js';
import { StructConverter } from '../src/converters/base/StructConverter.js';
import { TypeClass, type StructTypeDefinition } from '../src/types.js';
import { initGetType } from '../tests/utils.js';

const srcStruct = new Struct({
  id: 2,
  fields: [
    { name: 'type_Int8', type: 'Int8' },
    { name: 'type_Uint8', type: 'Uint8' },
    { name: 'type_Int16', type: 'Int16' },
    { name: 'type_Uint16', type: 'Uint16' },
    { name: 'type_Int32', type: 'Int32' },
    { name: 'type_Uint32', type: 'Uint32' },
    { name: 'type_Int64', type: 'Int64' },
    { name: 'type_Uint64', type: 'Uint64' },
    { name: 'type_String', type: 'String' },
    { name: 'type_Double', type: 'Double' },
  ],
});

const srcData = {
  type_Int8: 8,
  type_Uint8: 8,
  type_Int16: 8,
  type_Uint16: 8,
  type_Int32: 8,
  type_Uint32: 8,
  type_Int64: BigInt(8),
  type_Uint64: BigInt(8),
  type_String: 'This is test string',
  type_Double: -Math.PI,
};
const b = LegacyBuffer.serializeObj(srcStruct.schema.fields, srcData);

const schema: StructTypeDefinition = {
  typeClass: TypeClass.STRUCT,
  typeName: 'testStruct',
  fields: [
    { name: 'type_Int8', type: 'int8' },
    { name: 'type_Uint8', type: 'uint8' },
    { name: 'type_Int16', type: 'int16' },
    { name: 'type_Uint16', type: 'uint16' },
    { name: 'type_Int32', type: 'int32' },
    { name: 'type_Uint32', type: 'uint32' },
    { name: 'type_Int64', type: 'int64' },
    { name: 'type_Uint64', type: 'uint64' },
    { name: 'type_String', type: 'string' },
    { name: 'type_Double', type: 'float64' },
  ],
};

const getType = initGetType();
const structConverter = new StructConverter(schema, getType);
const size = structConverter.size(srcData);
const buffer = new Buffer(new ArrayBuffer(size));
structConverter.serialize(srcData, buffer);
expect(new Uint8Array(buffer.buffer)).toEqual(new Uint8Array(b));

describe('calculate size', () => {
  bench(
    'legacy',
    () => {
      LegacyBuffer.calcSize(LegacyBuffer.createValueArray(srcStruct.fields, srcData));
    },
    { time: 1000 },
  );

  bench('current', () => {
    structConverter.size(srcData);
  });
});
describe('serialize Obj', () => {
  bench(
    'legacy',
    () => {
      LegacyBuffer.serializeObj(srcStruct.schema.fields, srcData);
    },
    { time: 1000 },
  );
  bench('current', () => {
    const destination = new Buffer(new ArrayBuffer(structConverter.size(srcData)));
    structConverter.serialize(srcData, destination);
  });
});

describe('deserialize object', () => {
  bench(
    'legacy',
    () => {
      new LegacyBuffer(b, true).deserialize(srcStruct);
    },
    { time: 1000 },
  );
  bench('current', () => {
    structConverter.deserialize(new Buffer(buffer.buffer));
  });
});
