/** Struct that uses types from another protocol Size: 9 */
export interface CrossProto {
  /** Some integer field */
  f0: bigint;
  /** Type from another protocol */
  cross0: TestSimpleEnum;
}
/** Simple struct example */
export interface TestComplexStruct {
  /** Some integer field */
  f0: bigint;
  /** Some integer field */
  f1: number;
  /** Some integer field */
  f2: bigint;
  /** Some bitset field */
  bits0: TestSimpleBitset;
  s_arr: TestSimpleStruct[];
  /** Another integer field */
  f1_arr: BigInt64Array;
  v_arr: TestVarSizeStruct[];
  f2_vec: Float64Array;
  e_vec: TestSimpleEnum[];
  s_vec: TestSimpleStruct[];
  v_vec0: TestVarSizeStruct[][];
  v_vec1: TestVarSizeStruct[][];
  v_vec2: Int16Array[][];
  str: string;
  bs: Uint8Array;
  str_vec: string[];
  map_str_by_int: Map<number, string>;
  map_vec_by_str: Map<string, Int32Array>;
}
/** Simple struct example */
export interface TestComplexStructNostl {
  /** Some integer field */
  f0: bigint;
  /** Some integer field */
  f1: number;
  /** Some integer field */
  f2: bigint;
  /** Some bitset field */
  bits0: TestSimpleBitset;
  s_arr: TestSimpleStruct[];
  /** Another integer field */
  f1_arr: BigInt64Array;
  v_arr: TestVarSizeStruct[];
  f2_vec: Float64Array;
  e_vec: TestSimpleEnum[];
  s_vec: TestSimpleStruct[];
  v_vec0: TestVarSizeStruct[][];
  v_vec1: TestVarSizeStruct[][];
  v_vec2: Int16Array[][];
  str: string;
  str_vec: string[];
}
/** Struct with empty_struct in its fields */
export interface TestComplexStructWithEmpty {
  e: TestEmptyStruct;
  dynamic_array: TestEmptyStruct[];
  static_array: TestEmptyStruct[];
  multi_array: TestEmptyStruct[][][];
  map_empty_by_int: Map<number, TestEmptyStruct>;
  map_vec_by_str: Map<string, TestEmptyStruct[]>;
  array_of_size_zero: Int32Array;
}
/** Struct without data. May be used for heartbeat, command with no args, etc Size: 0 */
export interface TestEmptyStruct {

}
/** Flat struct without paddings, for zero-copy Size: 40 */
export interface TestFlatStruct {
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
export interface TestNameClashStruct {
  /** Clashing name struct */
  name_clash_struct: bigint;
}
/** Simple struct example Size: 42 */
export interface TestSimpleStruct {
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
export interface TestStructWithEnum {
  /** Some integer field */
  f0: bigint;
  /** Another integer field */
  f1: bigint;
  e0: TestSimpleEnum;
}
/** Variable size struct example */
export interface TestVarSizeStruct {
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
export enum TestSimpleEnum {
  ONE_VALUE = 0,
  ANOTHER_VALUE = 1,
}
export enum TestSimpleBitset {
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
