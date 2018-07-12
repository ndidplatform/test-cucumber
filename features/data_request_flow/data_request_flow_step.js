const assert = require('assert');
const { Given, When, Then, AfterAll, After } = require('cucumber');
const config = require('../../config.js');
const uuidv1 = require('uuid/v1');
const zkProof = require('../../zkProof');
const fs = require('fs');
const path = require('path');
const exec = require('child_process').exec;
const redis = require('redis');
const sub = redis.createClient({
  host: config.REDIS_IP,
  port: config.REDIS_PORT,
});

//IDP create identity and RP create request
let namespace = process.env.NS;
let identifier = process.env.ID;
let identity_ial = process.env.IDENTITY_IAL || 2.3; //For IDP create identity
//RP create request
let mode = process.env.MODE;
let min_idp = process.env.MIN_IDP;
let min_ial = process.env.MIN_IAL;
let min_aal = process.env.MIN_AAL;
//IDP create response
let ial = process.env.IAL;
let aal = process.env.AAL;
let status = process.env.STATUS;
//AS register service
let service_id = process.env.SERVICE_ID || 'bank_statement';

//Timed out for RP client wait callback status from platform
let timeoutWaitStatus = parseInt(
  process.env.TIMEOUT_WAIT_STATUS_FROM_IDP || '20000'
);
//Timed out for IDP client wait create identity request result from platform
let timeoutWaitCreateIdentityRequestResult = parseInt(
  process.env.TIMEOUT_WAIT_CREATE_IDENTITY_REQUEST_RESULT || '20000'
);
//Timed out for IDP client wait create identity result from platform
let timeoutWaitCreateIdentityResult = parseInt(
  process.env.TIMEOUT_WAIT_ONBOARD_REQUEST || '20000'
);
//Timed out for RP client wait create request result
let timeoutWaitCreateRequestResult = parseInt(
  process.env.TIMEOUT_WAIT_CREATE_REQUEST_RESULT || '20000'
);
//Timed out for IDP client wait create response result
let timeoutWaitResponseResult = parseInt(
  process.env.TIMEOUT_WAIT_RESPONSE_RESULT || '20000'
);
//Timed out for AS client wait reporting send data result
let timeoutWaitSendDataResult = parseInt(
  process.env.TIMEOUT_WAIT_SEND_DATA_RESULT || '20000'
);
//Timed out for AS client wait reporting add/update serivce result
let timeoutWaitAddServiceResult = parseInt(
  process.env.TIMEOUT_WAIT_ADD_SERVICE_RESULT || '20000'
);
//Timed out for exit test when test finish
const exitWhenFinish = parseInt(process.env.EXIT_WHEN_FINISH) || 5000;
//Timed out for RP wait data from AS
let timeoutWaitDataFromAS = parseInt(
  process.env.TIMEOUT_WAIT_DATA_FROM_AS || '20000'
);

let _ReferenceId = {};

function ReferenceId(role) {
  if (!_ReferenceId[role]) {
    let refId = uuidv1();
    _ReferenceId[role] = refId;
    return _ReferenceId[role];
  } else {
    return _ReferenceId[role];
  }
}
//RP
let RequestStatusFromRpPlatform;
let CreateRequestResultFromRpPlatform;
let ReceiveDataRequestedFromPlatform;
//IDP
let CreateIdentityRequestResult;
let CreateIdentityResult;
let RequestFromIdpPlatform;
let ResponseResult;
//AS
let DataRequestFromASPlatform;
let ASSendDataToPlatform;
let ASAddServiceResult;
let ASSendDataResult;

