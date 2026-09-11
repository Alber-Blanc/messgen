import { type RawType, type Protocol, Protocols, MessageInfo } from './protocol';
import { type Converter, ConverterFactory } from './converters';
import type { RawMessage } from './protocol';
import type { BinaryInput, DeserializeOptions } from './Cursor';
import { Buffer } from './Buffer';

interface RegisteredMessage {
  converter: Converter;
  definition: RawMessage;
}

interface RegisteredProtocol {
  name: string;
  messages: Map<number, RegisteredMessage>;
}

export class Codec<Types extends Record<string, unknown> = Record<string, unknown>> {
  private protocols = new Protocols();
  private protocolMap = new Map<number, RegisteredProtocol>();
  private typesMap = new Map<string, Converter>();

  constructor(rawTypes: RawType[] = [], protocols: Protocol[] = []) {
    this.protocols.load(rawTypes);
    const factory = new ConverterFactory(this.protocols);

    for (const { type } of rawTypes) {
      this.typesMap.set(type, factory.toConverter(type));
    }

    for (const { proto_id: protoId, name, messages } of protocols) {
      const registered: RegisteredProtocol = { name, messages: new Map() };
      for (const message of Object.values(messages)) {
        registered.messages.set(message.message_id, {
          converter: factory.toConverter(message.type),
          definition: message,
        });
      }
      this.protocolMap.set(protoId, registered);
    }
  }

  getTypeConverter<Name extends keyof Types & string>(typeName: Name): Converter<Types[Name]> {
    const converter = this.typesMap.get(typeName);
    if (!converter) {
      throw new Error(`Converter not found for type: ${typeName}`);
    }
    return converter as Converter<Types[Name]>;
  }

  serialize<T = unknown>(protocolId: number, messageId: number, data: T): Buffer {
    return this.encode(this.getMessage(Number(protocolId), messageId).converter, data);
  }

  deserialize<T = unknown>(protocolId: number, messageId: number, input: BinaryInput, options?: DeserializeOptions): T {
    return this.getMessage(protocolId, messageId).converter.deserialize(new Buffer(input, options)) as T;
  }

  serializeType<Name extends keyof Types & string>(typeName: Name, data: Types[Name]): Buffer {
    return this.encode(this.getTypeConverter(typeName), data);
  }

  deserializeType<Name extends keyof Types & string = keyof Types & string>(
    typeName: Name,
    input: BinaryInput,
    options?: DeserializeOptions,
  ): Types[Name] {
    return this.getTypeConverter(typeName).deserialize(new Buffer(input, options));
  }

  messageInfo(protoId: number, messageId: number): MessageInfo {
    const protocol = this.protocolMap.get(protoId);
    if (!protocol) {
      throw new Error(`Unsupported proto_id=${protoId}`);
    }
    const message = protocol.messages.get(messageId)?.definition;
    if (!message) {
      throw new Error(`Unsupported proto_id=${protoId} message_id=${messageId}`);
    }
    return new MessageInfo(protoId, protocol.name, message, this.protocols.getTypeHash(message.type));
  }

  private getMessage(protocolId: number, messageId: number): RegisteredMessage {
    const protocol = this.protocolMap.get(protocolId);
    if (!protocol) {
      throw new Error(`Protocol not found with ID: ${protocolId}`);
    }
    const message = protocol.messages.get(messageId);
    if (!message) {
      throw new Error(`Converter not found for message Id: ${messageId}`);
    }
    return message;
  }

  private encode(converter: Converter, data: unknown): Buffer {
    const buffer = new Buffer(new ArrayBuffer(converter.size(data)));
    converter.serialize(data, buffer);
    return buffer;
  }
}
