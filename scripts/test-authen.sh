#!/bin/bash

node $(dirname $0)/../mockclient/mockclient_idp.js & 
node $(dirname $0)/../mockclient/mockclient_rp.js & 
$(dirname $0)/../node_modules/.bin/cucumber-js --format json:./test-result-authen.json features/authentication_flow/authentication_flow.feature --require features/authentication_flow/