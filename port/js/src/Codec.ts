import type { ProtocolRegistry } from './protocol';
import { type RawType, type Protocol, Protocols, MessageInfo } from './protocol';
import { ConverterFactory } from './converters';
import type { ProtocolMap, TypeMap, TypeByName } from './Codec.types';
import { Buffer } from './Buffer';

export class Codec<Types extends Record<string, unknown> = Record<string, unknown>> {
  private protocols = new Protocols();
  private protocolMap: ProtocolMap = new Map();
  private typesMap: TypeByName = new Map();
  private nameById: ProtocolRegistry = new Map();

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

        const typeSet = this.nameById.get(protoId) || new Map();
        typeSet.set(messageId, message);
        this.nameById.set(protoId, typeSet);
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

  public serializeType<T extends string>(typeName: T, data: Types[T]): Buffer {
    const converter = this.typesMap.get(typeName);
    if (!converter) {
      throw new Error(`Converter not found for type: ${typeName}`);
    }

    const buffer = new Buffer(new ArrayBuffer(converter.size(data)));
    converter.serialize(data, buffer);

    return buffer;
  }

  public deserializeType<T extends string = string>(typeName: T, arrayBuffer: ArrayBufferLike): Types[T] {
    const converter = this.typesMap.get(typeName);
    if (!converter) {
      throw new Error(`Converter not found for type: ${typeName}`);
    }

    return converter.deserialize(new Buffer(arrayBuffer));
  }

  public messageInfo(protoId: number, messageId: number): MessageInfo {
    const protoNameById = this.nameById.get(protoId);
    if (!protoNameById) {
      throw new Error(`Unsupported proto_id=${protoId}`);
    }

    const message = protoNameById.get(messageId);
    if (!message) {
      throw new Error(`Unsupported proto_id=${protoId} message_id=${messageId}`);
    }

    const typeHash = this.protocols.getTypeHash(message.type);
    return new MessageInfo(protoId, message, typeHash);
  }
}
