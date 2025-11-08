#!/usr/bin/env bash
set -euo pipefail
kubectl -n frontend port-forward svc/frontend-svc 8080:80
# Em outro terminal, se desejar:
# kubectl -n backend port-forward svc/backend-svc 3000:3000