sub.on('message', function(ch, message) {
  let result = JSON.parse(message);
  if (ch === 'RP_receive_request_status_from_RP_platform') {
    //RP client receive request status from RP platform
    if (result.refId === ReferenceId('RP')) {
      delete result['refId'];
      RequestStatusFromRpPlatform = result;
      console.log(
        '\nRP client receive callback: \n',
        RequestStatusFromRpPlatform
      );
    }
  } else if (ch === 'RP_receive_create_request_result_from_RP_platform') {
    //RP client receive create request result from RP platform
    CreateRequestResultFromRpPlatform = result;
  } else if (ch === 'RP_receive_data_requested_from_platform') {
    //RP client receive data requested from platform
    ReceiveDataRequestedFromPlatform = result;
  } else if (ch === 'IDP_receive_request_from_IDP_platform') {
    //IDP client receive request from IDP platform
    RequestFromIdpPlatform = result;
  } else if (
    ch === 'IDP_receive_create_identity_request_result_from_IDP_platform'
  ) {
    //IDP client receive create identity request result from IDP platform
    if (result.reference_id === ReferenceId('IDP_CREATE_IDENTITY')) {
      CreateIdentityRequestResult = result;
    }
  } else if (ch === 'IDP_receive_create_identity_result_from_IDP_platform') {
    //IDP client receive create identity result from IDP platform
    if (result.reference_id === ReferenceId('IDP_CREATE_IDENTITY')) {
      CreateIdentityResult = result;
    }
  } else if (ch === 'IDP_receive_response_result_from_IDP_platform') {
    //IDP client receive response result from IDP platform
    if (result.reference_id === ReferenceId('IDP_RESPONSE')) {
      ResponseResult = result;
    }
  } else if (ch === 'AS_receive_reporting_add_service_result') {
    //AS client receive reporting add service result from AS platform
    ASAddServiceResult = result;
  } else if (ch === 'AS_receive_data_request_from_platform') {
    //AS client receive data request from platform
    DataRequestFromASPlatform = result;
  } else if (ch === 'AS_send_data_to_platform') {
    //AS client send data to platform
    ASSendDataToPlatform = result;
  } else if (ch === 'AS_receive_reporting_send_data_result') {
    //AS client receive reporting send data result to platform
    ASSendDataResult = result;
  }
});

//RP subscribe
sub.subscribe('RP_receive_request_status_from_RP_platform');
sub.subscribe('RP_receive_create_request_result_from_RP_platform');
sub.subscribe('RP_receive_data_requested_from_platform');

//IDP subscribe
sub.subscribe('IDP_receive_request_from_IDP_platform');
sub.subscribe('IDP_receive_create_identity_request_result_from_IDP_platform');
sub.subscribe('IDP_receive_create_identity_result_from_IDP_platform');
sub.subscribe('IDP_receive_response_result_from_IDP_platform');

//AS subscribe
sub.subscribe('AS_receive_data_request_from_platform');
sub.subscribe('AS_send_data_to_platform');
sub.subscribe('AS_receive_reporting_add_service_result');
sub.subscribe('AS_receive_reporting_send_data_result');

let hasFailed = false;
AfterAll(function() {
  setTimeout(function() {
    try {
      let testResult = exec(
        `sh ${path.join(
          __dirname,
          '..',
          '..',
          'scripts',
          'test-result-to-junit-xml.sh'
        )} test-result-dataRequest`
      );
      testResult.stdout.on('data', function(data) {
        console.log(data);
      });
      testResult.stderr.on('data', function(data) {
        console.log(data);
      });
    } catch (error) {
      throw error;
    } finally {
      setTimeout(function() {
        if (hasFailed) {
          process.exit(1);
        } else {
          process.exit(0);
        }
      }, exitWhenFinish);
    }
  }, 1000);
});

After(function(scenario) {
  if (scenario.result.status === 'failed') {
    hasFailed = true;
  }
});

//########### IDP ###########
Given('IDP client making a request for set callback url', function(data) {
  let dataRequest = JSON.parse(data);
  this.requestBody = {
    ...dataRequest,
    incoming_request_url: config.CALLBACK_URL_IDP,
    accessor_sign_url: config.ACCESSOR_CALLBACK_URL_IDP,
    error_url: config.ERROR_CALLBACK_URL_IDP,
  };
  console.log(
    '\nIDP client making a request for set callback url\n',
    this.requestBody
  );
});

