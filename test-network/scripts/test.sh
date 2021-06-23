#!/bin/bash

# filename="/Users/Sudhan/Blockchain/HyperLedgerFabric/Hyperledge-fabric/test-network/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/keystore/"
# echo "${file##*/}"
# echo $(basename $(ls $filename))

# for filename in $(ls $filename);
# do
#     echo $filename
# done;

export FABRIC_CFG_PATH=${PWD}/../config

. /Users/Sudhan/Blockchain/HyperLedgerFabric/Hyperledge-fabric/test-network/scripts/utils.sh
. /Users/Sudhan/Blockchain/HyperLedgerFabric/Hyperledge-fabric/test-network/scripts/envVar.sh

CHANNEL_NAME='mychannel'
CC_INIT_FCN='InitLedger'
CC_NAME='fabcarApp'
MAX_RETRY=5

chaincodeCarCreate() {
  setGlobals 1
  set -x
  fcn_call='{"function":"CreateCar","Args":["CAR018","Benz","S-Class","Black","Sudhan"]}'
  infoln "invoke fcn call:${fcn_call}"
  peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride \
    orderer.example.com --tls --cafile /Users/Sudhan/Blockchain/HyperLedgerFabric/Hyperledge-fabric/test-network/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem \
    -C mychannel \
    -n fabcarApp \
    --peerAddresses localhost:7051 \
    --tlsRootCertFiles /Users/Sudhan/Blockchain/HyperLedgerFabric/Hyperledge-fabric/test-network/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt \
    --peerAddresses localhost:9051 \
    --tlsRootCertFiles /Users/Sudhan/Blockchain/HyperLedgerFabric/Hyperledge-fabric/test-network/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt \
    -c ${fcn_call}
  res=$?
  { set +x; } 2>/dev/null
  cat log.txt
  verifyResult $res "Invoke execution id failed "
  successln "Invoke transaction successful on channel '$CHANNEL_NAME'"
}

# chaincodeChangeCarOwner() {
#     setGlobals 1
#     set -x
#     fcn_call='{"function":"ChangeCarOwner","Args":["CAR10","Sudhan-Manoharan"]}'
#     infoln "invoke fcn call:${fcn_call}"
# peer chaincode invoke -o localhost:7050 \
#     --ordererTLSHostnameOverride orderer.example.com \
#     --tls --cafile /Users/Sudhan/Blockchain/HyperLedgerFabric/Hyperledge-fabric/test-network/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem \
#     -C mychannel \
#     -n fabcarApp \
#     --peerAddresses localhost:7051 \
#     --tlsRootCertFiles /Users/Sudhan/Blockchain/HyperLedgerFabric/Hyperledge-fabric/test-network/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt \
#     --peerAddresses localhost:9051 \
#     --tlsRootCertFiles /Users/Sudhan/Blockchain/HyperLedgerFabric/Hyperledge-fabric/test-network/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt \
#     -c ${fcn_call}
#     res=$?
#     { set +x; } 2>/dev/null
#     cat log.txt
#     verifyResult $res "Invoke execution id failed "
#     successln "Invoke transaction successful on channel '$CHANNEL_NAME'"
# }

# chaincodeUpdateCar() {
#     setGlobals $1
#     method=$2
#     set -x
#     fcn_call='{"function":"'${method}'","Args":["CAR10"]}'
#     infoln "invoke fcn call:${fcn_call}"
#     peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile /Users/Sudhan/Blockchain/HyperLedgerFabric/Hyperledge-fabric/test-network/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem -C mychannel -n fabcarApp --peerAddresses localhost:7051 --tlsRootCertFiles /Users/Sudhan/Blockchain/HyperLedgerFabric/Hyperledge-fabric/test-network/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt --peerAddresses localhost:9051 --tlsRootCertFiles /Users/Sudhan/Blockchain/HyperLedgerFabric/Hyperledge-fabric/test-network/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt -c ${fcn_call}
#     res=$?
#     { set +x; } 2>/dev/null
#     cat log.txt
#     verifyResult $res "Invoke execution id failed "
#     successln "Invoke transaction successful on channel '$CHANNEL_NAME'"
# }

chaincodeQueryFabCar() {
    ORG=$1
    method=$2
    id=$3
    setGlobals $ORG
    infoln "Querying on peer0.org${ORG} on channel mychannel..."
    local rc=1
    local COUNTER=1
    # continue to poll
    # we either get a successful response, or reach MAX RETRY
    while [ $rc -ne 0 -a $COUNTER -lt $MAX_RETRY ]; do
        sleep 3
        infoln "Attempting to Query peer0.org${ORG}, Retry after 3 seconds."
        set -x
        fcn_call='{"function":"'${method}'","Args":["'${id}'"]}'
        peer chaincode query -C mychannel -n fabcarApp -c ${fcn_call} >&log.txt
        res=$?
        { set +x; } 2>/dev/null
        let rc=$res
        COUNTER=$(expr $COUNTER + 1)
    done
    cat log.txt
    if test $rc -eq 0; then
        successln "Query successful on peer0.org${ORG} on channel mychannel"
    else
        fatalln "After 5 attempts, Query result on peer0.org${ORG} is INVALID!"
    fi
}

chaincodeInvokeInit() {

  parsePeerConnectionParameters $@
  res=$?
  verifyResult $res "Invoke transaction failed on channel '$CHANNEL_NAME' due to uneven number of peer and org parameters "

  # while 'peer chaincode' command can get the orderer endpoint from the
  # peer (if join was successful), let's supply it directly as we know
  # it using the "-o" option
  set -x
  fcn_call='{"function":"'${CC_INIT_FCN}'","Args":[]}'
  infoln "invoke fcn call:${fcn_call}"
  peer chaincode invoke \
    -o localhost:7050 \
    --ordererTLSHostnameOverride orderer.example.com \
    --tls --cafile $ORDERER_CA \
    -C $CHANNEL_NAME \
    -n ${CC_NAME} $PEER_CONN_PARMS \
    -c ${fcn_call} >&log.txt
  res=$?
  { set +x; } 2>/dev/null
  cat log.txt
  verifyResult $res "Invoke execution on $PEERS failed "
  successln "Invoke transaction successful on $PEERS on channel '$CHANNEL_NAME'"
}

# chaincodeInvokeInit 1 2
# chaincodeQueryFabCar 1 QueryCar CAR01
# chaincodeQueryFabCar 1 QueryAllCars ""
chaincodeCarCreate
# chaincodeUpdateCar 1 DeleteCar
# chaincodeChangeCarOwner
# echo "$( echo $(cd ../../ && pwd) )/config/ "
