#!/bin/bash

COMPOSE_EXPLORER=docker-compose.yaml

function explorerUp() {
    filename="/Users/Sudhan/Blockchain/HyperLedgerFabric/Hyperledge-fabric/test-network/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/keystore/"
    org1Keystore=$(basename $(ls $filename))
    echo "************************ Keystore Updated **************************"
    jq '.organizations.Org1MSP.adminPrivateKey.path="/etc/data/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/keystore/'${org1Keystore}'"' ./connection-profile/first-network.json | sponge ./connection-profile/first-network.json
    echo "************************ Docker Explorer Up ************************"
    docker-compose -f $COMPOSE_EXPLORER up -d
    echo "***************** Docker Explorer Completed ************************"
}

explorerUp
