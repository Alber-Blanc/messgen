import { type RawType, type Protocol, Protocols } from './protocol';
import { ConverterFactory } from './converters';
import type { ProtocolMap, TypeMap, TypeByName } from './Codec.types';
import { Buffer } from './Buffer';

export class Codec {
  private protocols = new Protocols();
  private protocolMap: ProtocolMap = new Map();
  private typesMap: TypeByName = new Map();

  constructor(rawTypes: RawType[] = [], protocols: Protocol[] = []) {
    this.protocols.load(rawTypes);
    const converterFactory = new ConverterFactory(this.protocols);

    rawTypes.forEach(({ type: typeName }) => {
      const converter = converterFactory.toConverter(typeName);
      this.typesMap.set(typeName, converter);
    });

    protocols.forEach(({ proto_id: protoId, messages }) => {
      const typeMap: TypeMap = new Map();

      for (const message of Object.values(messages)) {
        const { message_id: messageId, type: typeName } = message;
        const converter = converterFactory.toConverter(typeName);
        typeMap.set(messageId, converter);
      }
      this.protocolMap.set(protoId, typeMap);
    });
  }

  public serialize<T = unknown>(protocolId: number, messageId: number, data: T): Buffer {
    const types = this.protocolMap.get(Number(protocolId));
    if (!types) {
      throw new Error(`Protocol not found with ID: ${protocolId as number}`);
    }

    const converter = types.get(messageId as number);
    if (!converter) {
      throw new Error(`Converter not found for message Id ${messageId as number}`);
    }

    const buffer = new Buffer(new ArrayBuffer(converter.size(data)));
    converter.serialize(data, buffer);

    return buffer;
  }

  public deserialize<T = unknown>(protocolId: number, messageId: number, arrayBuffer: ArrayBufferLike): T {
    const types = this.protocolMap.get(protocolId as number);
    if (!types) {
      throw new Error(`Protocol not found with ID: ${protocolId as number}`);
    }

    const converter = types.get(messageId as number);
    if (!converter) {
      throw new Error(`Converter not found for message Id: ${messageId as number}`);
    }

    return converter.deserialize(new Buffer(arrayBuffer));
  }

  public deserializeType<T = unknown>(typeName: string, arrayBuffer: ArrayBufferLike): T {
    const converter = this.typesMap.get(typeName);
    if (!converter) {
      throw new Error(`Converter not found for type: ${typeName}`);
    }

    return converter.deserialize(new Buffer(arrayBuffer));
  }
}
