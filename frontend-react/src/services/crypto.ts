/**
 * AES-256-GCM payload encryption/decryption using Web Crypto API
 */

const KEY_B64 = import.meta.env.VITE_PAYLOAD_ENCRYPTION_KEY as string;

let _cryptoKey: CryptoKey | null = null;

async function getKey(): Promise<CryptoKey> {
  if (_cryptoKey) return _cryptoKey;

  if (!KEY_B64) {
    throw new Error('VITE_PAYLOAD_ENCRYPTION_KEY is not set');
  }

  const keyBytes = Uint8Array.from(atob(KEY_B64), c => c.charCodeAt(0));
  _cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
  return _cryptoKey;
}

/**
 * Encrypt an object to a base64 string (iv + ciphertext + tag)
 */
export async function encryptPayload(data: object): Promise<string> {
  const key = await getKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plaintext = new TextEncoder().encode(JSON.stringify(data));

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    plaintext
  );

  // Combine iv + ciphertext (which includes auth tag)
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(ciphertext), iv.length);

  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypt a base64 string (iv + ciphertext + tag) back to parsed JSON
 */
export async function decryptResponse(encryptedB64: string): Promise<any> {
  const key = await getKey();
  const raw = Uint8Array.from(atob(encryptedB64), c => c.charCodeAt(0));

  const iv = raw.slice(0, 12);
  const ciphertext = raw.slice(12);

  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  );

  const json = new TextDecoder().decode(plaintext);
  return JSON.parse(json);
}
