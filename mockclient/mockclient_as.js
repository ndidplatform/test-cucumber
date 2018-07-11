const express = require('express');
const http = require('http');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const config = require('../config.js');
const uuidv1 = require('uuid/v1');
const { sendData } = require('./api.js');

const MOCK_SERVER_AS_IP = process.env.MOCK_SERVER_AS_IP || 'localhost';
const MOCK_SERVER_AS_PORT = process.env.MOCK_SERVER_AS_PORT || 1090;
const largeData = process.env.LARGE_DATA || 'false';

const redis = require('redis');

process.on('unhandledRejection', function(reason, p) {
  console.error('Unhandled Rejection:', p, '\nreason:', reason.stack || reason);
});
const app = express();

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

let server = http.createServer(app);

var pub = redis.createClient({
  host: config.REDIS_IP,
  port: config.REDIS_PORT,
});

let objLargeData;
if (largeData.toLowerCase() == 'true') {
  let dataFromFile = fs.readFileSync(path.join(__dirname, 'file5mb'), 'utf8');
  objLargeData = { data: dataFromFile };
}

app.post('/service/:service_id', async (req, res) => {
  const request = req.body;

  const { service_id } = req.params;

  pub.publish('AS_receive_data_request_from_platform', JSON.stringify(request));

  let data = largeData.toLowerCase() == 'true' ? objLargeData : { data: 'mock data' };

  data = {
    ...data,
    reference_id: uuidv1(),
    callback_url: config.CALLBACK_SEND_DATA_RESULT_URL_AS,
  };

  res.status(204).end();

  pub.publish('AS_send_data_to_platform', JSON.stringify(data));

  //Send data async
  sendData({
    request_id: request.request_id,
    service_id: request.service_id,
    data: data,
  });
});

app.post('/as/service', async (req, res) => {
  const request = req.body;
  pub.publish('AS_receive_reporting_add_service_result', JSON.stringify(request));
  res.status(204).end();
});

app.post('/as/data', async (req, res) => {
  const request = req.body;
  pub.publish('AS_receive_reporting_send_data_result', JSON.stringify(request));
  res.status(204).end();
});

server.listen(MOCK_SERVER_AS_PORT, () => {
  console.log(`Mock server AS listen on port ${MOCK_SERVER_AS_PORT}`);
});
