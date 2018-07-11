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

function signMessage(messageToSign, privateKeyPath) {
  let result = spawnSync(
    'openssl',
    ['dgst', '-sha256', '-sign', privateKeyPath],
    { input: messageToSign }
  );
  return result.stdout.toString('base64');
}

async function accessorSign(sid, text) {
  let fileName = config.keyPath + sid;
  for(;;){
    if (fs.existsSync(fileName)){
      await new Promise((resolve, reject) => setTimeout(resolve, 500));
      let privateKey = fs.readFileSync(config.keyPath + sid, 'utf8');
      const encrypted = crypto.privateEncrypt(
        privateKey,
        Buffer.from(text, 'base64')
      );
      return encrypted.toString('base64');
    }
    await new Promise((resolve, reject) => setTimeout(resolve, 1000));
  }
  
}

module.exports = {
  genNewKeyPair:genNewKeyPair,
  signMessage:signMessage,
  accessorSign:accessorSign
}