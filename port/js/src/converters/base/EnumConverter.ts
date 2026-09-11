import { Converter } from '../Converter';
import type { EnumTypeDefinition } from '../../types';
import type { Cursor } from '../../Cursor';
import type { GetType } from '../ConverterFactory';

type EnumValue = number | bigint;
type EnumInput = EnumValue | string;

export class EnumConverter extends Converter<EnumValue, EnumInput> {
  private converter: Converter<EnumValue, EnumInput>;
  private enumsByName: Map<string, number>;
  private defaultValue: EnumValue;

  constructor(typeDef: EnumTypeDefinition, getType: GetType) {
    super(typeDef.typeName);
    this.converter = getType(typeDef.type) as Converter<EnumValue, EnumInput>;
    this.enumsByName = new Map(typeDef.values.map(({ name, value }) => [name, value]));
    const firstValue = typeDef.values[0]?.value ?? 0;
    this.defaultValue = typeof this.converter.createDefault() === 'bigint' ? BigInt(firstValue) : firstValue;
  }

  serialize(value: EnumInput, cursor: Cursor): void {
    const raw = typeof value === 'string' ? this.enumsByName.get(value) ?? value : value;
    this.converter.serialize(raw, cursor);
  }

  deserialize(cursor: Cursor): EnumValue {
    return this.converter.deserialize(cursor);
  }

  size(value: EnumInput): number {
    return this.converter.size(value);
  }

  createDefault(): EnumValue {
    return this.defaultValue;
  }
}
