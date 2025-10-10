export enum AnotherSimpleBitset {
  THREE = (1 << 3),
  FOUR = (1 << 4),
  ERROR = (1 << 5),
}
/** Struct without data. May be used for heartbeat, command with no args, etc Size: 0 */
export interface EmptyStruct {
}
/** Flat struct without paddings, for zero-copy Size: 40 */
export interface FlatStruct {
  /** Some integer field */
  f0: bigint;
  /** Another integer field */
  f1: bigint;
  f2: number;
  f3: number;
  f4: number;
  f5: number;
  f6: number;
  f7: number;
  f8: number;
}
/** A struct with field name clashing with type name Size: 8 */
export interface NameClashStruct {
  /** Clashing name struct */
  name_clash_struct: bigint;
}
export enum SimpleBitset {
  ONE = (1 << 0),
  TWO = (1 << 1),
  ERROR = (1 << 2),
}
export enum SimpleEnum {
  ONE_VALUE = 0,
  ANOTHER_VALUE = 1,
}
/** Simple struct example Size: 42 */
export interface SimpleStruct {
  /** Some integer field */
  f0: bigint;
  /** Another integer field */
  f1: bigint;
  f1_pad: number;
  f2: number;
  f3: number;
  f4: number;
  f5: number;
  f6: number;
  f7: number;
  f8: number;
  f9: boolean;
}
/** Struct with enum example Size: 17 */
export interface StructWithEnum {
  /** Some integer field */
  f0: bigint;
  /** Another integer field */
  f1: bigint;
  e0: SimpleEnum;
}
/** Variable size struct example */
export interface VarSizeStruct {
  /** Some integer field */
  f0: bigint;
  /** Variable size field */
  f1_vec: BigInt64Array;
  str: string;
}
export enum Types {
  EMPTY_STRUCT = 'mynamespace/types/empty_struct',
  FLAT_STRUCT = 'mynamespace/types/flat_struct',
  NAME_CLASH_STRUCT = 'mynamespace/types/name_clash_struct',
  SIMPLE_STRUCT = 'mynamespace/types/simple_struct',
  STRUCT_WITH_ENUM = 'mynamespace/types/struct_with_enum',
  VAR_SIZE_STRUCT = 'mynamespace/types/var_size_struct',
}

export type TypeMap = {
  [Types.EMPTY_STRUCT]: EmptyStruct;
  [Types.FLAT_STRUCT]: FlatStruct;
  [Types.NAME_CLASH_STRUCT]: NameClashStruct;
  [Types.SIMPLE_STRUCT]: SimpleStruct;
  [Types.STRUCT_WITH_ENUM]: StructWithEnum;
  [Types.VAR_SIZE_STRUCT]: VarSizeStruct;
};
