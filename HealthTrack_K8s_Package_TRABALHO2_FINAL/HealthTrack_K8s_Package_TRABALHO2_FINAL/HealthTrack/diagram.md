# Diagrama de Implantação — Gestão de Prontuários

```mermaid
flowchart LR
  U[Usuário (Browser)] -->|HTTP :80| FE[Container: frontend (Nginx + React Build)]
  FE -->|HTTP :3000| BE[Container: backend (Node/Express)]
  BE -->|TCP :5432| DB[(Container: PostgreSQL 16)]
```
