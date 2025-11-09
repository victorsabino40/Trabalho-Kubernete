#!/usr/bin/env bash
set -euo pipefail

kind create cluster --config manifests/kind-config.yaml || true

docker build -t healthtrack-backend:latest ../HealthTrack/backend
docker build -t healthtrack-frontend:latest ../HealthTrack/frontend

kind load docker-image healthtrack-backend:latest
kind load docker-image healthtrack-frontend:latest

kubectl apply -f manifests/namespaces/
kubectl apply -f manifests/storage/pv-pvc.yaml
kubectl apply -f manifests/database/init-configmap.yaml
kubectl apply -f manifests/database/
kubectl apply -f manifests/backend/
kubectl apply -f manifests/frontend/

kubectl wait --for=condition=available deploy --all -A --timeout=90s

echo "Acesse: http://localhost:30080 (frontend)"
echo "API:    http://localhost:3000 (backend via hostPort)"
