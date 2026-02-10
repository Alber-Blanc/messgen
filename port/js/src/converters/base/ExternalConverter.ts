import { Converter } from '../Converter';
import type { ExternalTypeDefinition } from '../../types';

export class ExternalConverter extends Converter {
  constructor(typeDef: ExternalTypeDefinition) {
    super(typeDef.typeName);
  }
}
