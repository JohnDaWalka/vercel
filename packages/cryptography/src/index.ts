import crypto from 'node:crypto';

/**
 * Generates a cryptographically secure random string.
 * Uses Node.js crypto.randomBytes for secure random generation.
 *
 * @param length - The desired length of the random string (default: 32)
 * @returns A hexadecimal string of the specified length
 */
export function generateRandomString(length = 32): string {
  // Ensure length is valid and positive
  if (length <= 0) {
    throw new Error('Length must be a positive number');
  }

  // Generate random bytes and convert to hex
  // Each byte becomes 2 hex characters, so we need length/2 bytes
  const bytes = Math.ceil(length / 2);
  return crypto.randomBytes(bytes).toString('hex').slice(0, length);
}

/**
 * Generates a secure hash of the given data using SHA-256.
 * SHA-256 provides strong cryptographic guarantees for integrity checking.
 *
 * @param data - The data to hash (string or Buffer)
 * @param encoding - Output encoding (default: 'hex')
 * @returns The hash as a string in the specified encoding
 */
export function hash(
  data: string | Buffer,
  encoding: 'hex' | 'base64' = 'hex'
): string {
  if (!data) {
    throw new Error('Data is required for hashing');
  }

  return crypto.createHash('sha256').update(data).digest(encoding);
}

/**
 * Creates an HMAC (Hash-based Message Authentication Code) for the given data.
 * HMACs provide both data integrity and authentication using a secret key.
 *
 * @param data - The data to authenticate
 * @param secret - The secret key for HMAC generation
 * @param encoding - Output encoding (default: 'hex')
 * @returns The HMAC as a string in the specified encoding
 */
export function hmac(
  data: string | Buffer,
  secret: string | Buffer,
  encoding: 'hex' | 'base64' = 'hex'
): string {
  if (!data || !secret) {
    throw new Error('Both data and secret are required for HMAC');
  }

  return crypto.createHmac('sha256', secret).update(data).digest(encoding);
}

/**
 * Compares two strings in constant time to prevent timing attacks.
 * Uses crypto.timingSafeEqual for secure comparison of secrets.
 *
 * @param a - First string to compare
 * @param b - Second string to compare
 * @returns True if strings are equal, false otherwise
 */
export function constantTimeCompare(a: string, b: string): boolean {
  if (!a || !b) {
    return false;
  }

  // Convert to buffers for constant-time comparison
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);

  // If lengths differ, return false early.
  // Note: Length comparison is not constant-time, but this is
  // generally acceptable as string length is often public information.
  if (bufferA.length !== bufferB.length) {
    return false;
  }

  return crypto.timingSafeEqual(bufferA, bufferB);
}

/**
 * Encrypts data using AES-256-GCM authenticated encryption.
 * AES-256-GCM provides both confidentiality and authenticity.
 *
 * @param plaintext - The data to encrypt
 * @param key - 32-byte encryption key (for AES-256)
 * @returns An object containing the encrypted data, IV, and auth tag
 */
export function encrypt(
  plaintext: string,
  key: Buffer
): { encrypted: string; iv: string; authTag: string } {
  if (!plaintext) {
    throw new Error('Plaintext is required for encryption');
  }

  if (key.length !== 32) {
    throw new Error('Key must be 32 bytes for AES-256');
  }

  // Generate a random IV (Initialization Vector) for each encryption
  const iv = crypto.randomBytes(16);

  // Create cipher with AES-256-GCM (authenticated encryption)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  // Encrypt the data
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  // Get the authentication tag
  const authTag = cipher.getAuthTag();

  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
  };
}

/**
 * Decrypts data encrypted with the encrypt function.
 * Verifies authenticity using the auth tag before decryption.
 *
 * @param encrypted - The encrypted data (hex string)
 * @param key - The 32-byte decryption key
 * @param iv - The initialization vector (hex string)
 * @param authTag - The authentication tag (hex string)
 * @returns The decrypted plaintext
 */
export function decrypt(
  encrypted: string,
  key: Buffer,
  iv: string,
  authTag: string
): string {
  if (!encrypted || !iv || !authTag) {
    throw new Error('Encrypted data, IV, and auth tag are required');
  }

  if (key.length !== 32) {
    throw new Error('Key must be 32 bytes for AES-256');
  }

  // Create decipher
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    key,
    Buffer.from(iv, 'hex')
  );

  // Set the auth tag for verification
  decipher.setAuthTag(Buffer.from(authTag, 'hex'));

  // Decrypt the data
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Generates a cryptographically secure key suitable for AES-256 encryption.
 *
 * @returns A 32-byte Buffer for use as an encryption key
 */
export function generateKey(): Buffer {
  return crypto.randomBytes(32);
}
