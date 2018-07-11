const HTTP_PROTOCOL = process.env.HTTPS === "true" ? "https" : "http";
const MOCK_HTTP_PROTOCOL = process.env.MOCK_HTTPS === "true" ? "https" : "http";

//IDP API
const IDP_API_IP = process.env.IDP_API_IP || "localhost";
const IDP_API_PORT = process.env.IDP_API_PORT || 8100; //8081;
const IDP_API_ADDRESS = `${HTTP_PROTOCOL}://${IDP_API_IP}:${IDP_API_PORT}`;

//RP API
const RP_API_IP = process.env.RP_API_IP || "localhost";
const RP_API_PORT = process.env.RP_API_PORT || 8200; //8082;
const RP_API_ADDRESS = `${HTTP_PROTOCOL}://${RP_API_IP}:${RP_API_PORT}`;

//AS API
const AS_API_IP = process.env.AS_API_IP || "localhost";
const AS_API_PORT = process.env.AS_API_PORT || 8300; //8083;
const AS_API_ADDRESS = `${HTTP_PROTOCOL}://${AS_API_IP}:${AS_API_PORT}`;

//MOCK SERVER RP
const MOCK_SERVER_RP_IP = process.env.MOCK_SERVER_RP_IP || "localhost";
const MOCK_SERVER_RP_PORT = process.env.MOCK_SERVER_RP_PORT || "1070";
const CALLBACK_URL_RP =
  `${MOCK_HTTP_PROTOCOL}://${MOCK_SERVER_RP_IP}:${MOCK_SERVER_RP_PORT}/rp/request/` ||
  "http://localhost:1070/rp/request/";

//MOCK SERVER IDP
const MOCK_SERVER_IDP_IP = process.env.MOCK_SERVER_IDP_IP || "localhost";
const MOCK_SERVER_IDP_PORT = process.env.MOCK_SERVER_IDP_PORT || "1080";
const CALLBACK_URL_IDP =
  `${MOCK_HTTP_PROTOCOL}://${MOCK_SERVER_IDP_IP}:${MOCK_SERVER_IDP_PORT}/idp/request` ||
  "http://localhost:1080/idp/request";
const ACCESSOR_CALLBACK_URL_IDP =
  `${MOCK_HTTP_PROTOCOL}://${MOCK_SERVER_IDP_IP}:${MOCK_SERVER_IDP_PORT}/idp/accessor/sign` ||
  "http://localhost:1080/idp/accessor/sign";
const IDENTITY_CALLBACK_URL_IDP =
  `${MOCK_HTTP_PROTOCOL}://${MOCK_SERVER_IDP_IP}:${MOCK_SERVER_IDP_PORT}/idp/identity` ||
  "http://localhost:1080/idp/identity";
const REPONSE_RESULT_CALLBACK_URL_IDP =
  `${MOCK_HTTP_PROTOCOL}://${MOCK_SERVER_IDP_IP}:${MOCK_SERVER_IDP_PORT}/idp/response/` ||
  "http://localhost:1080/idp/response/";
const ERROR_CALLBACK_URL_IDP =
  `${MOCK_HTTP_PROTOCOL}://${MOCK_SERVER_IDP_IP}:${MOCK_SERVER_IDP_PORT}/idp/error` ||
  "http://localhost:1080/idp/error";

//MOCK SERVER AS
const MOCK_SERVER_AS_IP = process.env.MOCK_SERVER_AS_IP || "localhost";
const MOCK_SERVER_AS_PORT = process.env.MOCK_SERVER_AS_PORT || "1090";
const CALLBACK_SERVICE_URL_AS =
  `${MOCK_HTTP_PROTOCOL}://${MOCK_SERVER_AS_IP}:${MOCK_SERVER_AS_PORT}/service/` ||
  "http://localhost:1090/service/";
const CALLBACK_SERVICE_RESULT_URL_AS =
  `${MOCK_HTTP_PROTOCOL}://${MOCK_SERVER_AS_IP}:${MOCK_SERVER_AS_PORT}/as/service` ||
  "http://localhost:1090/as/service";
const CALLBACK_SEND_DATA_RESULT_URL_AS =
  `${MOCK_HTTP_PROTOCOL}://${MOCK_SERVER_AS_IP}:${MOCK_SERVER_AS_PORT}/as/data` ||
  "http://localhost:1090/as/data";

//REDIS
const REDIS_IP = process.env.REDIS_IP || "localhost";
const REDIS_PORT = process.env.REDIS_PORT || "6379";

//PERSISTANT
const keyPath = "./persistent_db/dev_user_key/";

module.exports = {
  IDP_API_IP: IDP_API_IP,
  IDP_API_PORT: IDP_API_PORT,
  IDP_API_ADDRESS: IDP_API_ADDRESS,

  RP_API_IP: RP_API_IP,
  RP_API_PORT: RP_API_PORT,
  RP_API_ADDRESS: RP_API_ADDRESS,

  AS_API_IP: AS_API_IP,
  AS_API_PORT: AS_API_PORT,
  AS_API_ADDRESS: AS_API_ADDRESS,

  //MOCK SERVER RP
  CALLBACK_URL_RP: CALLBACK_URL_RP,

  //MOCK SERVER IDP
  CALLBACK_URL_IDP: CALLBACK_URL_IDP,
  ACCESSOR_CALLBACK_URL_IDP: ACCESSOR_CALLBACK_URL_IDP,
  IDENTITY_CALLBACK_URL_IDP: IDENTITY_CALLBACK_URL_IDP,
  REPONSE_RESULT_CALLBACK_URL_IDP: REPONSE_RESULT_CALLBACK_URL_IDP,
  ERROR_CALLBACK_URL_IDP: ERROR_CALLBACK_URL_IDP,
  //MOCK SERVER AS
  CALLBACK_SERVICE_URL_AS: CALLBACK_SERVICE_URL_AS,
  CALLBACK_SERVICE_RESULT_URL_AS: CALLBACK_SERVICE_RESULT_URL_AS,
  CALLBACK_SEND_DATA_RESULT_URL_AS:CALLBACK_SEND_DATA_RESULT_URL_AS,
  
  REDIS_IP: REDIS_IP,
  REDIS_PORT: REDIS_PORT,

  keyPath: keyPath,

  MOCK_HTTP_PROTOCOL: MOCK_HTTP_PROTOCOL
};
