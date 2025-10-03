import type { SimpleEnum } from '../test/types';
/** Struct that uses types from another protocol Size: 9 */
export interface CrossProto {
  /** Some integer field */
  f0: bigint;
  /** Type from another protocol */
  cross0: SimpleEnum;
}
/** Simple struct example Size: 41 */
export interface OneMoreMessage {
  /** Some integer field */
  f0: bigint;
  /** Another integer field */
  f1: bigint;
  f1_pad: number;
  f2: number;
  f3: number;
  f4: number;
  f5: number;
  f6: number;
  f7: number;
  f8: number;
}
