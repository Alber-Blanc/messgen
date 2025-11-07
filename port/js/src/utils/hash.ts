import { md5 } from 'js-md5';
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
  const hashArray = md5.array(payload);

  // Take first 8 bytes and convert to little-endian uint64
  let result = 0n;
  for (let i = 0; i < 8; i += 1) {
    result |= BigInt(hashArray[i]) << BigInt(i * 8);
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
  // Create deep copy to avoid modifying original
  const copy = JSON.parse(JSON.stringify(data));

  // Remove all "comment" keys recursively
  removeKeys(copy, 'comment');

  // Convert to sorted array of [key, value] pairs (like Python's sorted(dict.items()))
  const sortedItems = toSortedItems(copy);

  // Serialize to JSON with no spaces (separators=(",", ":"))
  const jsonStr = JSON.stringify(sortedItems);

  // Encode to bytes
  const encoder = new TextEncoder();
  const bytes = encoder.encode(jsonStr);

  return hashBytes(bytes);
}
