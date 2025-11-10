Write-Host ">> Teste: scale backend -> 0"
kubectl -n backend scale deploy backend-deploy --replicas=0
kubectl -n backend get pods

Write-Host ">> Restaurar backend -> 2"
kubectl -n backend scale deploy backend-deploy --replicas=2
kubectl -n backend rollout status deploy/backend-deploy

Write-Host ">> Teste: scale database -> 0 (execute E2E no navegador agora)"
kubectl -n database scale deploy db-deploy --replicas=0
kubectl -n database get pods

Write-Host ">> Restaurar database -> 1"
kubectl -n database scale deploy db-deploy --replicas=1
kubectl -n database rollout status deploy/db-deploy
