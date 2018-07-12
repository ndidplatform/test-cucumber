const crypto = require('crypto');
const { spawnSync } = require('child_process');
const fs = require('fs');
const config = require('./config.js')

function genNewKeyPair(sid) {
  let pathSid = config.keyPath + sid;
  if (fs.existsSync(pathSid)) return;
  let gen = spawnSync('openssl', ['genrsa', '-out', pathSid, '2048']);
  let encode = spawnSync('openssl', [
    'rsa',
    '-in',
    pathSid,
    '-pubout',
    '-out',
    pathSid + '.pub',
  ]);
  if (gen.status !== 0 || encode.status !== 0) {
    throw new Error('Failed in genNewKeyPair()');
  }
}

function signMessage(message, privateKey) {
  return crypto
    .createSign('SHA256')
    .update(message)
    .sign(privateKey, 'base64');
}

module.exports = {
  genNewKeyPair:genNewKeyPair,
  signMessage:signMessage,
}