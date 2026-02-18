"""
AES-256-GCM payload encryption/decryption for API requests and responses
"""

import os
import base64
import logging
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

logger = logging.getLogger(__name__)

_key = None


def _get_key() -> bytes:
    """Get the encryption key from environment variable (cached)."""
    global _key
    if _key is None:
        key_b64 = os.getenv('PAYLOAD_ENCRYPTION_KEY')
        if not key_b64:
            raise ValueError("PAYLOAD_ENCRYPTION_KEY environment variable is not set")
        _key = base64.b64decode(key_b64)
        if len(_key) != 32:
            raise ValueError("PAYLOAD_ENCRYPTION_KEY must be 32 bytes (256 bits) when decoded")
    return _key


def encrypt_payload(plaintext: str) -> str:
    """
    Encrypt a string using AES-256-GCM.
    Returns base64-encoded string: iv (12 bytes) + ciphertext + auth tag (16 bytes)
    """
    key = _get_key()
    aesgcm = AESGCM(key)
    iv = os.urandom(12)
    ciphertext = aesgcm.encrypt(iv, plaintext.encode('utf-8'), None)
    return base64.b64encode(iv + ciphertext).decode('utf-8')


def decrypt_payload(encrypted_b64: str) -> str:
    """
    Decrypt a base64-encoded AES-256-GCM encrypted string.
    Expects: iv (12 bytes) + ciphertext + auth tag (16 bytes)
    Returns the decrypted plaintext string.
    """
    key = _get_key()
    raw = base64.b64decode(encrypted_b64)
    iv = raw[:12]
    ciphertext = raw[12:]
    aesgcm = AESGCM(key)
    plaintext = aesgcm.decrypt(iv, ciphertext, None)
    return plaintext.decode('utf-8')
