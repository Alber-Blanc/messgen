interface Field {
  name: string;
  type: string;
}

export class Struct {
  constructor(schema: { id?: number; fields: Field[] });
  readonly fields: Field[];
  readonly schema: { fields: Field[] };
}

export class Buffer {
  constructor(buffer: ArrayBufferLike, useTypedArray?: boolean);
  static createValueArray(fields: Field[], value: object): unknown[];
  static calcSize(fields: unknown[]): number;
  static serializeObj(fields: Field[], value: object): ArrayBuffer;
  deserialize(struct: Struct): Record<string, unknown>;
}
