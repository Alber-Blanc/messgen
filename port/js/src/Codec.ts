import { type RawType, type Protocol, Protocols } from './protocol';
import { type Converter, ConverterFactory } from './converters';
import type { ExtractPayload, TypeToIdMap } from './Codec.types';
import { Buffer } from './Buffer';
import type { ProtocolId, MessageId } from './types';

export class Codec<Config extends object = object> {
  private typesById: TypeToIdMap = new Map();
  private protocols = new Protocols();

  constructor(rawTypes: RawType[] = [], protocols: Protocol[] = []) {
    this.protocols.load(rawTypes);
    const converterFactory = new ConverterFactory(this.protocols);

    for (const { proto_id: protoId, messages } of protocols) {
      const idMap = new Map<MessageId, Converter>();

      for (const message of Object.values(messages)) {
        const { message_id: messageId, type: typeName } = message;
        const converter = converterFactory.toConverter(typeName);

        idMap.set(messageId, converter);
      }
      this.typesById.set(protoId, idMap);
    }
  }

  public serialize<N extends keyof Config, T extends keyof Config[N]>(
    protocolId: N,
    messageId: T,
    data: ExtractPayload<Config, N, T>,
  ): Buffer {
    const types = this.typesById.get(Number(protocolId));
    if (!types) {
      throw new Error(`Protocol not found with ID: ${protocolId as number}`);
    }

    const converter = types.get(messageId as number);
    if (!converter) {
      throw new Error(`Converter not found for message ID: ${messageId as number}`);
    }

    const buffer = new Buffer(new ArrayBuffer(converter.size(data)));
    converter.serialize(data, buffer);

    return buffer;
  }

  public deserialize<N extends keyof Config, T extends keyof Config[N]>(
    protocolId: ProtocolId,
    messageId: MessageId,
    arrayBuffer: ArrayBufferLike,
  ): ExtractPayload<Config, N, T> {
    const types = this.typesById.get(protocolId);
    if (!types) {
      throw new Error(`Protocol not found with ID: ${protocolId}`);
    }

    const converter = types.get(messageId);
    if (!converter) {
      throw new Error(`Converter not found for message ID: ${messageId}`);
    }

    return converter.deserialize(new Buffer(arrayBuffer)) as ExtractPayload<Config, N, T>;
  }
}
