import type * as MynamespaceTypes from '../../types';
import type * as MynamespaceTypesSubspace from '../../types/subspace';

export enum Message {
  SIMPLE_STRUCT_MSG = 0,
  COMPLEX_STRUCT_MSG = 1,
  VAR_SIZE_STRUCT_MSG = 2,
  STRUCT_WITH_ENUM_MSG = 3,
  EMPTY_STRUCT_MSG = 4,
  COMPLEX_STRUCT_WITH_EMPTY_MSG = 5,
  COMPLEX_STRUCT_NOSTL_MSG = 6,
  FLAT_STRUCT_MSG = 9,
}

export const PROTO_ID = 1;

export interface Proto {
  [PROTO_ID]: {
    [Message.SIMPLE_STRUCT_MSG]: MynamespaceTypes.SimpleStruct;
    [Message.COMPLEX_STRUCT_MSG]: MynamespaceTypesSubspace.ComplexStruct;
    [Message.VAR_SIZE_STRUCT_MSG]: MynamespaceTypes.VarSizeStruct;
    [Message.STRUCT_WITH_ENUM_MSG]: MynamespaceTypes.StructWithEnum;
    [Message.EMPTY_STRUCT_MSG]: MynamespaceTypes.EmptyStruct;
    [Message.COMPLEX_STRUCT_WITH_EMPTY_MSG]: MynamespaceTypesSubspace.ComplexStructWithEmpty;
    [Message.COMPLEX_STRUCT_NOSTL_MSG]: MynamespaceTypesSubspace.ComplexStructNostl;
    [Message.FLAT_STRUCT_MSG]: MynamespaceTypes.FlatStruct;
  }
}
