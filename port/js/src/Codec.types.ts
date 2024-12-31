import type { Converter } from './converters/Converter';
import type { MessageId, ProtocolId } from './types';

export type ProtocolMap = Map<ProtocolId, Map<MessageId, Converter>>;
export type TypeMap = Map<MessageId, Converter>;

export type ExtractPayload<
  Schema extends object,
  Name extends keyof Schema,
  MessageType extends keyof Schema[Name],
> = Schema[Name][MessageType];
