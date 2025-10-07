import type * as NestedAnotherProto from './nested/another_proto';
import type * as TestProto from './test_proto';

export type ProtocolMap = NestedAnotherProto.Proto & TestProto.Proto;
