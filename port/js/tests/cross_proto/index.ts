import type { SimpleEnum } from '../messgen/test';

/** Struct that uses types from another protocol Size: 9 */
export interface CrossProto {
  /** Some integer field */
  f0: bigint;
  /** Type from another protocol */
  cross0: SimpleEnum;
}
export enum Types {
  CROSS_PROTO = 'cross_proto',
}

export type TypeMap = {
  [Types.CROSS_PROTO]: CrossProto;
};
