import type * as MynamespaceProtoSubspaceAnotherProto from './mynamespace/proto/subspace/another_proto';
import type * as MynamespaceProtoTestProto from './mynamespace/proto/test_proto';

export type ProtocolMap = MynamespaceProtoSubspaceAnotherProto.Proto & MynamespaceProtoTestProto.Proto;
