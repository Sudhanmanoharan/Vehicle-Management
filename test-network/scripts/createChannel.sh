#!/bin/bash
# imports
. scripts/envVar.sh
. scripts/utils.sh

CHANNEL_NAME="$1"
DELAY="$2"
MAX_RETRY="$3"
VERBOSE="$4"
: ${CHANNEL_NAME:="mychannel"}
: ${DELAY:="3"}
: ${MAX_RETRY:="5"}
: ${VERBOSE:="false"}

if [ ! -d "/Users/Sudhan/Blockchain/HyperLedgerFabric/Hyperledge-fabric/test-network/channel-artifacts" ]; then
    mkdir /Users/Sudhan/Blockchain/HyperLedgerFabric/Hyperledge-fabric/test-network/channel-artifacts
fi

# Creating Channel Tx by configtxgen binary
createChannelTx() {
    set -x
    configtxgen -profile TwoOrgsChannel -outputCreateChannelTx ./channel-artifacts/${CHANNEL_NAME}.tx -channelID $CHANNEL_NAME
    res=$?
    { set +x; } 2>/dev/null
    verifyResult $res "Failed to generate channel configuration transaction..."
}

# Creating the channel for Org 1
createChannel() {
    setGlobals 1 # Setting gobal variable to for Org 1
    # Poll in case the raft leader is not set yet
    # [local] type used to point the value inside the function or else block
    local rc=1
    local COUNTER=1
    while [ $rc -ne 0 -a $COUNTER -lt $MAX_RETRY ]; do
        sleep $DELAY
        set -x
        peer channel create -o localhost:7050 -c $CHANNEL_NAME --ordererTLSHostnameOverride orderer.example.com -f ./channel-artifacts/${CHANNEL_NAME}.tx --outputBlock $BLOCKFILE --tls --cafile $ORDERER_CA >&log.txt
        res=$?
        { set +x; } 2>/dev/null
        let rc=$res
        COUNTER=$(expr $COUNTER + 1)
    done
    cat log.txt
    verifyResult $res "Channel creation failed"
}

# joinChannel ORG
joinChannel() {
    FABRIC_CFG_PATH=/Users/Sudhan/Blockchain/HyperLedgerFabric/Hyperledge-fabric/config/
    ORG=$1
    setGlobals $ORG
    local rc=1
    local COUNTER=1
    ## Sometimes Join takes time, hence retry
    while [ $rc -ne 0 -a $COUNTER -lt $MAX_RETRY ]; do
        sleep $DELAY
        set -x
        peer channel join -b $BLOCKFILE >&log.txt
        res=$?
        { set +x; } 2>/dev/null
        let rc=$res
        COUNTER=$(expr $COUNTER + 1)
    done
    cat log.txt
    verifyResult $res "After $MAX_RETRY attempts, peer0.org${ORG} has failed to join channel '$CHANNEL_NAME' "
}

# Setting the Anchor peer
setAnchorPeer() {
    ORG=$1
    # peer channel update -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com -c $CHANNEL_NAME -f ./artifacts/channel/${CORE_PEER_LOCALMSPID}anchors.tx --tls $CORE_PEER_TLS_ENABLED --cafile $ORDERER_CA
    # CONTAINER_IDS=$(docker ps -a | awk '($2 ~ /hyperledger\/fabric-tools.*/) {print $1}')
    # echo "CONTAINER_IDS  ------> $CONTAINER_IDS"
    # # docker exec ${CONTAINER_IDS} bash -c "cd /scripts/setAnchorPeer.sh $ORG $CHANNEL_NAME"
    # docker exec cli /Users/Sudhan/Blockchain/HyperLedgerFabric/Hyperledge-fabric/test-network/scripts/setAnchorPeer.sh $ORG $CHANNEL_NAME
    set -x
    docker exec cli ./scripts/setAnchorPeer.sh $ORG $CHANNEL_NAME
    set +x
    # docker exec -it ${CONTAINER_IDS} sh -c cd /scripts/setAnchorPeer.sh $ORG $CHANNEL_NAME
    # /Users/Sudhan/Blockchain/HyperLedgerFabric/Hyperledge-fabric/test-network/scripts/setAnchorPeer.sh $ORG $CHANNEL_NAME
    # docker exec -i ${CONTAINER_IDS} /bin/bash -c cd ./scripts/setAnchorPeer.sh $ORG $CHANNEL_NAME
}

FABRIC_CFG_PATH=${PWD}/configtx

## Create channeltx
infoln "Generating channel create transaction '${CHANNEL_NAME}.tx'"
createChannelTx

FABRIC_CFG_PATH=/Users/Sudhan/Blockchain/HyperLedgerFabric/Hyperledge-fabric/config/
BLOCKFILE="./channel-artifacts/${CHANNEL_NAME}.block"

## Create channel
infoln "Creating channel ${CHANNEL_NAME}"
createChannel
successln "Channel '$CHANNEL_NAME' created"

## Join all the peers to the channel
infoln "Joining org1 peer to the channel..."
joinChannel 1
infoln "Joining org2 peer to the channel..."
joinChannel 2

## Set the anchor peers for each org in the channel
infoln "Setting anchor peer for org1..."
setAnchorPeer 1
infoln "Setting anchor peer for org2..."
setAnchorPeer 2

successln "Channel '$CHANNEL_NAME' joined"
