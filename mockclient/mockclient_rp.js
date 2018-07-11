const express = require('express');
const http = require('http');
const bodyParser = require('body-parser');
var redis = require('redis');
const config = require('../config.js');

var pub = redis.createClient({
  host: config.REDIS_IP,
  port: config.REDIS_PORT,
});

const MOCK_SERVER_RP_IP = process.env.MOCK_SERVER_RP_IP || 'localhost';
const MOCK_SERVER_RP_PORT = process.env.MOCK_SERVER_RP_PORT || 1070;

process.on('unhandledRejection', function(reason, p) {
  console.error('Unhandled Rejection:', p, '\nreason:', reason.stack || reason);
});

const app = express();
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

let server = http.createServer(app);

app.post('/rp/request/:referenceId', (req, res) => {
  if (req.body.type === 'request_status') {
    //Receive data requested from platform
    if (
      req.body.status === 'completed' &&
      req.body.service_list &&
      req.body.service_list.length > 0
    ) {
      let data = { ...req.body, refId: req.params.referenceId };
      pub.publish('RP_receive_data_requested_from_platform', JSON.stringify(data));
    }
    //Receive request status that idp response from platform
    let data = { ...req.body, refId: req.params.referenceId };
    pub.publish('RP_receive_request_status_from_RP_platform', JSON.stringify(data));
  } else if (req.body.type === 'create_request_result') {
    //Receive create request result from platform
    let data = req.body;
    pub.publish(
      'RP_receive_create_request_result_from_RP_platform',
      JSON.stringify(data)
    );
  }
  res.status(200).end();
});

server.listen(MOCK_SERVER_RP_PORT, () => {
  console.log(`Mock server RP listen on port ${MOCK_SERVER_RP_PORT}`);
});
