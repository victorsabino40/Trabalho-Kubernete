# HealthTrack — Trabalho 2 (Kubernetes) — FINAL

Esta versão alinha **exatamente** com seu código do Trabalho 1:
- **Backend** expõe `/health`, `/pacientes`, `/consultas` (Express) — probes ajustados para `/health`.
- **Variáveis** do backend: `DB_HOST`, `DB_PORT`, `DB_NAME=healthtrack`, `DB_USER=healthtrack`, `DB_PASSWORD=secret`.
- **Frontend** (SPA via Nginx) acessa o backend em **http://localhost:3000** (sem mexer no seu App.jsx).

## Rede funcionando no navegador
- **Frontend**: NodePort `30080` → acesse `http://localhost:30080`
- **Backend**: NodePort `30000` + mapeamento do kind → `http://localhost:3000` (compatível com seu App.jsx)
  - Vide `kubernetes/manifests/kind-config.yaml` (`extraPortMappings` 30000→3000).

## Subir o ambiente
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
cd kubernetes\scripts
.\setup.ps1 -Recreate -LoadLocalImages -ClusterName healthtrack -ManifestsRoot "..\manifests"
```

> Se suas imagens `healthtrack-frontend:latest` e `healthtrack-backend:latest` estão apenas no Docker local,
> mantenha `-LoadLocalImages`. Se estiverem em registry, troque `image:` nos YAMLs.

### Acesso alternativo pedido no enunciado (port-forward)
```powershell
.\port-forward.ps1   # abre http://localhost:8080 para o frontend
```

## Testes solicitados (E2E + escala)
```powershell
.\scale-and-test.ps1
```

## Exportar logs nos .txt
```powershell
.\export-logs.ps1
# Saem em kubernetes\logs
```

## Checklist para o vídeo
```powershell
kubectl get pods -A
kubectl get svc -A
kubectl get pvc,pv -A
kubectl get namespaces
kubectl logs -f deploy/<nome> -n <ns>
```

## Observação sobre o Nginx do frontend
Seu `nginx.conf` atual apenas serve estáticos. Como o SPA acessa `http://localhost:3000` direto (mapeado no kind), **não é necessário** proxy reverso no Nginx.
