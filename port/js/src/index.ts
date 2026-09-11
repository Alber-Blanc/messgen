import Decimal from 'decimal.js';

export { Decimal };
export { Buffer } from './Buffer';
export { Cursor } from './Cursor';
export type { BinaryInput } from './Cursor';
export { Codec } from './Codec';
export type { ProtocolMap, TypeMap, TypeByName, ExtractPayload } from './Codec.types';

export {
  Converter,
  ConverterFactory,
  ScalarConverter,
  ArrayConverter,
  TypedArrayConverter,
  MapConverter,
  EnumConverter,
  StructConverter,
  DecimalConverter,
  BitsetConverter,
  ExternalConverter,
} from './converters';
export type { GetType } from './converters';

export { TypeClass } from './types';
export type {
  IName,
  IValue,
  ProtocolId,
  MessageId,
  NumberType,
  DecimalType,
  BasicType,
  IType,
  Field,
  EnumValue,
  BitsetBit,
  ScalarTypeDefinition,
  DecimalTypeDefinition,
  TypedArrayTypeDefinition,
  ArrayTypeDefinition,
  MapTypeDefinition,
  StructTypeDefinition,
  EnumTypeDefinition,
  BitsetTypeDefinition,
  ExternalTypeDefinition,
  TypeDefinition,
} from './types';

export { Protocols, MessageInfo, RawTypeClass } from './protocol';
export type {
  RawStructType,
  RawEnumType,
  RawBitsetType,
  RawExternalType,
  RawType,
  StructTypeClass,
  EnumTypeClass,
  StructureType,
  RawMessage,
  Protocol,
  MessageMetadata,
  ProtocolMessageMap,
  ProtocolRegistry,
} from './protocol';
