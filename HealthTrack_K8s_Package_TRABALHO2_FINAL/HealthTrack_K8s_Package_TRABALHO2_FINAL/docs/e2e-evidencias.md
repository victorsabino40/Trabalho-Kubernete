# Evidências de Teste End-to-End (E2E)

Data: 2025-11-09 18:56:18

## Passo a passo (resumo)
1. Criar o cluster kind (1 nó).
2. Carregar imagens locais (se necessário) e aplicar manifests.
3. Acessar o frontend via **NodePort** `http://localhost:30080` e validar **/api/ping** funcional.
4. Acessar via **port-forward** `http://localhost:8080` (**opcional por exigência do trabalho**) e validar novamente.
5. **Escalar o backend para 0 réplicas**, validar erro no frontend (esperado), depois **escalar para 2** e validar sucesso.
6. **Escalar o database para 0 réplica**, validar erro no frontend (esperado), depois **escalar para 1** e validar sucesso.
7. Exportar os logs em `kubernetes/logs/*.txt` (um arquivo por Deployment).

## Prints sugeridos
- `docs/e2e-01-ok-nodeport.png` – Home/healthcheck OK via NodePort.
- `docs/e2e-02-backend-0.png` – Frontend com backend escalado para 0 (falha controlada).
- `docs/e2e-03-db-0.png` – Frontend com DB escalado para 0 (falha controlada).
- `docs/e2e-04-restaurado.png` – Tudo restaurado e OK após reescalar.
- `docs/checklist.pdf` – Saídas dos comandos de verificação (ou inserir no `checklist.md`).

Cole aqui as imagens/prints após os testes.
