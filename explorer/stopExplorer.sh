#!/bin/bash

COMPOSE_EXPLORER=docker-compose.yaml

function explorerNetworkDown() {
    echo "************************ Docker Explorer Network Down ************************"
    docker-compose down
    echo "************************ Docker Explorer Network Done ************************"
}

explorerNetworkDown
