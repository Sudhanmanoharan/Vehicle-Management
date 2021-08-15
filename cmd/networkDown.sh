#!/bin/bash
#
# Copyright IBM Corp All Rights Reserved
#
# SPDX-License-Identifier: Apache-2.0
#
# Exit on first error
set -ex
mode="down"
if [ $1 == "down" ]; then
    mode="down"
elif [ $1 == "restart" ]; then
    mode="restart"
fi
# Bring the test network down
pushd ../test-network
./network.sh $mode
popd

# clean out any old identites in the wallets
rm -rf ../api/fabcar/javascript/wallet/*
