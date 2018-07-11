Feature: Data Request Flow

    Scenario: AS client register service
        Given The "IDP,RP,AS" platform is running
        And AS client making a request for register service
            """json
            {
            "reference_id":"Random Generate",
            "callback_url":"http://localhost:1090/as/service",
            "min_ial": 1.1,
            "min_aal": 1,
            "url": "http://localhost:1090/service/bank_statement"
            }
            """
        When AS client make a POST request for "register service" to "/as/service/bank_statement"
        Then The response status code should be "202"
        And AS client should receive add or update service result

    Scenario: IDP client set callback url
        Given IDP client making a request for set callback url
            """json
            {
            "incoming_request_url":"http://localhost:1080/idp/request",
            "accessor_sign_url":"http://localhost:1080/idp/accessor/sign",
            "error_url":"http://localhost:1080/idp/error"
            }
            """
        When IDP client make a POST request for "set callback url" to "/idp/callback"
        Then The response status code should be "204"

    Scenario: IDP client create new identity
        Given IDP client making a request for create new identity
            """json
            {
            "namespace":"cid",
            "identifier":"1234",
            "reference_id": "Random Generate",
            "accessor_type":"RSA",
            "accessor_public_key":"awsome-key",
            "callback_url":"http://localhost:1080/idp/identity",
            "ial":2.3
            }
            """
        When IDP client make a POST request for create new identity to "/identity"
        Then The response status code should be "202"
        And The response for create new identity
        And IDP client should receive create identity request result
        And IDP client should receive create identity result and success should be "true"

    Scenario: RP client create request
        Given RP client making a request for create request
            """json
            {
            "mode":3,
            "reference_id":"Random Generate",
            "idp_id_list":[],
            "callback_url":"http://localhost:1070/rp/request/",
            "data_request_list":
            [{
            "service_id": "bank_statement",
            "as_id_list": ["as1", "as2", "as3"],
            "min_as": 1,
            "request_params": { "format": "pdf" }
            }],
            "request_message":"dummy Request Message",
            "min_ial":1.1,
            "min_aal":1,
            "min_idp":1,
            "request_timeout":86400
            }
            """
        When RP client make a POST request for create request to "/rp/requests/:namespace/:Identifier"
        Then The response status code should be "202"
        And The response property "request_id" is
        And RP client receive create request result and success should be "true"

    Scenario: IDP client create response
        Given IDP client should receive request from IDP platform
        And IDP client making a request for create response
            """json
            {
            "reference_id":"Random Generate",
            "status":"accept",
            "request_id":"Request ID from request",
            "ial": 3,
            "aal": 3,
            "secret": "Some secret",
            "signature": "Some signature",
            "accessor_id": "Some accessor_id",
            "callback_url":"http://localhost:1080/idp/reponse/Request ID from request"
            }
            """
        When IDP client make a POST request for "create response" to "/idp/response"
        Then The response status code should be "202"
        And IDP client should receive response result and success should be "true"
        And RP client should receive request status "confirmed"

        Given Platform send data request to AS client
        And AS client should receive data request from platform
        When AS client response data request to platform
        And AS client should receive reporting send data result and success should be "true"
        Then RP client should receive request status "completed"
        And RP client should receive data requested
        And RP client should receive request status "completed" and closed flag should be "true"
        