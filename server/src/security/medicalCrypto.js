const crypto = require('crypto');

function aeadWrap(key, plaintext) {
  if (!Buffer.isBuffer(key) || key.length !== 32) throw new Error('Key 32 bytes required');
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString('base64')}:${tag.toString('base64')}:${enc.toString('base64')}`;
}

function aeadUnwrap(key, blob) {
  const [v, ivb64, tagb64, encb64] = String(blob).split(':');
  if (v !== 'v1') throw new Error('Unsupported blob format');
  const iv = Buffer.from(ivb64, 'base64');
  const tag = Buffer.from(tagb64, 'base64');
  const enc = Buffer.from(encb64, 'base64');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  const dec = Buffer.concat([decipher.update(enc), decipher.final()]);
  return dec.toString('utf8');
}

module.exports = { aeadWrap, aeadUnwrap };


