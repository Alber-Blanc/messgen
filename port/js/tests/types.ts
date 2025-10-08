import type * as CrossProto from './cross_proto';
import type * as MessgenTest from './messgen/test';
import type * as OneMoreMessage from './one_more_message';

export type TypeMap = CrossProto.TypeMap & MessgenTest.TypeMap & OneMoreMessage.TypeMap;
