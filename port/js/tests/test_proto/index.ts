import type * as MessgenTest from '../messgen/test';

export enum Message {
  SIMPLE_STRUCT_MSG = 0,
  COMPLEX_STRUCT_MSG = 1,
  VAR_SIZE_STRUCT_MSG = 2,
  STRUCT_WITH_ENUM_MSG = 3,
  EMPTY_STRUCT_MSG = 4,
  COMPLEX_STRUCT_WITH_EMPTY_MSG = 5,
  COMPLEX_STRUCT_NOSTL_MSG = 6,
  FLAT_STRUCT_MSG = 7,
}

export const PROTO_ID = 1;

export interface Proto {
  [PROTO_ID]: {
    [Message.SIMPLE_STRUCT_MSG]: MessgenTest.SimpleStruct;
    [Message.COMPLEX_STRUCT_MSG]: MessgenTest.ComplexStruct;
    [Message.VAR_SIZE_STRUCT_MSG]: MessgenTest.VarSizeStruct;
    [Message.STRUCT_WITH_ENUM_MSG]: MessgenTest.StructWithEnum;
    [Message.EMPTY_STRUCT_MSG]: MessgenTest.EmptyStruct;
    [Message.COMPLEX_STRUCT_WITH_EMPTY_MSG]: MessgenTest.ComplexStructWithEmpty;
    [Message.COMPLEX_STRUCT_NOSTL_MSG]: MessgenTest.ComplexStructNostl;
    [Message.FLAT_STRUCT_MSG]: MessgenTest.FlatStruct;
  };
}
