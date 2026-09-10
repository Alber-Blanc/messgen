import type { RawMessage } from './Protocols.types';

export class MessageInfo {
  constructor(
    private protoId: number,
    private protocolName: string,
    private message: RawMessage,
    private typeHash: bigint,
  ) {
  }

  getProtoId(): number {
    return this.protoId;
  }

  protoName(): string {
    return this.protocolName;
  }

  messageId(): number {
    return this.message.message_id;
  }

  messageName(): string {
    return this.message.name;
  }

  messageHash(): bigint {
    return BigInt(this.message.hash) ^ this.typeHash;
  }
}
