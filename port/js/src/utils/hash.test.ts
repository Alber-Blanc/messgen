import { describe, it, expect } from 'vitest';
import { Protocols, type RawMessage } from '../protocol';
import { hashMessage, hashType } from './hash';

describe('Hash functions', () => {
  describe('#hashMessage', () => {
    it('should hash a simple message', () => {
      const message: RawMessage = {
        message_id: 1,
        name: 'Login',
        type: 'LoginData',
      };

      const hash = hashMessage(message);

      expect(typeof hash).toBe('bigint');
      expect(hash).toBeGreaterThan(0n);
    });

    it('should produce consistent hashes', () => {
      const message: RawMessage = {
        message_id: 1,
        name: 'Login',
        type: 'LoginData',
      };

      const hash1 = hashMessage(message);
      const hash2 = hashMessage(message);

      expect(hash1).toBe(hash2);
    });

    it('should ignore comment fields', () => {
      const message1: RawMessage & { comment?: string } = {
        message_id: 1,
        name: 'Login',
        type: 'LoginData',
        comment: 'This is a login message',
      };
      const message2: RawMessage = {
        message_id: 1,
        name: 'Login',
        type: 'LoginData',
      };

      const hash1 = hashMessage(message1);
      const hash2 = hashMessage(message2);

      expect(hash1).toBe(hash2);
    });

    it('should produce different hashes for different messages', () => {
      const message1: RawMessage = {
        message_id: 1,
        name: 'Login',
        type: 'LoginData',
      };

      const message2: RawMessage = {
        message_id: 2,
        name: 'Logout',
        type: 'LogoutData',
      };

      const hash1 = hashMessage(message1);
      const hash2 = hashMessage(message2);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('#hashType', () => {
    it('should hash scalar types', () => {
      const protocols = new Protocols();
      protocols.load([]);

      const hash = hashType('uint32', protocols);

      expect(hash).toBe(5061369293401170136n);
    });

    it('should hash struct types', () => {
      const protocols = new Protocols();
      protocols.load([
        {
          type: 'LoginData',
          type_class: 'struct',
          fields: [
            { name: 'username', type: 'string' },
            { name: 'password', type: 'string' },
          ],
        },
      ]);

      const hash = hashType('LoginData', protocols);

      expect(hash).toBe(479398456421290568n);
    });

    it('should hash enum types', () => {
      const protocols = new Protocols();
      protocols.load([
        {
          type: 'Status',
          type_class: 'enum',
          base_type: 'uint8',
          values: [
            { name: 'Active', value: 0 },
            { name: 'Inactive', value: 1 },
          ],
        },
      ]);

      const hash = hashType('Status', protocols);

      expect(hash).toBe(11925832958824953276n);
    });

    it('should include dependencies in hash', () => {
      const protocols = new Protocols();
      protocols.load([
        {
          type: 'Inner',
          type_class: 'struct',
          fields: [
            { name: 'value', type: 'uint32' },
          ],
        },
        {
          type: 'Outer',
          type_class: 'struct',
          fields: [
            { name: 'inner', type: 'Inner' },
            { name: 'name', type: 'string' },
          ],
        },
      ]);

      const outerHash = hashType('Outer', protocols);
      const innerHash = hashType('Inner', protocols);

      expect(outerHash).not.toBe(innerHash);
    });

    it('should handle array types', () => {
      const protocols = new Protocols();
      protocols.load([]);

      const hash = hashType('uint32[]', protocols);

      expect(hash).toBe(867778072280195960n);
    });

    it('should handle map types', () => {
      const protocols = new Protocols();
      protocols.load([]);

      const hash = hashType('string{uint32}', protocols);

      expect(hash).toBe(14187822969938353579n);
    });
  });
});
