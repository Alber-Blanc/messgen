import type * as AnotherProtoTypes from './common/types';
import type * as TestProtoTypes from './test/types';

export enum AnotherProto {
  CROSS_PROTO_MSG = 0,
}
export interface AnotherProtoProtocolMap {
  [2]: {
    [AnotherProto.CROSS_PROTO_MSG]: AnotherProtoTypes.CrossProto;
  };
}

export enum TestProto {
  SIMPLE_STRUCT_MSG = 0,
  COMPLEX_STRUCT_MSG = 1,
  VAR_SIZE_STRUCT_MSG = 2,
  STRUCT_WITH_ENUM_MSG = 3,
  EMPTY_STRUCT_MSG = 4,
  COMPLEX_STRUCT_WITH_EMPTY_MSG = 5,
  COMPLEX_STRUCT_NOSTL_MSG = 6,
  FLAT_STRUCT_MSG = 7,
}
export interface TestProtoProtocolMap {
  [1]: {
    [TestProto.SIMPLE_STRUCT_MSG]: TestProtoTypes.SimpleStruct;
    [TestProto.COMPLEX_STRUCT_MSG]: TestProtoTypes.ComplexStruct;
    [TestProto.VAR_SIZE_STRUCT_MSG]: TestProtoTypes.VarSizeStruct;
    [TestProto.STRUCT_WITH_ENUM_MSG]: TestProtoTypes.StructWithEnum;
    [TestProto.EMPTY_STRUCT_MSG]: TestProtoTypes.EmptyStruct;
    [TestProto.COMPLEX_STRUCT_WITH_EMPTY_MSG]: TestProtoTypes.ComplexStructWithEmpty;
    [TestProto.COMPLEX_STRUCT_NOSTL_MSG]: TestProtoTypes.ComplexStructNostl;
    [TestProto.FLAT_STRUCT_MSG]: TestProtoTypes.FlatStruct;
  };
}
export enum Protocol {
  ANOTHER_PROTO = 2,
  TEST_PROTO = 1,
}
export type Message = AnotherProto | TestProto;
export type ProtocolMap = AnotherProtoProtocolMap & TestProtoProtocolMap;
