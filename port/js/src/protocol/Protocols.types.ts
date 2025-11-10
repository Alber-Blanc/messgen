import type { IName, NumberType, Field, BitsetBit } from '../types';

export interface RawStructType {
  type: string;
  type_class: 'struct'
  fields: Field[];
  hash: string;
}

export interface RawEnumType {
  type: string;
  type_class: 'enum';
  base_type: NumberType;
  values: EnumValue[];
  hash: string;
}

export interface RawBitsetType {
  type: string;
  type_class: 'bitset';
  base_type: NumberType;
  bits: BitsetBit[];
  hash: string;
}

export type RawType = RawStructType | RawEnumType | RawBitsetType;

interface EnumValue {
  name: IName;
  value: number;
}

export enum RawTypeClass {
  STRUCT = 'struct',
  ENUM = 'enum',
  BITSET = 'bitset',
}

export interface StructTypeClass {
  type_class: 'struct';
  comment?: string;
  fields: Field[] | null;
}

export interface EnumTypeClass {
  type_class: 'enum';
  comment?: string;
  base_type: NumberType;
  values: EnumValue[];
}

export type StructureType = StructTypeClass | EnumTypeClass;

export interface RawMessage {
  message_id: number;
  name: IName;
  type: string;
  hash: string;
}

export interface Protocol {
  name: string;
  proto_id: number;
  messages: Record<string, RawMessage>;
}

export type MessageMetadata = [protoName: string, message: RawMessage];
export type ProtocolMessageMap = Map<number, RawMessage>;
export type ProtocolRegistry = Map<number, ProtocolMessageMap>;
