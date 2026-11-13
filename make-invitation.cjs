#!/usr/bin/env node
// No installation or external packages needed. Works with Node 14 and newer.
// Usage: node make-invitation.cjs "Kunal & family" [website URL]
const { randomBytes, createCipheriv } = require('crypto');
const DEFAULT_URL = 'https://nirpeksh.github.io/nirpeksh-shweta-wedding/';
function createLink(name, base = DEFAULT_URL) {
  if (typeof name !== 'string' || !name.trim() || name.length > 100 || /[\u0000-\u001f\u007f]/.test(name)) throw new Error('Enter a guest or family name of 1–100 characters.');
  const url = new URL(base);
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname))) throw new Error('Use an HTTPS invitation URL.');
  if (url.username || url.password) throw new Error('Do not include account details in the website address.');
  const key = randomBytes(16);
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-128-gcm', key, iv);
  cipher.setAAD(Buffer.from('nirpeksh-shweta-invitation:v2'));
  const encrypted = Buffer.concat([cipher.update(`Dear ${name.trim()}`, 'utf8'), cipher.final(), cipher.getAuthTag()]);
  const token = 'p2_' + Buffer.concat([key, iv, encrypted]).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  url.search = ''; url.hash = `invite=${token}`;
  return url.href;
}
module.exports = { createLink };
if (require.main === module) {
  try {
    if (!process.argv[2]) throw new Error('Usage: node make-invitation.cjs "Kunal & family" [website URL]');
    console.log(createLink(process.argv[2], process.argv[3] || DEFAULT_URL));
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
