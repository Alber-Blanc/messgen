// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Converter } from './converters/Converter';
import type { MessageId, ProtocolId, ProtocolName } from './types';

export type TypeToNameMap = Map<ProtocolName, Map<string, Converter>>;
export type TypeToIdMap = Map<ProtocolId, Map<MessageId, Converter>>;

export type ExtractPayload<
  Schema extends object,
  Name extends keyof Schema,
  MessageType extends keyof Schema[Name],
> = Schema[Name][MessageType];