Given('IDP client making a request for create new identity', function(data) {
  let dataRequest = JSON.parse(data);
  let ns = namespace == null ? 'cid' : namespace;
  let id = identifier == null ? uuidv1() : identifier;
  let sid = ns + ':' + id;
  zkProof.genNewKeyPair(sid);
  let accessor_public_key = fs.readFileSync(
    config.keyPath + sid + '.pub',
    'utf8'
  );
  this.requestBody = {
    ...dataRequest,
    namespace: ns,
    identifier: id,
    reference_id: ReferenceId('IDP_CREATE_IDENTITY'),
    accessor_type: 'RSA',
    accessor_public_key,
    //accessor_id: 'some-awesome-accessor-for-' + sid + '-with-nonce-' + nonce,
    ial: identity_ial == null ? dataRequest.ial : parseFloat(identity_ial),
    callback_url: config.IDENTITY_CALLBACK_URL_IDP,
  };

  namespace = this.requestBody.namespace;
  identifier = this.requestBody.identifier;

  //Keep mapping ReferenceId -> sid for keep persistent secret 
  //when received callback /idp/identity type create_identity_result
  fs.writeFileSync(
    config.keyPath + 'ReferenceId_' + ReferenceId('IDP_CREATE_IDENTITY'),
    sid,
    'utf8'
  );

  console.log(
    '\nIDP Create new identity \n',
    this.prettyPrintJSON(this.requestBody)
  );
});

Given('IDP client should receive request from IDP platform', function(callback) {
  let interval = setInterval(() => {
    if (RequestFromIdpPlatform) {
      console.log(
        '\nIDP client receive request from IDP platform\n',
        RequestFromIdpPlatform
      );
      clearInterval(interval);
      callback();
    }
  }, 500);
});

Given('IDP client making a request for create response', function(data,callback) {
  if (RequestFromIdpPlatform) {
    let sid =RequestFromIdpPlatform.namespace +':'+RequestFromIdpPlatform.identifier;
    let accessor_private_key = fs.readFileSync(config.keyPath + sid,'utf8');
    let dataRequest = JSON.parse(data);
    this.requestBody = {
      ...dataRequest,
      reference_id: ReferenceId('IDP_RESPONSE'),
      request_id: RequestFromIdpPlatform.request_id,
      status:status == null? dataRequest.status: status.toLowerCase() === 'random'? randomStatus: status,
      ial: ial == null ? RequestFromIdpPlatform.min_ial : parseFloat(ial),
      aal: aal == null ? RequestFromIdpPlatform.min_aal : parseFloat(aal),
      secret: fs.readFileSync(config.keyPath + 'secret_' + sid, 'utf8'),
      signature: zkProof.signMessage(
        RequestFromIdpPlatform.request_message,
        accessor_private_key
      ),
      accessor_id: fs.readFileSync(config.keyPath + 'accessor_id/' + sid, 'utf8'),
      callback_url:
        config.REPONSE_RESULT_CALLBACK_URL_IDP + ReferenceId('IDP_RESPONSE'),
    };
    console.log(
      '\nIDP client making a request for create response\n',
      this.requestBody
    );
    callback();
  } else {
    callback(new Error('There is no callback from IDP platform to IDP client'));
  }
});

When('IDP client make a POST request for {string} to {string}',{ timeout: -1 },async function(string, uri) {
    console.log('\nIDP client make a POST request for', string, ' to ', uri);
    await this.httpPost('IDP', uri);
  }
);

When('IDP client make a POST request for create new identity to {string}',{ timeout: -1 },async function(uri) {
    console.log('\nIDP client make a POST request for create new identity to ',uri);
    await this.httpPost('IDP', uri);
  }
);

Then('The response for create new identity', function(callback) {
  if (this.actualResponse) {
    console.log('\nThe response for create new identity: ',this.prettyPrintJSON(this.actualResponse));
    let sid = namespace + ':' + identifier;
    fs.writeFileSync(
      config.keyPath + 'accessor_id/' + sid,
      this.actualResponse.accessor_id,
      'utf8'
    );
    callback();
  }
});

