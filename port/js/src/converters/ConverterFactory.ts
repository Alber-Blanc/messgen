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
  BitsetConverter,
  ExternalConverter,
} from './base';
import type { Converter } from './Converter';

export class ConverterFactory {
  private readonly converters = new Map<string, Converter>();
  private readonly resolving = new Set<string>();
  private readonly getType: GetType = (typeName) => this.toConverter(typeName);
  private version = -1;

  constructor(private readonly protocols: Protocols = new Protocols()) {}

  toConverter(typeName: string): Converter {
    if (this.version !== this.protocols.version) {
      this.converters.clear();
      this.version = this.protocols.version;
    }

    const cached = this.converters.get(typeName);
    if (cached) {
      return cached;
    }
    if (this.resolving.has(typeName)) {
      throw new Error(`Circular type dependency: ${typeName}`);
    }

    this.resolving.add(typeName);
    try {
      const converter = this.createConverter(typeName);
      this.converters.set(typeName, converter);
      return converter;
    } finally {
      this.resolving.delete(typeName);
    }
  }

  private createConverter(typeName: string): Converter {
    const typeDef = this.protocols.getType(typeName);
    switch (typeDef.typeClass) {
      case TypeClass.SCALAR:
        return new ScalarConverter(typeDef.type);
      case TypeClass.DECIMAL:
        return new DecimalConverter();
      case TypeClass.ENUM:
        return new EnumConverter(typeDef, this.getType);
      case TypeClass.BITSET:
        return new BitsetConverter(typeDef, this.getType);
      case TypeClass.STRUCT:
        return new StructConverter(typeDef, this.getType);
      case TypeClass.ARRAY:
        return new ArrayConverter(typeDef, this.getType);
      case TypeClass.TYPED_ARRAY:
        return new TypedArrayConverter(typeDef, this.getType);
      case TypeClass.MAP:
        return new MapConverter(typeDef, this.getType);
      case TypeClass.EXTERNAL:
        return new ExternalConverter(typeDef);
      default:
        throw new Error(`Unsupported type class ${typeName}`);
    }
  }
}

export type GetType = (typeName: string) => Converter;
