import { type RawType, type Protocol, Protocols } from './protocol';
import { ConverterFactory } from './converters';
import type { ExtractPayload, ProtocolMap, TypeMap } from './Codec.types';
import { Buffer } from './Buffer';

export class Codec<Config extends object = object> {
  private protocolMap: ProtocolMap = new Map();
  private protocols = new Protocols();

  constructor(rawTypes: RawType[] = [], protocols: Protocol[] = []) {
    this.protocols.load(rawTypes);
    const converterFactory = new ConverterFactory(this.protocols);

    for (const { proto_id: protoId, messages } of protocols) {
      const typeMap: TypeMap = new Map();

      for (const message of Object.values(messages)) {
        const { message_id: messageId, type: typeName } = message;
        const converter = converterFactory.toConverter(typeName);

        typeMap.set(messageId, converter);
      }
      this.protocolMap.set(protoId, typeMap);
    }
  }

  public serialize<P extends keyof Config, T extends keyof Config[P]>(
    protocolId: P,
    messageId: T,
    data: ExtractPayload<Config, P, T>,
  ): Buffer {
    const types = this.protocolMap.get(Number(protocolId));
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

  public deserialize<P extends keyof Config, T extends keyof Config[P]>(
    protocolId: P,
    messageId: T,
    arrayBuffer: ArrayBufferLike,
  ): ExtractPayload<Config, P, T> {
    const types = this.protocolMap.get(protocolId as number);
    if (!types) {
      throw new Error(`Protocol not found with ID: ${protocolId as number}`);
    }

    const converter = types.get(messageId as number);
    if (!converter) {
      throw new Error(`Converter not found for message ID: ${messageId as number}`);
    }

    return converter.deserialize(new Buffer(arrayBuffer)) as ExtractPayload<Config, P, T>;
  }
}