Then('IDP client should receive response result and success should be {string}',{ timeout: timeoutWaitResponseResult },function(expectedValue, callback) {
    let interval = setInterval(() => {
      if (ResponseResult) {
        const actualValue = this.getValue(ResponseResult, 'success').toString();
        assert.equal(
          actualValue,
          expectedValue,
          this.prettyPrintError(actualValue, expectedValue)
        );
        console.log(
          '\nIDP client receive response result: \n',
          this.prettyPrintJSON(ResponseResult)
        );
        clearInterval(interval);
        callback();
      }
    }, 500);
  }
);


Then('IDP client should receive create identity request result',{ timeout: timeoutWaitCreateIdentityRequestResult },function(callback) {
  let interval = setInterval(() => {
    if (CreateIdentityRequestResult) {
      console.log(
        '\nIDP client receive create identity request result\n',
        this.prettyPrintJSON(CreateIdentityRequestResult)
      );
      clearInterval(interval);
      callback();
    }
  }, 500);
}
);

Then('IDP client should receive create identity result and success should be {string}',{ timeout: timeoutWaitCreateIdentityResult },function(expectedValue, callback) {
  let interval = setInterval(() => {
    if (CreateIdentityResult) {
      const actualValue = this.getValue(CreateIdentityResult, 'success').toString();
      assert.equal(
        actualValue,
        expectedValue,
        this.prettyPrintError(actualValue, expectedValue)
      );
      console.log(
        '\nIDP client receive create identity result\n',
        this.prettyPrintJSON(CreateIdentityResult)
      );
      clearInterval(interval);
      callback();
    }
  }, 500);
}
);

//########### RP ###########
Given('RP client making a request for create request', function(data) {
  let dataRequest = JSON.parse(data);
  let dataRequestList = [
    {
      ...dataRequest.data_request_list[0],
      request_params: JSON.stringify(
        dataRequest.data_request_list[0].request_params
      ),
    },
  ];

  this.requestBody = {
    ...dataRequest,
    mode: mode == null ? dataRequest.mode : parseInt(mode),
    reference_id: ReferenceId('RP'),
    callback_url: config.CALLBACK_URL_RP + ReferenceId('RP'),
    min_ial: min_ial == null ? dataRequest.min_ial : parseFloat(min_ial),
    min_aal: min_aal == null ? dataRequest.min_aal : parseFloat(min_aal),
    min_idp: min_idp == null ? dataRequest.min_idp : parseInt(min_idp),
    data_request_list: dataRequestList,
  };
  console.log(
    '\nRP client making a request for create request \n',
    this.requestBody
  );
});

When('RP client make a POST request for create request to {string}',async function(uri) {
    uri = `/rp/requests/${namespace}/${identifier}`;
    console.log(`\nRP client make a POST request for create request to ${uri}`);
    await this.httpPost('RP', uri);
  }
);

Then('RP client receive create request result and success should be {string}',{ timeout: timeoutWaitCreateRequestResult },
  function(expectedValue, callback) {
    let interval = setInterval(() => {
      if (CreateRequestResultFromRpPlatform) {
        const actualValue = this.getValue(CreateRequestResultFromRpPlatform, 'success').toString();
        assert.equal(
          actualValue,
          expectedValue,
          this.prettyPrintError(actualValue, expectedValue)
        );
        console.log('\nRP client receive create request result: \n',this.prettyPrintJSON(CreateRequestResultFromRpPlatform));
        clearInterval(interval);
        callback();
      }
    }, 500);
  }
);

Then('RP client should receive request status {string}',{ timeout: timeoutWaitStatus },function(expectedValue, callback) {
    let interval = setInterval(() => {
      if (RequestStatusFromRpPlatform) {
        if (
          RequestStatusFromRpPlatform.status === expectedValue &&
          RequestStatusFromRpPlatform.min_idp ===
            RequestStatusFromRpPlatform.answered_idp_count
        ) {
          clearInterval(interval);
          assert.equal(
            RequestStatusFromRpPlatform.status,
            expectedValue,
            this.prettyPrintError(
              RequestStatusFromRpPlatform.status,
              expectedValue
            )
          );
          callback();
        }
      }
    }, 500);
  }
);

