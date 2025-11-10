param(
  [string]$ClusterName = "healthtrack"
)

Write-Host ">> (Re)criando cluster kind: $ClusterName"
kind delete cluster --name $ClusterName 2>$null | Out-Null
kind create cluster --config kubernetes/manifests/kind-config.yaml --name $ClusterName

Write-Host ">> Aplicando manifests"
kubectl apply -f kubernetes/manifests/namespaces/
kubectl apply -f kubernetes/manifests/storage/pv-pvc.yaml
kubectl apply -f kubernetes/manifests/database/configmap.yaml
kubectl apply -f kubernetes/manifests/database/init-configmap.yaml
kubectl apply -f kubernetes/manifests/database/
kubectl apply -f kubernetes/manifests/backend/
kubectl apply -f kubernetes/manifests/frontend/
kubectl wait --for=condition=available deploy --all -A --timeout=120s

Write-Host ">> OK. Acesse via NodePort: http://localhost:30080"
