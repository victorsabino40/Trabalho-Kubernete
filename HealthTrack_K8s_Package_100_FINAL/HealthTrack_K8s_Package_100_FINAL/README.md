# HealthTrack_K8s_Package_100

Este pacote inclui **tudo** para atender 100% às tarefas do trabalho:
- Diagrama de implantação (docs/diagrama-implantacao.{mmd,png,pdf})
- Template de evidências E2E (docs/e2e-evidencias.md)
- Checklist com comandos (docs/checklist.md)
- Pasta de logs pronta (kubernetes/logs/*.txt) — serão sobrescritos após os testes

## Passos rápidos

### 0) PowerShell (evitar erro de assinatura)
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
Unblock-File -Path .\kubernetes\scripts\*.ps1
```

### 1) Criar cluster (1 nó) e aplicar manifests
```powershell
cd kubernetes\scripts
.\setup.ps1
```

> Caso use imagens locais, lembre-se de fazer `kind load docker-image ...` antes do apply.

### 2) Acesso via NodePort
Abra o navegador em `http://localhost:30080` e valide o funcionamento.

### 3) (Exigência) Port-forward
```powershell
.\portforward.ps1
```
Depois acesse `http://localhost:8080`.

### 4) Testes E2E de escala
```powershell
.	ests.ps1
```
Ou no Linux/Mac:
```bash
bash scripts/tests.sh
```

### 5) Exportar logs (um arquivo por Deployment)
```powershell
.\logs.ps1
```
Ou:
```bash
bash scripts/logs.sh
```

Os arquivos serão gravados em `kubernetes/logs/frontend.txt`, `backend.txt` e `database.txt`.

### 6) Evidências
- Cole os prints em `docs/e2e-evidencias.md`
- Inclua as saídas dos comandos no `docs/checklist.md` ou imprima em PDF

Pronto! Com isso, seu pacote atende **100%** ao que o trabalho pede.
