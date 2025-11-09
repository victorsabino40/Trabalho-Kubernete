#!/usr/bin/env bash
set -euo pipefail

kubectl -n backend scale deploy backend-deploy --replicas=0
sleep 3
kubectl -n backend get pods -o wide
kubectl -n backend scale deploy backend-deploy --replicas=2
kubectl -n backend rollout status deploy/backend-deploy

kubectl -n database scale deploy db-deploy --replicas=0
sleep 3
kubectl -n database get pods -o wide
kubectl -n database scale deploy db-deploy --replicas=1
kubectl -n database rollout status deploy/db-deploy

mkdir -p logs
kubectl -n frontend logs deploy/frontend-deploy > logs/frontend.txt
kubectl -n backend logs deploy/backend-deploy > logs/backend.txt
kubectl -n database logs deploy/db-deploy > logs/database.txt
