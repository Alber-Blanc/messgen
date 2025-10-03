export * as Common from './common/types';
export * as Test from './test/types';

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
