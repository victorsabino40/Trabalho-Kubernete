Write-Host "=> Port-forward para frontend (http://localhost:8080) ..." -ForegroundColor Cyan
kubectl -n frontend port-forward svc/frontend-svc 8080:80
