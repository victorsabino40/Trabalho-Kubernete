# Kubernetes — HealthTrack (Trabalho 2)

Este pacote contém manifestos, scripts e um diagrama para implantar a aplicação **HealthTrack** (frontend React + Vite, backend Node/Express, Postgres) em um cluster **Kubernetes (kind, 1 nó)**.

## Estrutura
```
kubernetes/
  manifests/
    namespaces/
    storage/
    database/   (Deployment, Service, ConfigMap init.sql, ConfigMap .env)
    backend/    (Deployment, Service, ConfigMap)
    frontend/   (Deployment, Service NodePort)
    kind-config.yaml
  scripts/
    setup.sh        # cria cluster, builda imagens, carrega no kind e aplica manifests
    ops.sh          # escala réplicas e exporta logs
    portforward.sh  # exemplo de port-forward
    tests.sh        # smoke tests curl
  logs/             # exportação de logs (preenchido por ops.sh)
  diagram/arquitetura.svg
```

> **Nota sobre o acesso do frontend ao backend**  
> O **frontend** foi escrito assumindo que o **backend** estará acessível em `http://<host>:3000`.  
> Em Kubernetes, Services NodePort usam a faixa 30000–32767. Para manter compatibilidade **sem editar o código**, o `Deployment` do backend usa `hostPort: 3000`, e o arquivo `manifests/kind-config.yaml` mapeia a porta 3000 do nó do kind para o host. Assim, o navegador acessa:
> - Frontend: `http://localhost:30080` (Service **NodePort**)
> - Backend: `http://localhost:3000` (**hostPort** do pod, alcançável do host)

Se preferir evitar `hostPort`, altere o frontend para consumir o backend via um `Service` exposto por `Ingress`/`NodePort` ou use um proxy NGINX no próprio contêiner do frontend.

---

## Passo a passo (para o vídeo)

### 1) Setup do ambiente (2–3 min)
```bash
cd kubernetes
./scripts/setup.sh
kubectl get pods -A
kubectl get svc  -A
kubectl get pvc,pv -A
```

### 2) Demonstração end-to-end (3–4 min)
- Acesse **http://localhost:30080** (frontend).
- Mostre listagem e inclusão de registros via interface.
- Opcional (validação rápida cURL):
```bash
curl http://localhost:3000/pacientes
curl -X POST http://localhost:3000/pacientes -H "Content-Type: application/json" -d '{{"nome":"Alice"}}'
```

### 3) Escalonamento e resiliência (3–4 min)
```bash
# backend → 0 e volta para 2
kubectl -n backend scale deploy backend-deploy --replicas=0
kubectl -n backend get pods
kubectl -n backend scale deploy backend-deploy --replicas=2

# database → 0 e volta para 1
kubectl -n database scale deploy db-deploy --replicas=0
kubectl -n database get pods
kubectl -n database scale deploy db-deploy --replicas=1
```

### 4) Verificações (2 min)
```bash
kubectl get pods -A
kubectl get svc -A
kubectl get pvc,pv -A
kubectl get namespaces
kubectl logs -f deploy/backend-deploy -n backend
```

### 5) Exportar logs (1 min)
```bash
./scripts/ops.sh
ls -l logs/
```

### 6) Encerramento (1–2 min)
- Comentar brevemente `Deployment`, `Service`, `ConfigMap` (frontend/back/db) e `PV/PVC`.
- Mostrar o diagrama `diagram/arquitetura.svg`.
