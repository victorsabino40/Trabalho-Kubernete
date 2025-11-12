# Checklist Guiado de Verificação

## Pods ativos em todos os namespaces
kubectl get pods -A

## Services funcionando e expostos corretamente
kubectl get svc -A

## Volumes e claims
kubectl get pvc,pv -A

## Namespaces criados
kubectl get namespaces

## Logs em tempo real (exemplo)
kubectl logs -f deploy/frontend-deploy -n frontend
kubectl logs -f deploy/backend-deploy  -n backend
kubectl logs -f deploy/db-deploy      -n database

### Dica (Windows PowerShell):
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
Unblock-File -Path .\kubernetes\scripts\*.ps1
