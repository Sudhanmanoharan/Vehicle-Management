#!/bin/bash
COMPOSE_EXPLORER=docker-compose-explorer.yaml
docker-compose -f $COMPOSE_EXPLORER down -d --volumes --remove-orphans