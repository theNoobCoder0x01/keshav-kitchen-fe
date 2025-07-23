/**
 * Secure password hashing utilities using Web Crypto API
 * Compatible with Next.js Edge Runtime
 */

/**
 * Configuration for PBKDF2 password hashing
 */
const HASH_CONFIG = {
  // High iteration count for security (recommended: 100,000+)
  iterations: 100000,
  // Salt length in bytes
  saltLength: 32,
  // Hash length in bytes (256 bits)
  hashLength: 32,
  // Algorithm identifier
  algorithm: 'PBKDF2',
} as const;

/**
 * Generates a cryptographically secure random salt
 * @returns Promise<Uint8Array> - Random salt bytes
 */
async function generateSalt(): Promise<Uint8Array> {
  return crypto.getRandomValues(new Uint8Array(HASH_CONFIG.saltLength));
}

/**
 * Converts a Uint8Array to a base64 string for storage
 * @param buffer - The byte array to convert
 * @returns string - Base64 encoded string
 */
function bufferToBase64(buffer: Uint8Array): string {
  return btoa(String.fromCharCode(...buffer));
}

/**
 * Converts a base64 string back to a Uint8Array
 * @param base64 - The base64 string to convert
 * @returns Uint8Array - The decoded byte array
 */
function base64ToBuffer(base64: string): Uint8Array {
  const binaryString = atob(base64);
  return new Uint8Array(binaryString.length).map((_, i) => binaryString.charCodeAt(i));
}

/**
 * Hashes a password using PBKDF2 with a random salt
 * @param password - The plain text password to hash
 * @returns Promise<string> - The hashed password in format: salt.hash (both base64 encoded)
 * @throws Error if hashing fails
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    // Generate a random salt
    const salt = await generateSalt();
    
    // Convert password to ArrayBuffer
    const passwordBuffer = new TextEncoder().encode(password);
    
    // Import the password as a key for PBKDF2
    const key = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      { name: 'PBKDF2' },
      false, // not extractable
      ['deriveBits']
    );
    
    // Derive the hash using PBKDF2
    const hashBuffer = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: HASH_CONFIG.iterations,
        hash: 'SHA-256'
      },
      key,
      HASH_CONFIG.hashLength * 8 // bits
    );
    
    // Convert to Uint8Array and then to base64
    const hashArray = new Uint8Array(hashBuffer);
    const saltBase64 = bufferToBase64(salt);
    const hashBase64 = bufferToBase64(hashArray);
    
    // Return in format: salt.hash
    return `${saltBase64}.${hashBase64}`;
  } catch (error) {
    console.error('Password hashing failed:', error);
    throw new Error('Failed to hash password');
  }
}

/**
 * Verifies a password against a stored hash
 * @param password - The plain text password to verify
 * @param storedHash - The stored hash in format: salt.hash (both base64 encoded)
 * @returns Promise<boolean> - True if password matches, false otherwise
 * @throws Error if verification fails due to invalid format or crypto error
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  try {
    // Parse the stored hash to extract salt and hash
    const parts = storedHash.split('.');
    if (parts.length !== 2) {
      throw new Error('Invalid hash format');
    }
    
    const [saltBase64, expectedHashBase64] = parts;
    const salt = base64ToBuffer(saltBase64);
    const expectedHash = base64ToBuffer(expectedHashBase64);
    
    // Convert password to ArrayBuffer
    const passwordBuffer = new TextEncoder().encode(password);
    
    // Import the password as a key for PBKDF2
    const key = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      { name: 'PBKDF2' },
      false, // not extractable
      ['deriveBits']
    );
    
    // Derive the hash using the same parameters
    const hashBuffer = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: HASH_CONFIG.iterations,
        hash: 'SHA-256'
      },
      key,
      HASH_CONFIG.hashLength * 8 // bits
    );
    
    const computedHash = new Uint8Array(hashBuffer);
    
    // Constant-time comparison to prevent timing attacks
    if (computedHash.length !== expectedHash.length) {
      return false;
    }
    
    let result = 0;
    for (let i = 0; i < computedHash.length; i++) {
      result |= computedHash[i] ^ expectedHash[i];
    }
    
    return result === 0;
  } catch (error) {
    console.error('Password verification failed:', error);
    throw new Error('Failed to verify password');
  }
}

/**
 * Migrates an existing bcrypt hash to the new Web Crypto format
 * This is useful during the transition period
 * @param password - The plain text password
 * @param bcryptHash - The existing bcrypt hash
 * @returns Promise<string | null> - New hash if bcrypt verification succeeds, null otherwise
 */
export async function migrateBcryptHash(password: string, bcryptHash: string): Promise<string | null> {
  try {
    // Note: This would require bcryptjs for verification, which we're trying to avoid
    // This is just a placeholder for the migration strategy
    // In practice, you might want to handle this during user login
    console.warn('Bcrypt migration not implemented - consider handling during user login');
    return null;
  } catch (error) {
    console.error('Bcrypt migration failed:', error);
    return null;
  }
}

/**
 * Utility function to check if a hash is in the old bcrypt format
 * @param hash - The hash to check
 * @returns boolean - True if it's a bcrypt hash
 */
export function isBcryptHash(hash: string): boolean {
  return hash.startsWith('$2a$') || hash.startsWith('$2b$') || hash.startsWith('$2y$');
}