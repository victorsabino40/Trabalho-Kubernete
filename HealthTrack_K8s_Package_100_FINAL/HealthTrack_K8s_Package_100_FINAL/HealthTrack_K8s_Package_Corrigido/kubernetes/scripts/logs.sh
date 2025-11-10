#!/usr/bin/env bash
set -euo pipefail
mkdir -p kubernetes/logs
kubectl -n frontend logs deploy/frontend-deploy > kubernetes/logs/frontend.txt
kubectl -n backend logs deploy/backend-deploy  > kubernetes/logs/backend.txt
kubectl -n database logs deploy/db-deploy     > kubernetes/logs/database.txt
echo "Logs salvos em kubernetes/logs"
