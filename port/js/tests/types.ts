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

export interface CrossProto {
  /** Some integer field */
  f0: bigint;
  /** Type from another protocol */
  cross0: MessgenTestSimpleEnum;
}

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

export interface MessgenTestComplexStruct {
  /** Some integer field */
  f0: bigint;
  /** Some integer field */
  f1: number;
  /** Some integer field */
  f2: bigint;
  s_arr: MessgenTestSimpleStruct[];
  /** Another integer field */
  f1_arr: BigInt64Array;
  v_arr: MessgenTestVarSizeStruct[];
  f2_vec: Float64Array;
  e_vec: MessgenTestSimpleEnum[];
  s_vec: MessgenTestSimpleStruct[];
  v_vec0: MessgenTestVarSizeStruct[][];
  v_vec1: MessgenTestVarSizeStruct[];
  v_vec2: Int16Array;
  str: string;
  bs: Uint8Array;
  str_vec: string[];
  map_str_by_int: Map<number, string>;
  map_vec_by_str: Map<string, Int32Array>;
}

export interface MessgenTestComplexStructNostl {
  /** Some integer field */
  f0: bigint;
  /** Some integer field */
  f1: number;
  /** Some integer field */
  f2: bigint;
  s_arr: MessgenTestSimpleStruct[];
  /** Another integer field */
  f1_arr: BigInt64Array;
  v_arr: MessgenTestVarSizeStruct[];
  f2_vec: Float64Array;
  e_vec: MessgenTestSimpleEnum[];
  s_vec: MessgenTestSimpleStruct[];
  v_vec0: MessgenTestVarSizeStruct[][];
  v_vec1: MessgenTestVarSizeStruct[];
  v_vec2: Int16Array;
  str: string;
  str_vec: string[];
}

export interface MessgenTestStructWithEnum {
  /** Some integer field */
  f0: bigint;
  /** Another integer field */
  f1: bigint;
  e0: MessgenTestSimpleEnum;
}

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

export interface MessgenTestVarSizeStruct {
  /** Some integer field */
  f0: bigint;
  /** Variable size field */
  f1_vec: BigInt64Array;
  str: string;
}

export interface MessgenTestComplexStructWithEmpty {
  e: MessgenTestEmptyStruct;
  dynamic_array: MessgenTestEmptyStruct[];
  static_array: MessgenTestEmptyStruct[];
  multi_array: MessgenTestEmptyStruct[][];
  map_empty_by_int: Map<number, MessgenTestEmptyStruct>;
  map_vec_by_str: Map<string, MessgenTestEmptyStruct[]>;
  array_of_size_zero: Int32Array;
}

export enum MessgenTestSimpleEnum {
  /** One example value */
  ONEVALUE = 0,
  /** Another example value */
  ANOTHERVALUE = 1,
}

export interface MessgenTestEmptyStruct {
}
