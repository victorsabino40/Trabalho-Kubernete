# HealthTrack_K8s_Package_Corrigido

Este pacote contém os manifests e scripts para cumprir **integralmente** os requisitos do trabalho:
- Cluster kind (1 nó)
- Namespaces `frontend`, `backend`, `database`
- Deployments: `frontend` (3), `backend` (2), `database` (1) com PV/PVC
- Services: `frontend` NodePort, `backend` e `database` ClusterIP
- ConfigMaps dedicados para variáveis
- Port-forward e testes end-to-end (E2E)
- Export de logs por Deployment

## Pré-requisitos
- Docker Desktop
- kind
- kubectl

## Passo a passo rápido (Windows PowerShell)

1) Criar/Resetar cluster
```powershell
kind delete cluster --name healthtrack
kind create cluster --config kubernetes/manifests/kind-config.yaml --name healthtrack
```

2) Buildar imagens locais e carregar no kind (ajuste os caminhos do seu projeto conforme necessário)
```powershell
docker build -t healthtrack-backend:latest ..\HealthTrack\backend
docker build -t healthtrack-frontend:latest ..\HealthTrack\frontend
kind load docker-image healthtrack-backend:latest --name healthtrack
kind load docker-image healthtrack-frontend:latest --name healthtrack
```

3) Aplicar manifests
```powershell
kubectl apply -f kubernetes/manifests/namespaces/
kubectl apply -f kubernetes/manifests/storage/pv-pvc.yaml
kubectl apply -f kubernetes/manifests/database/configmap.yaml
kubectl apply -f kubernetes/manifests/database/init-configmap.yaml
kubectl apply -f kubernetes/manifests/database/
kubectl apply -f kubernetes/manifests/backend/
kubectl apply -f kubernetes/manifests/frontend/
kubectl wait --for=condition=available deploy --all -A --timeout=120s
```

4) Acessar o app
- **NodePort (requisito)**: http://localhost:30080
- **Port-forward (requisito)**: em um terminal separado
  ```powershell
  kubectl -n frontend port-forward svc/frontend-svc 8080:80
  ```
  Acesse http://localhost:8080

## Testes E2E conforme o trabalho

1) Teste funcional inicial (navegador fora do cluster) — valide que o frontend acessa `/api` e responde sem erros.

2) Escalar **backend para zero** e restaurar:
```powershell
kubectl -n backend scale deploy backend-deploy --replicas=0
kubectl -n backend get pods
kubectl -n backend scale deploy backend-deploy --replicas=2
kubectl -n backend rollout status deploy/backend-deploy
```

3) Escalar **database para zero**, testar E2E (deve falhar operações que usam banco) e restaurar:
```powershell
kubectl -n database scale deploy db-deploy --replicas=0
kubectl -n database get pods
# Teste E2E agora no navegador
kubectl -n database scale deploy db-deploy --replicas=1
kubectl -n database rollout status deploy/db-deploy
```

4) Novo teste E2E (após restaurar) — valide sem erros.

5) Exportar logs para `kubernetes/logs/`:
```powershell
mkdir kubernetes\logs -Force
kubectl -n frontend logs deploy/frontend-deploy > kubernetes\logs\frontend.txt
kubectl -n backend logs deploy/backend-deploy >  kubernetes\logs\backend.txt
kubectl -n database logs deploy/db-deploy >     kubernetes\logs\database.txt
```

## Checklist final
```powershell
kubectl get pods -A
kubectl get svc -A
kubectl get pvc,pv -A
kubectl get namespaces
kubectl logs -f deploy/<nome-do-deployment> -n <namespace>
```
