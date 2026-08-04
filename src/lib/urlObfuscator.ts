/**
 * Utility for URL Masking & Stealth Obfuscation
 * Protects locked links from being copied or inspected in plain text.
 */

const SECRET_KEY = 'NyiurIndahStealthKey2026';

function xorCipher(text: string, key: string): string {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return result;
}

export interface DecodedStealthPayload {
  url: string;
  linkId: string;
  timestamp: number;
}

/**
 * Encodes a URL into an obfuscated stealth token
 */
export function encodeStealthToken(url: string, linkId: string): string {
  try {
    const randomSalt = Array.from({ length: 12 }, () => Math.floor(Math.random() * 36).toString(36)).join('');
    const payload = JSON.stringify({
      u: url,
      id: linkId,
      t: Date.now(),
      r: randomSalt,
    });
    const cipher = xorCipher(payload, SECRET_KEY);
    return btoa(cipher).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  } catch {
    return btoa(url);
  }
}

/**
 * Decodes a stealth token back to the target payload
 */
export function decodeStealthToken(token: string): DecodedStealthPayload | null {
  if (!token) return null;
  try {
    const base64 = token.replace(/-/g, '+').replace(/_/g, '/');
    const cipher = atob(base64);
    const decrypted = xorCipher(cipher, SECRET_KEY);
    const parsed = JSON.parse(decrypted);
    if (parsed && parsed.u) {
      return {
        url: parsed.u,
        linkId: parsed.id || '',
        timestamp: parsed.t || 0,
      };
    }
    return null;
  } catch {
    try {
      const fallbackUrl = atob(token);
      if (fallbackUrl && fallbackUrl.startsWith('http')) {
        return { url: fallbackUrl, linkId: '', timestamp: Date.now() };
      }
      return null;
    } catch {
      return null;
    }
  }
}

/**
 * Generates a randomized masked display string for hover or inspect element
 */
export function getMaskedDisplayUrl(rawUrl: string, isLocked: boolean, isAdmin: boolean): string {
  if (isLocked && !isAdmin) {
    const randomHash = Math.random().toString(36).substring(2, 10);
    return `https://sys-protected.link/sec-${randomHash}`;
  }

  try {
    const parsed = new URL(rawUrl);
    return `${parsed.protocol}//${parsed.hostname}/***`;
  } catch {
    return 'https://sys-protected.link/masked';
  }
}

/**
 * Generates a stealth redirect URL with randomized acak parameter for sharing/copying
 */
export function getStealthRedirectUrl(rawUrl: string, linkId: string): string {
  const token = encodeStealthToken(rawUrl, linkId);
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  return `${baseUrl}/?v=${token}`;
}

