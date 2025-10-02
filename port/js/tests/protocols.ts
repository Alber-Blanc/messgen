import type { ComplexStruct } from './types';
import type { ComplexStructNostl } from './types';
import type { ComplexStructWithEmpty } from './types';
import type { CrossProto } from './types';
import type { EmptyStruct } from './types';
import type { FlatStruct } from './types';
import type { SimpleStruct } from './types';
import type { StructWithEnum } from './types';
import type { VarSizeStruct } from './types';

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
    [TestProto.SIMPLE_STRUCT_MSG]: SimpleStruct;
    [TestProto.COMPLEX_STRUCT_MSG]: ComplexStruct;
    [TestProto.VAR_SIZE_STRUCT_MSG]: VarSizeStruct;
    [TestProto.STRUCT_WITH_ENUM_MSG]: StructWithEnum;
    [TestProto.EMPTY_STRUCT_MSG]: EmptyStruct;
    [TestProto.COMPLEX_STRUCT_WITH_EMPTY_MSG]: ComplexStructWithEmpty;
    [TestProto.COMPLEX_STRUCT_NOSTL_MSG]: ComplexStructNostl;
    [TestProto.FLAT_STRUCT_MSG]: FlatStruct;
  };
}
export type Message = TestProto | AnotherProto;
export type ProtocolMap = TestProtoProtocolMap & AnotherProtoProtocolMap;
