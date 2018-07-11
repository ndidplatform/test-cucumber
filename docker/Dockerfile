FROM node:8-alpine as build

COPY package*.json /ndid-test/

RUN apk update && apk add --virtual .build-deps \
    python \
    make \
    g++ \
    && \
    cd /ndid-test && npm install && \
    apk del .build-deps


FROM node:8-alpine

RUN apk update && apk add --no-cache bash openssl jq curl

WORKDIR /ndid-test

COPY . /ndid-test

COPY docker/start-test.sh /ndid-test

COPY --from=build /ndid-test/node_modules /ndid-test/node_modules

ENTRYPOINT ["./start-test.sh"]
