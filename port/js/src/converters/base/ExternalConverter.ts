import { Converter } from '../Converter';
import type { ExternalTypeDefinition } from '../../types';
import type { Cursor } from '../../Cursor';

export class ExternalConverter extends Converter {
  constructor(typeDef: ExternalTypeDefinition) {
    super(typeDef.typeName);
  }

  serialize(_value: unknown, _cursor: Cursor): never {
    throw new Error(`Serialization is not implemented for external type ${this.name}`);
  }

  deserialize(_cursor: Cursor): never {
    throw new Error(`Deserialization is not implemented for external type ${this.name}`);
  }

  size(_value: unknown): never {
    throw new Error(`Size is not implemented for external type ${this.name}`);
  }

  createDefault(): null {
    return null;
  }
}
