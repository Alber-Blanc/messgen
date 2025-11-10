import type { RawMessage } from './Protocols.types';

export class MessageInfo {
  constructor(
    private protoId: number,
    private message: RawMessage,
    private typeHash: bigint,
  ) {
  }

  getProtoId(): number {
    return this.protoId;
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
