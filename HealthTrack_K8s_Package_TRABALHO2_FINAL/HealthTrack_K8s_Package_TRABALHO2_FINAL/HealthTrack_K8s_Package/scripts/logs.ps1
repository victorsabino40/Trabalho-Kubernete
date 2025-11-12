New-Item -ItemType Directory -Force -Path kubernetes\logs | Out-Null
kubectl -n frontend logs deploy/frontend-deploy > kubernetes\logs\frontend.txt
kubectl -n backend logs deploy/backend-deploy   > kubernetes\logs\backend.txt
kubectl -n database logs deploy/db-deploy      > kubernetes\logs\database.txt
Write-Host ">> Logs salvos em kubernetes\logs"
