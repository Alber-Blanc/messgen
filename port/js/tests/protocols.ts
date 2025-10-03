import type { CrossProto } from './types';
import type { TestComplexStruct } from './types';
import type { TestComplexStructNostl } from './types';
import type { TestComplexStructWithEmpty } from './types';
import type { TestEmptyStruct } from './types';
import type { TestFlatStruct } from './types';
import type { TestSimpleStruct } from './types';
import type { TestStructWithEnum } from './types';
import type { TestVarSizeStruct } from './types';

export enum Protocol {
  TEST_PROTO = 1,
  ANOTHER_PROTO = 2,
}
export enum AnotherProto {
  CROSS_PROTO_MSG = 0,
}
export interface AnotherProtoProtocolMap {
  [Protocol.ANOTHER_PROTO]: {
    [AnotherProto.CROSS_PROTO_MSG]: CrossProto;
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
  [Protocol.TEST_PROTO]: {
    [TestProto.SIMPLE_STRUCT_MSG]: TestSimpleStruct;
    [TestProto.COMPLEX_STRUCT_MSG]: TestComplexStruct;
    [TestProto.VAR_SIZE_STRUCT_MSG]: TestVarSizeStruct;
    [TestProto.STRUCT_WITH_ENUM_MSG]: TestStructWithEnum;
    [TestProto.EMPTY_STRUCT_MSG]: TestEmptyStruct;
    [TestProto.COMPLEX_STRUCT_WITH_EMPTY_MSG]: TestComplexStructWithEmpty;
    [TestProto.COMPLEX_STRUCT_NOSTL_MSG]: TestComplexStructNostl;
    [TestProto.FLAT_STRUCT_MSG]: TestFlatStruct;
  };
}
export type Message = TestProto | AnotherProto;
export type ProtocolMap = TestProtoProtocolMap & AnotherProtoProtocolMap;
