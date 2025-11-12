#!/usr/bin/env bash
set -euo pipefail
echo "Scale backend -> 0"
kubectl -n backend scale deploy backend-deploy --replicas=0
kubectl -n backend get pods
echo "Restaurar backend -> 2"
kubectl -n backend scale deploy backend-deploy --replicas=2
kubectl -n backend rollout status deploy/backend-deploy

echo "Scale database -> 0 (execute E2E no navegador)"
kubectl -n database scale deploy db-deploy --replicas=0
kubectl -n database get pods
echo "Restaurar database -> 1"
kubectl -n database scale deploy db-deploy --replicas=1
kubectl -n database rollout status deploy/db-deploy
