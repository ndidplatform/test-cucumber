## Getting started

1.  Install dependencies

    ```sh
    npm install
    ```
2.  Run docker smart contract (tendermint ABCI app) server in smart-contract repository (https://github.com/ndidplatform/smart-contract)
3.  Run docker NDID API in api repository (https://github.com/ndidplatform/api)

## Run Test in docker

Required

- Docker CE 17.06+ [Install docker](https://docs.docker.com/install/)
- docker-compose 1.14.0+ [Install docker-compose](https://docs.docker.com/compose/install/)

### Build

    npm run docker-build

### Run Test Authentication flow (IDP,RP)

    npm run docker-authen-up
    
### Run Test Data Request flow (IDP,RP,AS)

    npm run docker-dataRequest-up