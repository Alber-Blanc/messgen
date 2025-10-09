import { ErrorUtils } from '../../error/Error.utils';
import type { Buffer } from '../../Buffer';
import type { IName, IValue, StructTypeDefinition } from '../../types';
import { Converter } from '../Converter';
import type { GetType } from '../ConverterFactory';

export class StructConverter extends Converter {
  convertorsList: { converter: Converter, name: string }[] = [];
  private static RESERVED_WORDS: Set<string> = new Set(Object.getOwnPropertyNames(Object.prototype));
  parentObject: Record<IName, IValue>;

  constructor(typeDef: StructTypeDefinition, getType: GetType) {
    super(typeDef.typeName);
    const fieldsSet = new Set<string>();

    typeDef.fields?.forEach((field) => {
      if (fieldsSet.has(field.name)) {
        throw new Error(`Field ${field.name} is duplicated in ${this.name}`);
      }
      fieldsSet.add(field.name);

      if (StructConverter.RESERVED_WORDS.has(field.name)) {
        throw new Error(`Field ${field.name} is a reserved word in JavaScript`);
      }

      const converter = getType(field.type);
      if (!converter) {
        throw new Error(`Converter for type ${field.type} is not found in ${this.name}`);
      }

      this.convertorsList.push({ converter, name: field.name });
    });

    this.parentObject = Object.fromEntries(
      this.convertorsList.map(({ name, converter }) => [name, converter.default()]),
    );
  }

  serialize(value: IValue, buffer: Buffer) {
    this.convertorsList.forEach(({ converter, name }) => {
      const data = value[name];
      if (data === null || data === undefined) {
        throw new Error(`Field ${name} is not found in ${this.name}`);
      }

      try {
        converter.serialize(data, buffer);
      } catch (e) {
        throw ErrorUtils.withCause(`Failed to serialize field="${name}" value="${data}" in struct="${this.name}"`, e);
      }
    });
  }

  deserialize(buffer: Buffer): IValue {
    return this.convertorsList.reduce<Record<IName, IValue>>((acc, { converter, name }) => {
      try {
        acc[name] = converter.deserialize(buffer);
        return acc;
      } catch (e) {
        throw ErrorUtils.withCause(`Failed to deserialize field="${name}" in struct="${this.name}"`, e);
      }
    }, {});
  }

  size(value: IValue): number {
    return this.convertorsList.reduce((acc, { converter, name }) => {
      const data = value[name];
      if (data === null || data === undefined) {
        throw new Error(`Field ${name} is not found in ${this.name}`);
      }

      return acc + converter.size(data);
    }, 0);
  }

  default(): IValue {
    return this.parentObject;
  }
}
