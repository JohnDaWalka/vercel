# @vercel/cryptography

Cryptography utilities for Vercel. Provides secure, production-ready cryptographic functions using Node.js built-in `crypto` module.

## Installation

```bash
npm install @vercel/cryptography
# or
pnpm add @vercel/cryptography
# or
yarn add @vercel/cryptography
```

## Features

- **Secure Random Generation**: Cryptographically secure random strings
- **Hashing**: SHA-256 hashing for data integrity
- **HMAC**: Hash-based message authentication codes
- **Constant-Time Comparison**: Timing-safe string comparison to prevent timing attacks
- **Encryption/Decryption**: AES-256-GCM authenticated encryption
- **Key Generation**: Secure key generation for encryption

## Usage

### Generate Random Strings

```typescript
import { generateRandomString } from '@vercel/cryptography';

// Generate a 32-character random string (default)
const token = generateRandomString();

// Generate a random string of specific length
const apiKey = generateRandomString(64);
```

### Hashing

```typescript
import { hash } from '@vercel/cryptography';

// Generate SHA-256 hash (hex encoding by default)
const hashedPassword = hash('user-password');

// Use base64 encoding
const hashedData = hash('data', 'base64');
```

### HMAC (Hash-based Message Authentication Code)

```typescript
import { hmac } from '@vercel/cryptography';

// Generate HMAC with a secret key
const signature = hmac('message', 'secret-key');

// Verify HMAC
const isValid = hmac('message', 'secret-key') === signature;
```

### Constant-Time Comparison

```typescript
import { constantTimeCompare } from '@vercel/cryptography';

// Safely compare secrets (prevents timing attacks)
const isValid = constantTimeCompare(userProvidedToken, storedToken);
```

### Encryption and Decryption

```typescript
import { encrypt, decrypt, generateKey } from '@vercel/cryptography';

// Generate a secure key
const key = generateKey();

// Encrypt sensitive data
const encrypted = encrypt('sensitive data', key);
// Returns: { encrypted: string, iv: string, authTag: string }

// Decrypt data
const decrypted = decrypt(
  encrypted.encrypted,
  key,
  encrypted.iv,
  encrypted.authTag
);
// Returns: 'sensitive data'
```

## API Reference

### `generateRandomString(length?: number): string`

Generates a cryptographically secure random string using `crypto.randomBytes`.

- **length** (optional): The desired length of the string. Default: 32
- **Returns**: A hexadecimal string of the specified length
- **Throws**: Error if length is not positive

### `hash(data: string | Buffer, encoding?: 'hex' | 'base64'): string`

Generates a SHA-256 hash of the given data.

- **data**: The data to hash (string or Buffer)
- **encoding** (optional): Output encoding. Default: 'hex'
- **Returns**: The hash as a string
- **Throws**: Error if data is empty

### `hmac(data: string | Buffer, secret: string | Buffer, encoding?: 'hex' | 'base64'): string`

Creates an HMAC using SHA-256.

- **data**: The data to authenticate
- **secret**: The secret key
- **encoding** (optional): Output encoding. Default: 'hex'
- **Returns**: The HMAC as a string
- **Throws**: Error if data or secret is empty

### `constantTimeCompare(a: string, b: string): boolean`

Compares two strings in constant time to prevent timing attacks.

- **a**: First string
- **b**: Second string
- **Returns**: True if strings are equal, false otherwise

### `encrypt(plaintext: string, key: Buffer): { encrypted: string; iv: string; authTag: string }`

Encrypts data using AES-256-GCM authenticated encryption.

- **plaintext**: The data to encrypt
- **key**: 32-byte encryption key (use `generateKey()`)
- **Returns**: Object containing encrypted data, IV, and authentication tag
- **Throws**: Error if plaintext is empty or key is not 32 bytes

### `decrypt(encrypted: string, key: Buffer, iv: string, authTag: string): string`

Decrypts data encrypted with the `encrypt` function.

- **encrypted**: The encrypted data (hex string)
- **key**: The 32-byte decryption key
- **iv**: The initialization vector (hex string)
- **authTag**: The authentication tag (hex string)
- **Returns**: The decrypted plaintext
- **Throws**: Error if any parameter is invalid or authentication fails

### `generateKey(): Buffer`

Generates a cryptographically secure 32-byte key suitable for AES-256 encryption.

- **Returns**: A 32-byte Buffer

## Security Considerations

- All random generation uses `crypto.randomBytes` for cryptographic security
- SHA-256 is used for hashing (avoid for password hashing - use bcrypt/argon2 instead)
- AES-256-GCM provides both encryption and authentication
- Constant-time comparison prevents timing attacks on secret comparison
- Each encryption generates a unique IV for security
- Keys should be stored securely and never committed to version control

## License

Apache-2.0
