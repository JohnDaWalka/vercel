import { describe, test, expect } from 'vitest';
import {
  generateRandomString,
  hash,
  hmac,
  constantTimeCompare,
  encrypt,
  decrypt,
  generateKey,
} from '../src/index';

describe('Cryptography Module', () => {
  describe('generateRandomString', () => {
    test('should generate a random string of default length', () => {
      const result = generateRandomString();
      expect(result).toHaveLength(32);
      expect(typeof result).toBe('string');
    });

    test('should generate a random string of specified length', () => {
      const result = generateRandomString(64);
      expect(result).toHaveLength(64);
    });

    test('should generate unique strings', () => {
      const str1 = generateRandomString();
      const str2 = generateRandomString();
      expect(str1).not.toBe(str2);
    });

    test('should only contain hexadecimal characters', () => {
      const result = generateRandomString(100);
      expect(result).toMatch(/^[0-9a-f]+$/);
    });

    test('should throw error for invalid length', () => {
      expect(() => generateRandomString(0)).toThrow(
        'Length must be a positive number'
      );
      expect(() => generateRandomString(-5)).toThrow(
        'Length must be a positive number'
      );
    });
  });

  describe('hash', () => {
    test('should generate consistent SHA-256 hash for same input', () => {
      const data = 'test data';
      const hash1 = hash(data);
      const hash2 = hash(data);
      expect(hash1).toBe(hash2);
    });

    test('should generate different hashes for different inputs', () => {
      const hash1 = hash('data1');
      const hash2 = hash('data2');
      expect(hash1).not.toBe(hash2);
    });

    test('should support buffer input', () => {
      const buffer = Buffer.from('test data');
      const result = hash(buffer);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    test('should support base64 encoding', () => {
      const result = hash('test', 'base64');
      expect(typeof result).toBe('string');
      // Base64 strings should not contain only hex chars
      expect(result).toMatch(/^[A-Za-z0-9+/]+=*$/);
    });

    test('should throw error for empty data', () => {
      expect(() => hash('')).toThrow('Data is required for hashing');
    });
  });

  describe('hmac', () => {
    test('should generate consistent HMAC for same input and secret', () => {
      const data = 'test data';
      const secret = 'secret key';
      const hmac1 = hmac(data, secret);
      const hmac2 = hmac(data, secret);
      expect(hmac1).toBe(hmac2);
    });

    test('should generate different HMACs for different secrets', () => {
      const data = 'test data';
      const hmac1 = hmac(data, 'secret1');
      const hmac2 = hmac(data, 'secret2');
      expect(hmac1).not.toBe(hmac2);
    });

    test('should support buffer inputs', () => {
      const data = Buffer.from('test data');
      const secret = Buffer.from('secret key');
      const result = hmac(data, secret);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    test('should support base64 encoding', () => {
      const result = hmac('data', 'secret', 'base64');
      expect(result).toMatch(/^[A-Za-z0-9+/]+=*$/);
    });

    test('should throw error for missing data or secret', () => {
      expect(() => hmac('', 'secret')).toThrow(
        'Both data and secret are required for HMAC'
      );
      expect(() => hmac('data', '')).toThrow(
        'Both data and secret are required for HMAC'
      );
    });
  });

  describe('constantTimeCompare', () => {
    test('should return true for identical strings', () => {
      const str = 'test string';
      expect(constantTimeCompare(str, str)).toBe(true);
    });

    test('should return false for different strings', () => {
      expect(constantTimeCompare('string1', 'string2')).toBe(false);
    });

    test('should return false for strings of different lengths', () => {
      expect(constantTimeCompare('short', 'much longer string')).toBe(false);
    });

    test('should return false for empty strings', () => {
      expect(constantTimeCompare('', '')).toBe(false);
      expect(constantTimeCompare('test', '')).toBe(false);
      expect(constantTimeCompare('', 'test')).toBe(false);
    });

    test('should handle special characters', () => {
      const special = '!@#$%^&*()_+{}[]|\\:";\'<>?,./';
      expect(constantTimeCompare(special, special)).toBe(true);
    });
  });

  describe('encrypt and decrypt', () => {
    test('should encrypt and decrypt data successfully', () => {
      const plaintext = 'sensitive data';
      const key = generateKey();

      const encrypted = encrypt(plaintext, key);
      expect(encrypted.encrypted).toBeTruthy();
      expect(encrypted.iv).toBeTruthy();
      expect(encrypted.authTag).toBeTruthy();

      const decrypted = decrypt(
        encrypted.encrypted,
        key,
        encrypted.iv,
        encrypted.authTag
      );
      expect(decrypted).toBe(plaintext);
    });

    test('should produce different ciphertext for same plaintext with different keys', () => {
      const plaintext = 'test data';
      const key1 = generateKey();
      const key2 = generateKey();

      const encrypted1 = encrypt(plaintext, key1);
      const encrypted2 = encrypt(plaintext, key2);

      expect(encrypted1.encrypted).not.toBe(encrypted2.encrypted);
    });

    test('should produce different ciphertext each time due to random IV', () => {
      const plaintext = 'test data';
      const key = generateKey();

      const encrypted1 = encrypt(plaintext, key);
      const encrypted2 = encrypt(plaintext, key);

      // Same key, same plaintext, but different IV means different ciphertext
      expect(encrypted1.encrypted).not.toBe(encrypted2.encrypted);
      expect(encrypted1.iv).not.toBe(encrypted2.iv);
    });

    test('should fail to decrypt with wrong key', () => {
      const plaintext = 'sensitive data';
      const key1 = generateKey();
      const key2 = generateKey();

      const encrypted = encrypt(plaintext, key1);

      expect(() =>
        decrypt(encrypted.encrypted, key2, encrypted.iv, encrypted.authTag)
      ).toThrow();
    });

    test('should fail to decrypt with tampered ciphertext', () => {
      const plaintext = 'sensitive data';
      const key = generateKey();

      const encrypted = encrypt(plaintext, key);
      const tamperedCiphertext = encrypted.encrypted.slice(0, -2) + '00';

      expect(() =>
        decrypt(tamperedCiphertext, key, encrypted.iv, encrypted.authTag)
      ).toThrow();
    });

    test('should throw error for invalid key size in encrypt', () => {
      const plaintext = 'test';
      const invalidKey = Buffer.from('short key');

      expect(() => encrypt(plaintext, invalidKey)).toThrow(
        'Key must be 32 bytes for AES-256'
      );
    });

    test('should throw error for invalid key size in decrypt', () => {
      const invalidKey = Buffer.from('short key');

      expect(() => decrypt('ciphertext', invalidKey, 'iv', 'authTag')).toThrow(
        'Key must be 32 bytes for AES-256'
      );
    });

    test('should throw error for empty plaintext', () => {
      const key = generateKey();
      expect(() => encrypt('', key)).toThrow(
        'Plaintext is required for encryption'
      );
    });

    test('should handle unicode characters', () => {
      const plaintext = '你好世界 🌍 Hello World! ñ';
      const key = generateKey();

      const encrypted = encrypt(plaintext, key);
      const decrypted = decrypt(
        encrypted.encrypted,
        key,
        encrypted.iv,
        encrypted.authTag
      );

      expect(decrypted).toBe(plaintext);
    });
  });

  describe('generateKey', () => {
    test('should generate a 32-byte key', () => {
      const key = generateKey();
      expect(key).toBeInstanceOf(Buffer);
      expect(key.length).toBe(32);
    });

    test('should generate unique keys', () => {
      const key1 = generateKey();
      const key2 = generateKey();
      expect(key1.equals(key2)).toBe(false);
    });
  });
});
