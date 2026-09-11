import type { Cursor } from '../Cursor';
import type { IType } from '../types';

export abstract class Converter<Output = unknown, Input = Output> {
  constructor(readonly name: IType) {}

  abstract serialize(value: Input, cursor: Cursor): void;

  abstract size(value: Input): number;

  abstract deserialize(cursor: Cursor): Output;

  abstract createDefault(): Output;

  /** @deprecated Use createDefault() to obtain an independent value. */
  default(): Output {
    return this.createDefault();
  }
}
