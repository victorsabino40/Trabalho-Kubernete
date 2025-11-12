#!/usr/bin/env bash
set -euo pipefail
CLUSTER_NAME=${1:-healthtrack}
kind delete cluster --name "$CLUSTER_NAME" || true
kind create cluster --config kubernetes/manifests/kind-config.yaml --name "$CLUSTER_NAME"

kubectl apply -f kubernetes/manifests/namespaces/
kubectl apply -f kubernetes/manifests/storage/pv-pvc.yaml
kubectl apply -f kubernetes/manifests/database/configmap.yaml
kubectl apply -f kubernetes/manifests/database/init-configmap.yaml
kubectl apply -f kubernetes/manifests/database/
kubectl apply -f kubernetes/manifests/backend/
kubectl apply -f kubernetes/manifests/frontend/
kubectl wait --for=condition=available deploy --all -A --timeout=120s

echo "Acesse via NodePort: http://localhost:30080"
