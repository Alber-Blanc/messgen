import { describe, it, expect, beforeAll } from 'vitest';
import { Protocols } from './Protocols';

describe('Protocols', () => {
  let protocols: Protocols;

  beforeAll(() => {
    protocols = new Protocols();
    protocols.load([
      {
        type: 'simple_struct',
        type_class: 'struct',
        fields: [
          { name: 'f0', type: 'uint64' },
          { name: 'f1', type: 'int64' },
        ],
        hash: '14386769706336566742',
      },
      {
        type: 'simple_enum',
        type_class: 'enum',
        base_type: 'uint8',
        values: [
          { name: 'one_value', value: 0 },
          { name: 'another_value', value: 1 },
        ],
        hash: '',
      },
    ]);
  });

  describe('#getType', () => {
    it('should resolve scalar types', () => {
      const typeName = 'uint64';

      const type = protocols.getType(typeName);

      expect(type).toEqual({
        type: 'uint64',
        typeClass: 'scalar',
      });
    });

    it('should resolve array types', () => {
      const typeName = 'uint64[4]';

      const type = protocols.getType(typeName);

      expect(type).toEqual({
        type: 'uint64[4]',
        typeClass: 'typed-array',
        elementType: 'uint64',
        arraySize: 4,
      });
    });

    it('should resolve dynamic array types', () => {
      const typeName = 'uint64[]';

      const type = protocols.getType(typeName);

      expect(type).toEqual({
        type: 'uint64[]',
        typeClass: 'typed-array',
        elementType: 'uint64',
        size: undefined,
      });
    });

    it('should resolve map types', () => {
      const typeName = 'string{int32}';

      const type = protocols.getType(typeName);

      expect(type).toEqual({
        type: 'string{int32}',
        typeClass: 'map',
        keyType: 'int32',
        valueType: 'string',
      });
    });

    it('should resolve struct types', () => {
      const typeName = 'simple_struct';

      const type = protocols.getType(typeName);

      expect(type).toEqual({
        typeClass: 'struct',
        typeName: 'simple_struct',
        fields: [
          { name: 'f0', type: 'uint64' },
          { name: 'f1', type: 'int64' },
        ],
      });
    });

    it('should resolve enum types', () => {
      const typeName = 'simple_enum';

      const type = protocols.getType(typeName);

      expect(type).toEqual({
        typeClass: 'enum',
        typeName: 'simple_enum',
        type: 'uint8',
        values: [
          { name: 'one_value', value: 0 },
          { name: 'another_value', value: 1 },
        ],
      });
    });

    it('should resolve decimal types', () => {
      const typeName = 'dec64';

      const type = protocols.getType(typeName);

      expect(type).toEqual({
        type: 'dec64',
        typeClass: 'decimal',
      });
    });

    it('should throw error for unknown types', () => {
      const typeName = 'unknown_type';

      const getType = () => protocols.getType(typeName);

      expect(getType).toThrow('Unknown type: unknown_type not found');
    });

    it('should resolve cross-protocol type references', () => {
      const typeName = 'simple_struct';

      const type = protocols.getType(typeName);

      expect(type.typeClass).toBe('struct');
    });
  });
});
