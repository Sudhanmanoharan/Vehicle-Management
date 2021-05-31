#!/bin/bash

# Exit on first error
set -e

# Chaincode Language
CC_SRC_LANGUAGE="go"
CC_SRC_PATH="../chaincode/fabcar/go/"

CC_SRC_LANGUAGE=${1:-"go"}
CC_SRC_LANGUAGE=$(echo "$CC_SRC_LANGUAGE" | tr [:upper:] [:lower:])

if [ "$CC_SRC_LANGUAGE" = "go" -o "$CC_SRC_LANGUAGE" = "golang" ]; then
    CC_SRC_PATH="../chaincode/fabcar/go/"
elif [ "$CC_SRC_LANGUAGE" = "javascript" ]; then
    CC_SRC_PATH="../chaincode/fabcar/javascript/"
else
    echo The chaincode language ${CC_SRC_LANGUAGE} is not supported by this script
    echo Supported chaincode languages are: go, java, javascript, and typescript
    exit 1
fi

# clean out any old identites in the wallets
rm -rf ../api/fabcar/javascript/wallet

# launch network; create channel and join peer to channel
pushd ../test-network
./network.sh up createChannel -ca -s couchdb
./network.sh deployCC -ccn fabcarApp -ccv 1 -cci InitLedger -ccl ${CC_SRC_LANGUAGE} -ccp ${CC_SRC_PATH}
popd
