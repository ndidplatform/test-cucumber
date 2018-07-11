const _ = require("lodash");
const http = require("request-promise");
const config = require("../../config");
var { setWorldConstructor } = require("cucumber");

function World() {
  const self = this;

  this.httpGet = async function(role, uri) {
    await _httpRequest({ method: "GET", uri: uri, role: role });
  };

  this.httpPost = async function(role, uri) {
    await _httpRequest({ method: "POST", uri: uri, role: role });
  };

  this.prettyPrintJSON = function(json) {
    return JSON.stringify(json, null, "  ");
  };

  this.getValue = function(object, path) {
    return _.get(object, path);
  };

  this.prettyPrintError = function(actualValue, expectedValue) {
    return `\r\nExpected: ${expectedValue}\r\nActual: ${actualValue}\r\nRequest Body:\r\n${self.prettyPrintJSON(
      self.requestBody
    )}\r\nResponse Status Code: ${
      self.statusCode
    }\r\nResponse Body:\r\n${self.prettyPrintJSON(self.actualResponse)}`;
  };

  async function _httpRequest(options) {
    let url = "";
    if (options.role == "IDP") {
      url = config.IDP_API_ADDRESS;
    } else if (options.role == "RP") {
      url = config.RP_API_ADDRESS;
    } else if (options.role == "AS") {
      url = config.AS_API_ADDRESS;
    }

    try {
      const response = await http({
        method: options.method,
        uri: url + options.uri,
        body: self.requestBody,
        json: true,
        resolveWithFullResponse: true,
        simple: false,
        rejectUnauthorized:false // for self signed https
      });
      self.statusCode = response.statusCode;
      self.actualResponse = response.body;
    } catch (e) {
      throw self.prettyPrintJSON(e);
    }
  }

  this.waitForCallback = async function() {
    await timeout(1500);
    return true;
  };
  
  function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

}

module.exports = {
  World: World
};
