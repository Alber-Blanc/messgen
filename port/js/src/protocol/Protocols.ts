import { TypeClass } from '../types';
import type { BasicType, DecimalType, IName, IType, TypeDefinition } from '../types';
import { type RawType, RawTypeClass } from './Protocols.types';

export class Protocols {
  private static DECIMAL = 'dec64';
  private static SCALAR_TYPES_INFO = new Map<string, boolean>([
    ['int8', true],
    ['uint8', true],
    ['int16', true],
    ['uint16', true],
    ['int32', true],
    ['uint32', true],
    ['int64', true],
    ['uint64', true],
    ['float32', true],
    ['float64', true],
    ['char', false],
    ['string', false],
    ['bytes', false],
    ['bool', false],
  ]);

  private types = new Map<IName, TypeDefinition>();

  load(types: RawType[]): void {
    types.forEach((type) => {
      if (type.type_class === RawTypeClass.STRUCT) {
        this.types.set(type.type, {
          typeClass: TypeClass.STRUCT,
          fields: type.fields,
          typeName: type.type,
        });
      } else if (type.type_class === RawTypeClass.ENUM) {
        this.types.set(type.type, {
          typeClass: TypeClass.ENUM,
          type: type.base_type,
          typeName: type.type,
          values: type.values,
        });
      } else if (type.type_class === RawTypeClass.BITSET) {
        this.types.set(type.type, {
          typeClass: TypeClass.BITSET,
          type: type.base_type,
          typeName: type.type,
          bits: type.bits,
        });
      }
    });
  }

  getType(typeName: IType): TypeDefinition {
    if (Protocols.SCALAR_TYPES_INFO.has(typeName)) {
      return { type: typeName as BasicType, typeClass: TypeClass.SCALAR };
    }
    if (typeName === Protocols.DECIMAL) {
      return { type: typeName as DecimalType, typeClass: TypeClass.DECIMAL };
    }
    if (typeName.endsWith(']')) {
      return this.parseArrayType(typeName);
    }
    if (typeName.endsWith('}')) {
      return this.parseMapType(typeName);
    }
    return this.resolveType(typeName);
  }

  dependencies(typeName: IType): Set<string> {
    const typeDefinition = this.getType(typeName);
    const deps = new Set<string>();

    switch (typeDefinition.typeClass) {
      case TypeClass.SCALAR:
      case TypeClass.DECIMAL:
        break;

      case TypeClass.ARRAY:
      case TypeClass.TYPED_ARRAY:
        if (typeDefinition.elementType) {
          deps.add(typeDefinition.elementType);
        }
        break;

      case TypeClass.MAP:
        if (typeDefinition.keyType) {
          deps.add(typeDefinition.keyType);
        }
        if (typeDefinition.valueType) {
          deps.add(typeDefinition.valueType);
        }
        break;

      case TypeClass.STRUCT:
        if (typeDefinition.fields) {
          typeDefinition.fields.forEach((field) => {
            deps.add(field.type);
          });
        }
        break;

      case TypeClass.ENUM:
      case TypeClass.BITSET:
        break;

      default:
        break;
    }

    return deps;
  }

  private parseArrayType(typeName: string): TypeDefinition {
    const [elementType, size] = this.parseArray(typeName);

    const isTyped = Protocols.SCALAR_TYPES_INFO.get(elementType);
    return {
      type: typeName,
      typeClass: isTyped ? TypeClass.TYPED_ARRAY : TypeClass.ARRAY,
      elementType,
      arraySize: size,
    };
  }

  private parseMapType(typeName: string): TypeDefinition {
    const [keyType, valueType] = this.parseMap(typeName);
    return {
      type: typeName,
      typeClass: TypeClass.MAP,
      keyType,
      valueType,
    };
  }

  private parseArray(typeName: string): [string, number | undefined] {
    const parts = typeName.slice(0, -1).split('[');
    return [
      parts.slice(0, -1).join('['),
      parts[parts.length - 1] ? parseInt(parts[parts.length - 1], 10) : undefined,
    ];
  }

  private parseMap(typeName: string): [string, string] {
    const parts = typeName.slice(0, -1).split('{');
    return [parts[parts.length - 1], parts.slice(0, -1).join('{')];
  }

  private resolveType(typeName: string): TypeDefinition {
    const typeDefinition = this.types.get(typeName);
    if (!typeDefinition) {
      throw new Error(`Unknown type: ${typeName} not found`);
    }
    return typeDefinition;
  }
}
