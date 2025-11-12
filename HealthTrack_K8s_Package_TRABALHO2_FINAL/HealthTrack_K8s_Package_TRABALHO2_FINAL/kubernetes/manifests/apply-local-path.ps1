# apply-local-path.ps1
param(
  [string]$Yaml = ".\local-path-provisioner.yaml"
)

Write-Host "=> Aplicando local-path provisioner..." -ForegroundColor Cyan
kubectl apply -f $Yaml

Write-Host "=> Verificando Deployment no kube-system..." -ForegroundColor Yellow
kubectl -n kube-system rollout status deploy/local-path-provisioner

Write-Host "=> StorageClasses disponíveis:" -ForegroundColor Green
kubectl get sc

Write-Host "=> OK. Se aparecer 'local-path' e o rollout concluir, o provisionador está ativo." -ForegroundColor Green
