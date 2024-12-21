import type { IName, INumberType, Field } from '../types';

export interface RawStructType {
  type: string;
  type_class: '8'
  fields: Field[];
}

export interface RawEnumType {
  type: string;
  type_class: '7';
  base_type: INumberType;
  values: EnumValue[];
}

export type RawType = RawStructType | RawEnumType;

interface EnumValue {
  name: IName;
  value: number;
}

export enum TypeClass {
  STRUCT = '8',
  ENUM = '7',
}

export interface StructTypeClass {
  type_class: 'struct';
  comment?: string;
  fields: Field[] | null;
}

export interface EnumTypeClass {
  type_class: 'enum';
  comment?: string;
  base_type: INumberType;
  values: EnumValue[];
}

export type StructureType = StructTypeClass | EnumTypeClass;

export interface RawMessage {
  message_id: number;
  name: IName;
  type: string;
}

export interface Protocol {
  name: string;
  proto_id: number;
  messages: Record<string, RawMessage>;
}
