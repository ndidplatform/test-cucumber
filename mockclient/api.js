const fetch = require("node-fetch");
const config = require("../config.js");

async function sendData(data){
  try {
    const response = await fetch(`${config.AS_API_ADDRESS}/as/data/${data.request_id}/${data.service_id}`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data.data)
      }
    );
    if (!response.ok) {
      if (response.status === 400 || response.status === 500) {
        const errorJson = await response.json();
        throw errorJson;
      }
      throw response;
    }
    return;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  sendData:sendData
};