Then('RP client should receive data requested',{ timeout: timeoutWaitDataFromAS },function(callback) {
    let uri = `/rp/requests/data/${ReceiveDataRequestedFromPlatform.request_id}`;
    let interval = setInterval(async () =>{
      await this.httpGet('RP', uri);
      console.log(
        '\nRP client receive data requested\n',
        this.prettyPrintJSON(this.actualResponse)
      );
      clearInterval(interval);
      callback();
    }, 500);
  }
);

Then('RP client should receive request status {string} and closed flag should be {string}',function(status, flag, callback) {
    let boolFlag = flag === 'true' ? true : false;
    let interval = setInterval(() => {
      if (
        RequestStatusFromRpPlatform.status === status &&
        RequestStatusFromRpPlatform.closed === boolFlag
      ) {
        callback();
      }
    }, 500);
  }
);

//########### AS ###########
Given('AS client making a request for register service', function(data) {
  let dataRequest = JSON.parse(data);
  this.requestBody = {
    ...dataRequest,
    reference_id: ReferenceId('AS_REGISTER_SERVICE'),
    url: config.CALLBACK_SERVICE_URL_AS + service_id,
    min_ial: min_ial == null ? dataRequest.min_ial : parseFloat(min_ial),
    min_aal: min_aal == null ? dataRequest.min_aal : parseFloat(min_aal),
    callback_url: config.CALLBACK_SERVICE_RESULT_URL_AS,
  };

  console.log('\nAS client making a request for register service\n',this.requestBody);
});

Given('AS client should receive data request from platform', function(callback) {
  let interval = setInterval(() =>{
    if (DataRequestFromASPlatform) {
      console.log('\nAS client receive data request from platform\n',DataRequestFromASPlatform);
      clearInterval(interval);
      callback();
    }
  }, 500);
});

When('AS client make a POST request for {string} to {string}',{ timeout: -1 },async function(string, uri) {
    console.log(`\nAS client make a POST request for ${string} to ${uri}`);
    await this.httpPost('AS', uri);
  }
);

When('AS client response data request to platform',function(callback) {
  let interval = setInterval(() => {
    if (ASSendDataToPlatform) {
      console.log('\nAS client response data request to platform\n',ASSendDataToPlatform);
      clearInterval(interval);
      callback();
    }
  }, 500);
});

When('AS client should receive reporting send data result and success should be {string}',{ timeout: timeoutWaitSendDataResult },function(expectedValue, callback) {
    let interval = setInterval(() => {
      if (ASSendDataResult) {
        const actualValue = this.getValue(ASSendDataResult, 'success').toString();
        assert.equal(
          actualValue,
          expectedValue,
          this.prettyPrintError(actualValue, expectedValue)
        );
        console.log(
          '\nAS client receive reporting send data result: \n',
          this.prettyPrintJSON(ASSendDataResult)
        );
        clearInterval(interval);
        callback();
      }
    }, 500);
  }
);

Then('AS client should receive add or update service result',{ timeout: timeoutWaitAddServiceResult },function(callback) {
  let interval = setInterval(() => {
    if (ASAddServiceResult) {
      console.log('\nAS client receive add/update service result\n',this.prettyPrintJSON(ASAddServiceResult));
      clearInterval(interval);
      callback();
    }
  }, 500);
}
);

//########### Common ###########
Given('The {string} platform is running', function(string, callback) {
  callback();
});

Given('Platform send data request to AS client', function(callback) {
  callback();
});

Then('The response status code should be {string}', { timeout: -1 }, function(
  expectedValue,
  callback
) {
  assert.equal(
    this.statusCode,
    expectedValue,
    this.prettyPrintError(this.statusCode, expectedValue)
  );
  console.log(`\nThe response status code ${this.statusCode}`);
  callback();
});

Then('The response property {string} is', async function(property) {
  const actualValue = this.getValue(this.actualResponse, property);
  console.log(property + ' is ' + actualValue);
});
