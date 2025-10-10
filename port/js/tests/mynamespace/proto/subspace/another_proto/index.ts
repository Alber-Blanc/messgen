import type * as MynamespaceTypes from '../../../types';

export enum Message {
  SIMPLE_STRUCT_MSG = 0,
}

export const PROTO_ID = 2;

export interface Proto {
  [PROTO_ID]: {
    [Message.SIMPLE_STRUCT_MSG]: MynamespaceTypes.SimpleStruct;
  }
}
