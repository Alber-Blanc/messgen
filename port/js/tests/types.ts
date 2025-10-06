/** Struct that uses types from another protocol Size: 9 */
export interface CrossProto {
  /** Some integer field */
  f0: bigint;
  /** Type from another protocol */
  cross0: MessgenTestSimpleEnum;
}
/** Simple struct example */
export interface MessgenTestComplexStruct {
  /** Some integer field */
  f0: bigint;
  /** Some integer field */
  f1: number;
  /** Some integer field */
  f2: bigint;
  /** Some bitset field */
  bits0: MessgenTestSimpleBitset;
  s_arr: MessgenTestSimpleStruct[];
  /** Another integer field */
  f1_arr: BigInt64Array;
  v_arr: MessgenTestVarSizeStruct[];
  f2_vec: Float64Array;
  e_vec: MessgenTestSimpleEnum[];
  s_vec: MessgenTestSimpleStruct[];
  v_vec0: MessgenTestVarSizeStruct[][];
  v_vec1: MessgenTestVarSizeStruct[][];
  v_vec2: Int16Array[][];
  str: string;
  bs: Uint8Array;
  str_vec: string[];
  map_str_by_int: Map<number, string>;
  map_vec_by_str: Map<string, Int32Array>;
}
/** Simple struct example */
export interface MessgenTestComplexStructNostl {
  /** Some integer field */
  f0: bigint;
  /** Some integer field */
  f1: number;
  /** Some integer field */
  f2: bigint;
  /** Some bitset field */
  bits0: MessgenTestSimpleBitset;
  s_arr: MessgenTestSimpleStruct[];
  /** Another integer field */
  f1_arr: BigInt64Array;
  v_arr: MessgenTestVarSizeStruct[];
  f2_vec: Float64Array;
  e_vec: MessgenTestSimpleEnum[];
  s_vec: MessgenTestSimpleStruct[];
  v_vec0: MessgenTestVarSizeStruct[][];
  v_vec1: MessgenTestVarSizeStruct[][];
  v_vec2: Int16Array[][];
  str: string;
  str_vec: string[];
}
/** Struct with empty_struct in its fields */
export interface MessgenTestComplexStructWithEmpty {
  e: MessgenTestEmptyStruct;
  dynamic_array: MessgenTestEmptyStruct[];
  static_array: MessgenTestEmptyStruct[];
  multi_array: MessgenTestEmptyStruct[][][];
  map_empty_by_int: Map<number, MessgenTestEmptyStruct>;
  map_vec_by_str: Map<string, MessgenTestEmptyStruct[]>;
  array_of_size_zero: Int32Array;
}
/** Struct without data. May be used for heartbeat, command with no args, etc Size: 0 */
export interface MessgenTestEmptyStruct {

}
/** Flat struct without paddings, for zero-copy Size: 40 */
export interface MessgenTestFlatStruct {
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
export interface MessgenTestNameClashStruct {
  /** Clashing name struct */
  name_clash_struct: bigint;
}
/** Simple struct example Size: 42 */
export interface MessgenTestSimpleStruct {
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
export interface MessgenTestStructWithEnum {
  /** Some integer field */
  f0: bigint;
  /** Another integer field */
  f1: bigint;
  e0: MessgenTestSimpleEnum;
}
/** Variable size struct example */
export interface MessgenTestVarSizeStruct {
  /** Some integer field */
  f0: bigint;
  /** Variable size field */
  f1_vec: BigInt64Array;
  str: string;
}
/** Simple struct example Size: 41 */
export interface OneMoreMessage {
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
}
export enum MessgenTestSimpleEnum {
  ONE_VALUE = 0,
  ANOTHER_VALUE = 1,
}
export enum MessgenTestSimpleBitset {
  ONE = (1 << 0),
  TWO = (1 << 1),
  ERROR = (1 << 2),
}
export enum TypeName {
  CROSS_PROTO = 'cross_proto',
  MESSGEN_TEST_COMPLEX_STRUCT = 'messgen/test/complex_struct',
  MESSGEN_TEST_COMPLEX_STRUCT_NOSTL = 'messgen/test/complex_struct_nostl',
  MESSGEN_TEST_COMPLEX_STRUCT_WITH_EMPTY = 'messgen/test/complex_struct_with_empty',
  MESSGEN_TEST_EMPTY_STRUCT = 'messgen/test/empty_struct',
  MESSGEN_TEST_FLAT_STRUCT = 'messgen/test/flat_struct',
  MESSGEN_TEST_NAME_CLASH_STRUCT = 'messgen/test/name_clash_struct',
  MESSGEN_TEST_SIMPLE_STRUCT = 'messgen/test/simple_struct',
  MESSGEN_TEST_STRUCT_WITH_ENUM = 'messgen/test/struct_with_enum',
  MESSGEN_TEST_VAR_SIZE_STRUCT = 'messgen/test/var_size_struct',
  ONE_MORE_MESSAGE = 'one_more_message',
}
