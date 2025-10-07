import type * as CrossProto from './cross_proto';
import type * as MessgenTest from './messgen/test';
import type * as OneMoreMessage from './one_more_message';

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

export interface TypeMap {
  [TypeName.CROSS_PROTO]: CrossProto.CrossProto;
  [TypeName.MESSGEN_TEST_COMPLEX_STRUCT]: MessgenTest.ComplexStruct;
  [TypeName.MESSGEN_TEST_COMPLEX_STRUCT_NOSTL]: MessgenTest.ComplexStructNostl;
  [TypeName.MESSGEN_TEST_COMPLEX_STRUCT_WITH_EMPTY]: MessgenTest.ComplexStructWithEmpty;
  [TypeName.MESSGEN_TEST_EMPTY_STRUCT]: MessgenTest.EmptyStruct;
  [TypeName.MESSGEN_TEST_FLAT_STRUCT]: MessgenTest.FlatStruct;
  [TypeName.MESSGEN_TEST_NAME_CLASH_STRUCT]: MessgenTest.NameClashStruct;
  [TypeName.MESSGEN_TEST_SIMPLE_STRUCT]: MessgenTest.SimpleStruct;
  [TypeName.MESSGEN_TEST_STRUCT_WITH_ENUM]: MessgenTest.StructWithEnum;
  [TypeName.MESSGEN_TEST_VAR_SIZE_STRUCT]: MessgenTest.VarSizeStruct;
  [TypeName.ONE_MORE_MESSAGE]: OneMoreMessage.OneMoreMessage;
}
