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
export enum Types {
  ONE_MORE_MESSAGE = 'one_more_message',
}

export type TypeMap = {
  [Types.ONE_MORE_MESSAGE]: OneMoreMessage;
};
