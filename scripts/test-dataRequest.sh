#!/bin/bash

node $(dirname $0)/../mockclient/mockclient_idp.js & 
node $(dirname $0)/../mockclient/mockclient_as.js & 
node $(dirname $0)/../mockclient/mockclient_rp.js & 
$(dirname $0)/../node_modules/.bin/cucumber-js --format json:./test-result-dataRequest.json features/data_request_flow/data_request_flow.feature --require features/data_request_flow/