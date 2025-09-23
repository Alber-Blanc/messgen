export type IName = string;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type IValue = any;
export type ProtocolId = number;
export type MessageId = number;

export type NumberType =
  | 'uint8'
  | 'int8'
  | 'uint16'
  | 'int16'
  | 'uint32'
  | 'int32'
  | 'uint64'
  | 'int64'
  | 'float32'
  | 'float64'
  | 'dec64';

export type DecimalType = 'dec64';

export type BasicType =
  NumberType |
  'string' |
  'bool' |
  'char' |
  'bytes';

type ArrayDynamicSize = '[]';
type ArrayFixSize = `[${number}]`;
type MapType = `{${BasicType}}`;

type SubType = ArrayDynamicSize | ArrayFixSize | MapType | '';

export type IType = `${IName | BasicType | DecimalType}${SubType}${SubType}${SubType}`;

export enum TypeClass {
  SCALAR = 'scalar',
  DECIMAL = 'decimal',
  TYPED_ARRAY = 'typed-array',
  ARRAY = 'array',
  MAP = 'map',
  STRUCT = 'struct',
  ENUM = 'enum',
  BITSET = 'bitset',
}

export interface Field {
  name: IName
  type: IType
}

export interface EnumValue {
  name: IName;
  value: number;
  comment?: string;
}

export type ScalarTypeDefinition = {
  type: BasicType;
  typeClass: TypeClass.SCALAR;
};

export type DecimalTypeDefinition = {
  type: DecimalType;
  typeClass: TypeClass.DECIMAL;
};

export type TypedArrayTypeDefinition = {
  type: IType;
  typeClass: TypeClass.TYPED_ARRAY;
  elementType: IType;
  arraySize?: number;
};

export type ArrayTypeDefinition = {
  type: IType;
  typeClass: TypeClass.ARRAY;
  elementType: IType;
  arraySize?: number;
  size?: number;
};

export type MapTypeDefinition = {
  type: IType;
  typeClass: TypeClass.MAP;
  keyType: IType;
  valueType: IType;
};

export type StructTypeDefinition = {
  typeClass: TypeClass.STRUCT;
  fields: Field[] | null;
  typeName: IName;
};

export type EnumTypeDefinition = {
  type: IType;
  typeClass: TypeClass.ENUM;
  values: EnumValue[];
  typeName: IName;
};

export type BitsetTypeDefinition = {
  type: IType;
  typeClass: TypeClass.BITSET;
  values: EnumValue[];
  typeName: IName;
};

export type TypeDefinition =
  | ScalarTypeDefinition
  | DecimalTypeDefinition
  | TypedArrayTypeDefinition
  | ArrayTypeDefinition
  | MapTypeDefinition
  | StructTypeDefinition
  | EnumTypeDefinition
  | BitsetTypeDefinition;
