const express = require('express');
const http = require('http');
const bodyParser = require('body-parser');
const fs = require('fs');
const { spawnSync } = require('child_process');
const zkProof = require('../zkProof');
const config = require('../config.js');
const redis = require('redis');

const MOCK_SERVER_IDP_IP = process.env.MOCK_SERVER_IDP_IP || 'localhost';
const MOCK_SERVER_IDP_PORT = process.env.MOCK_SERVER_IDP_PORT || 1080;

var pub = redis.createClient({
  host: config.REDIS_IP,
  port: config.REDIS_PORT,
});

process.on('unhandledRejection', function(reason, p) {
  console.error('Unhandled Rejection:', p, '\nreason:', reason.stack || reason);
});

spawnSync('mkdir', ['-p', config.keyPath + 'accessor_id']);

const app = express();

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

let server = http.createServer(app);

app.post('/idp/identity', async (req, res) => {
  const request = req.body;
  if (request.type === 'create_identity_request_result') {
    pub.publish(
      'IDP_receive_create_identity_request_result_from_IDP_platform',
      JSON.stringify(request)
    );
  } else if (request.type === 'create_identity_result') {
    for (;;) {
      let fileName = config.keyPath + 'ReferenceId_' + request.reference_id;
      if (fs.existsSync(fileName)) {
        try {
          let sid = fs.readFileSync(fileName, 'utf8'); // Get sid that associated with reference_id in callback for persistent secret
          if (request.secret) {
            fs.writeFileSync(
              config.keyPath + 'secret_' + sid,
              request.secret,
              'utf8'
            );
          }
          break;
        } catch (error) {
          res.status(500).end();
          throw error;
        }
      }
      await new Promise((resolve, reject) => setTimeout(resolve, 2500));
    }
    pub.publish(
      'IDP_receive_create_identity_result_from_IDP_platform',
      JSON.stringify(request)
    );
  }
  res.status(204).end();
});

app.post('/idp/request', (req, res) => {
  const request = req.body;
  pub.publish('IDP_receive_request_from_IDP_platform', JSON.stringify(request));
  res.status(200).end();
});

app.post('/idp/accessor/sign', async (req, res) => {
  let request = req.body;
  let fileName = config.keyPath + request.sid;
  try {
    for (;;) {
      if (fs.existsSync(fileName)) {
        let accessor_private_key = fs.readFileSync(fileName, 'utf8');
        let signature = await zkProof.signMessage(
          request.sid,
          accessor_private_key
        );
        res.status(200).send({
          signature: signature,
        });
      }
      await new Promise((resolve, reject) => setTimeout(resolve, 2500));
    }
  } catch (error) {
    res.status(500).end();
  }
});

app.post('/idp/response/:reference_id', (req, res) => {
  const request = req.body;
  pub.publish(
    'IDP_receive_response_result_from_IDP_platform',
    JSON.stringify(request)
  );
  res.status(204).end();
});

server.listen(MOCK_SERVER_IDP_PORT, () => {
  console.log(`Mock server IDP listen on port ${MOCK_SERVER_IDP_PORT}`);
});
