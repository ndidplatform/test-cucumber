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

case ${START} in
authen)
    ./scripts/test-authen.sh
    ;;
dataRequest)
    ./scripts/test-dataRequest.sh
    ;;
esac