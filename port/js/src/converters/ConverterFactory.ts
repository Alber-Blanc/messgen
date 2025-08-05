import { Protocols } from '../protocol/Protocols';
import { TypeClass } from '../types';
import {
  ScalarConverter,
  StructConverter,
  ArrayConverter,
  TypedArrayConverter,
  MapConverter,
  EnumConverter,
  DecimalConverter,
} from './base';
import type { Converter } from './Converter';

export class ConverterFactory {
  constructor(private protocols: Protocols = new Protocols()) {
  }

  toConverter(typeName: string): Converter {
    const typeDef = this.protocols.getType(typeName);
    const getType = this.toConverter.bind(this);

    switch (typeDef.typeClass) {
      case TypeClass.SCALAR:
        return new ScalarConverter(typeDef.type);
      case TypeClass.DECIMAL:
        return new DecimalConverter();
      case TypeClass.ENUM:
        return new EnumConverter(typeDef, getType);
      case TypeClass.STRUCT:
        return new StructConverter(typeDef, getType);
      case TypeClass.ARRAY:
        return new ArrayConverter(typeDef, getType);
      case TypeClass.TYPED_ARRAY:
        return new TypedArrayConverter(typeDef, getType);
      case TypeClass.MAP:
        return new MapConverter(typeDef, getType);
      default:
        throw new Error(`Unsupported type class ${typeName}`);
    }
  }
}

export type GetType = (typeName: string) => Converter;
