import { TypeClass, type TypeDefinition } from '../types';

export class DependencyResolver {
  resolve(typeDefinition: TypeDefinition): Set<string> {
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
}
