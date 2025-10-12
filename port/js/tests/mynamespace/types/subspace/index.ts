import type { EmptyStruct, SimpleBitset, SimpleEnum, SimpleStruct, VarSizeStruct } from '../';

/** Simple struct example */
export interface ComplexStruct {
  /** Some integer field */
  f0: bigint;
  /** Some integer field */
  f1: number;
  /** Some integer field */
  f2: bigint;
  /** Some bitset field */
  bits0: SimpleBitset;
  s_arr: SimpleStruct[];
  /** Another integer field */
  f1_arr: BigInt64Array;
  v_arr: VarSizeStruct[];
  f2_vec: Float64Array;
  e_vec: SimpleEnum[];
  s_vec: SimpleStruct[];
  v_vec0: VarSizeStruct[][];
  v_vec1: VarSizeStruct[][];
  v_vec2: Int16Array[][];
  str: string;
  bs: Uint8Array;
  str_vec: string[];
  map_str_by_int: Map<number, string>;
  map_vec_by_str: Map<string, Int32Array>;
}
/** Simple struct example */
export interface ComplexStructCustomAlloc {
  /** Some integer field */
  f0: bigint;
  /** Some integer field */
  f1: number;
  /** Some integer field */
  f2: bigint;
  /** Some bitset field */
  bits0: SimpleBitset;
  s_arr: SimpleStruct[];
  /** Another integer field */
  f1_arr: BigInt64Array;
  v_arr: VarSizeStruct[];
  f2_vec: Float64Array;
  e_vec: SimpleEnum[];
  s_vec: SimpleStruct[];
  v_vec0: VarSizeStruct[][];
  v_vec1: VarSizeStruct[][];
  v_vec2: Int16Array[][];
  str: string;
  str_vec: string[];
}
/** Struct with empty_struct in its fields */
export interface ComplexStructWithEmpty {
  e: EmptyStruct;
  dynamic_array: EmptyStruct[];
  static_array: EmptyStruct[];
  multi_array: EmptyStruct[][][];
  map_empty_by_int: Map<number, EmptyStruct>;
  map_vec_by_str: Map<string, EmptyStruct[]>;
  array_of_size_zero: Int32Array;
}
export enum Types {
  COMPLEX_STRUCT = 'mynamespace/types/subspace/complex_struct',
  COMPLEX_STRUCT_CUSTOM_ALLOC = 'mynamespace/types/subspace/complex_struct_custom_alloc',
  COMPLEX_STRUCT_WITH_EMPTY = 'mynamespace/types/subspace/complex_struct_with_empty',
}

export type TypeMap = {
  [Types.COMPLEX_STRUCT]: ComplexStruct;
  [Types.COMPLEX_STRUCT_CUSTOM_ALLOC]: ComplexStructCustomAlloc;
  [Types.COMPLEX_STRUCT_WITH_EMPTY]: ComplexStructWithEmpty;
};
