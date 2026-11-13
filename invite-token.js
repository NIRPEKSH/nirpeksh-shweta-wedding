// Names stay in the URL fragment, which is not sent to the host.
// The decryption key travels with the link: this conceals the name in the URL,
// rather than restricting access. Anyone with the link can read its greeting.
const encoder = new TextEncoder();
const decoder = new TextDecoder('utf-8', { fatal: true });
function encode(bytes) { return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
function decode(value) { return Uint8Array.from(atob(value.replace(/-/g, '+').replace(/_/g, '/')), char => char.charCodeAt(0)); }
function greetingValue(value) {
  if (typeof value !== 'string' || !value.trim() || value.length > 160 || /[\u0000-\u001f\u007f]/u.test(value)) throw new Error('Please use a greeting of 1–160 characters.');
  return value.trim();
}
export async function createGuestToken(greeting) {
  // Version 2 uses a shorter key and plain UTF-8 payload to keep links compact.
  const payload = encoder.encode(greetingValue(greeting));
  const keyBytes = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await crypto.subtle.importKey('raw', keyBytes, 'AES-GCM', false, ['encrypt']);
  const encrypted = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: encoder.encode('nirpeksh-shweta-invitation:v2') }, key, payload));
  const bytes = new Uint8Array(28 + encrypted.length);
  bytes.set(keyBytes); bytes.set(iv, 16); bytes.set(encrypted, 28);
  return 'p2_' + encode(bytes);
}
export async function readGuestToken(token) {
  if (typeof token !== 'string' || !/^p[12]_[A-Za-z0-9_-]{60,1500}$/.test(token)) throw new Error('This personal link is incomplete or invalid.');
  const legacy = token.startsWith('p1_');
  const bytes = decode(token.slice(3));
  const keySize = legacy ? 32 : 16;
  if (bytes.length < keySize + 12 + 17) throw new Error('Incomplete invitation');
  const key = await crypto.subtle.importKey('raw', bytes.slice(0, keySize), 'AES-GCM', false, ['decrypt']);
  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: bytes.slice(keySize, keySize + 12), additionalData: encoder.encode(`nirpeksh-shweta-invitation:v${legacy ? 1 : 2}`) }, key, bytes.slice(keySize + 12));
  const value = decoder.decode(plaintext);
  return greetingValue(legacy ? JSON.parse(value)?.greeting : value);
}
export function invitationUrl(base, token) {
  const url = new URL(base);
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['127.0.0.1', 'localhost'].includes(url.hostname))) throw new Error('Use a secure invitation website.');
  if (url.username || url.password) throw new Error('Invalid invitation address.');
  url.search = ''; url.hash = `invite=${token}`;
  return url.href;
}
