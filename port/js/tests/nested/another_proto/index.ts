import type * as CrossProto from '../../cross_proto';

export enum Message {
  CROSS_PROTO_MSG = 0,
}

export const PROTO_ID = 2;

export interface Proto {
  [PROTO_ID]: {
    [Message.CROSS_PROTO_MSG]: CrossProto.CrossProto;
  }
}
