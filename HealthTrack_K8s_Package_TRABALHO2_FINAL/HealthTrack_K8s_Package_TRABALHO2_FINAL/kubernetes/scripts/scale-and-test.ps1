\
Write-Host "=> Teste: Escalar backend para 0..." -ForegroundColor Yellow
kubectl scale deploy/backend-deploy -n backend --replicas=0
kubectl get deploy -n backend

Write-Host "=> Escalar backend para 2..." -ForegroundColor Yellow
kubectl scale deploy/backend-deploy -n backend --replicas=2
kubectl rollout status deploy/backend-deploy -n backend

Write-Host "=> Teste: Escalar database para 0..." -ForegroundColor Yellow
kubectl scale deploy/db-deploy -n database --replicas=0
kubectl get deploy -n database

Write-Host "=> Escalar database para 1..." -ForegroundColor Yellow
kubectl scale deploy/db-deploy -n database --replicas=1
kubectl rollout status deploy/db-deploy -n database

Write-Host "=> Checklist" -ForegroundColor Green
kubectl get pods -A
kubectl get svc -A
kubectl get pvc,pv -A
kubectl get namespaces
