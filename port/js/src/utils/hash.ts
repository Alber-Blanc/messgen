import { lib, MD5 } from 'crypto-js';
import type { RawMessage } from '../protocol/Protocols.types';
import type { Protocols } from '../protocol/Protocols';

export function hashMessage(message: RawMessage): bigint {
  return hashStruct(message);
}

export function hashType(typeName: string, protocols: Protocols): bigint {
  const typeDefinition = protocols.getType(typeName);
  const dependencies = protocols.dependencies(typeName);

  return Array.from(dependencies).reduce((acc, dep) => {
    const depHash = hashType(dep, protocols);
    return acc ^ depHash;
  }, hashStruct(typeDefinition));
}

function hashBytes(payload: Uint8Array): bigint {
  const wordArray = lib.WordArray.create(payload as unknown as number[]);
  const hash = MD5(wordArray);

  const { words, sigBytes } = hash;
  const bytesToUse = Math.min(8, sigBytes);
  let result = 0n;

  for (let i = 0; i < bytesToUse; i += 1) {
    const word = words[i >>> 2];
    const byteShift = 24 - (i % 4) * 8;
    const byte = (word >>> byteShift) & 0xff;
    result |= BigInt(byte) << BigInt(i * 8);
  }

  return result;
}

function removeKeys(container: unknown, key: string): void {
  if (typeof container === 'object' && container !== null) {
    if (Array.isArray(container)) {
      container.forEach((item) => removeKeys(item, key));
    } else {
      const obj = container as Record<string, unknown>;
      delete obj[key];
      Object.keys(obj).forEach((k) => {
        removeKeys(obj[k], key);
      });
    }
  }
}

function toSortedItems(obj: unknown): unknown {
  if (Array.isArray(obj)) {
    return obj.map(toSortedItems);
  }

  if (obj !== null && typeof obj === 'object') {
    const record = obj as Record<string, unknown>;
    const sortedKeys = Object.keys(record).sort();
    return sortedKeys.map((key) => [key, toSortedItems(record[key])]);
  }

  return obj;
}

function hashStruct(data: unknown): bigint {
  const copy = JSON.parse(JSON.stringify(data));

  removeKeys(copy, 'comment');

  const sortedItems = toSortedItems(copy);
  const jsonStr = JSON.stringify(sortedItems);

  const bytes = new TextEncoder().encode(jsonStr);
  return hashBytes(bytes);
}
