import type { CrossProto } from './types';
import type { MessgenTestComplexStruct } from './types';
import type { MessgenTestComplexStructNostl } from './types';
import type { MessgenTestComplexStructWithEmpty } from './types';
import type { MessgenTestEmptyStruct } from './types';
import type { MessgenTestFlatStruct } from './types';
import type { MessgenTestSimpleStruct } from './types';
import type { MessgenTestStructWithEnum } from './types';
import type { MessgenTestVarSizeStruct } from './types';

export enum Protocol {
  TEST_PROTO = 1,
  ANOTHER_PROTO = 2,
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
export interface TestProtoMap {
  [Protocol.TEST_PROTO]: {
    [TestProto.SIMPLE_STRUCT_MSG]: MessgenTestSimpleStruct;
    [TestProto.COMPLEX_STRUCT_MSG]: MessgenTestComplexStruct;
    [TestProto.VAR_SIZE_STRUCT_MSG]: MessgenTestVarSizeStruct;
    [TestProto.STRUCT_WITH_ENUM_MSG]: MessgenTestStructWithEnum;
    [TestProto.EMPTY_STRUCT_MSG]: MessgenTestEmptyStruct;
    [TestProto.COMPLEX_STRUCT_WITH_EMPTY_MSG]: MessgenTestComplexStructWithEmpty;
    [TestProto.COMPLEX_STRUCT_NOSTL_MSG]: MessgenTestComplexStructNostl;
    [TestProto.FLAT_STRUCT_MSG]: MessgenTestFlatStruct;
  };
}
export enum AnotherProto {
  CROSS_PROTO_MSG = 0,
}
export interface AnotherProtoMap {
  [Protocol.ANOTHER_PROTO]: {
    [AnotherProto.CROSS_PROTO_MSG]: CrossProto;
  };
}
export type Message = TestProto | AnotherProto;
export type ProtocolMap = TestProtoMap & AnotherProtoMap;
