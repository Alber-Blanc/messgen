import type { SimpleEnum } from '../messgen/test';
/** Struct that uses types from another protocol Size: 9 */
export interface CrossProto {
  /** Some integer field */
  f0: bigint;
  /** Type from another protocol */
  cross0: SimpleEnum;
}
