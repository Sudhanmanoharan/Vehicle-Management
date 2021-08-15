#!/bin/bash

# launch network; create channel and join peer to channel
pushd ../test-network
./network.sh up -ca -s couchdb
popd
