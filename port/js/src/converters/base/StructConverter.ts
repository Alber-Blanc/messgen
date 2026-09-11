import { ErrorUtils } from '../../error/Error.utils';
import type { Cursor } from '../../Cursor';
import type { StructTypeDefinition } from '../../types';
import { Converter } from '../Converter';
import type { GetType } from '../ConverterFactory';

type StructValue = Record<string, unknown>;
type StructField = { converter: Converter; name: string };

export class StructConverter extends Converter<StructValue> {
  convertorsList: StructField[];
  private static RESERVED_WORDS = new Set(Object.getOwnPropertyNames(Object.prototype));

  constructor(typeDef: StructTypeDefinition, getType: GetType) {
    super(typeDef.typeName);
    const fieldsSet = new Set<string>();

    this.convertorsList = (typeDef.fields ?? []).map((field) => {
      if (fieldsSet.has(field.name)) {
        throw new Error(`Field ${field.name} is duplicated in ${this.name}`);
      }
      fieldsSet.add(field.name);

      if (StructConverter.RESERVED_WORDS.has(field.name)) {
        throw new Error(`Field ${field.name} is a reserved word in JavaScript`);
      }

      const converter = getType(field.type);
      return { converter, name: field.name };
    });
  }

  /** @deprecated Use createDefault(); defaults are no longer shared. */
  get parentObject(): StructValue {
    return this.createDefault();
  }

  serialize(value: StructValue, cursor: Cursor): void {
    for (const { converter, name } of this.convertorsList) {
      const data = value[name];
      if (data === null || data === undefined) {
        throw new Error(`Field ${name} is not found in ${this.name}`);
      }

      try {
        converter.serialize(data, cursor);
      } catch (e) {
        throw ErrorUtils.withCause(`Failed to serialize field="${name}" value="${data}" in struct="${this.name}"`, e);
      }
    }
  }

  deserialize(cursor: Cursor): StructValue {
    const value: StructValue = {};
    for (const { converter, name } of this.convertorsList) {
      try {
        value[name] = converter.deserialize(cursor);
      } catch (e) {
        throw ErrorUtils.withCause(`Failed to deserialize field="${name}" in struct="${this.name}"`, e);
      }
    }
    return value;
  }

  size(value: StructValue): number {
    let size = 0;
    for (const { converter, name } of this.convertorsList) {
      const data = value[name];
      if (data === null || data === undefined) {
        throw new Error(`Field ${name} is not found in ${this.name}`);
      }
      size += converter.size(data);
    }
    return size;
  }

  createDefault(): StructValue {
    return Object.fromEntries(this.convertorsList.map(({ name, converter }) => [name, converter.createDefault()]));
  }
}
