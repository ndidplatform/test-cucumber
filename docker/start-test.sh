#!/bin/bash

wait_for_api_to_be_ready(){
    local IP=$1
    local PORT=$2
    local HTTP="http://"

    if [ "$(echo "${HTTPS}")" = "true" ]; then
        HTTP="https://"
    fi

    echo "Waiting for API at ${IP}:${PORT} to be ready..."

    while true; do
        local DATA=$(curl -sk ${HTTP}${IP}:${PORT}/info \
        -w '%{http_code}' \
        -o /dev/null) 
        
        if [ "${DATA}" = "200" ]; then
            break
        fi
        sleep 1
    done
}

wait_until_api_to_be_ready() {
  until wait_for_api_to_be_ready ${IDP_API_IP} ${IDP_API_PORT}; do sleep 1; done;
  until wait_for_api_to_be_ready ${AS_API_IP} ${AS_API_PORT}; do sleep 1; done;
  until wait_for_api_to_be_ready ${RP_API_IP} ${RP_API_PORT}; do sleep 1; done;
}


case ${START} in
authen)
    wait_until_api_to_be_ready
    sleep 1
    ./scripts/test-authen.sh
    ;;
dataRequest)
    wait_until_api_to_be_ready
    sleep 1
    ./scripts/test-dataRequest.sh
    ;;
esac