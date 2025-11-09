# 🏥 Gestão de Prontuários — Registro de Pacientes e Consultas (Docker)

Sistema completo e **moderno** com 3 serviços em contêineres Docker:

- **frontend** (React + Vite + Nginx) — UI moderna para listar e incluir registros
- **backend** (Node.js + Express + pg) — API REST
- **db** (PostgreSQL 16) — persistência

> **Entrega Parte 1 (Trabalho de Implantação):** foco na **infraestrutura** (Dockerfiles, Compose e diagrama).

---

## 🚀 Como executar (produção/dev local)
```bash
# 1) Suba tudo (build + run)
docker compose up -d --build

# 2) Acesse
# Frontend: http://localhost
# Backend:  http://localhost:3000
# Postgres: localhost:5432 (via serviço "db")
```

### Variáveis de ambiente
Crie um `.env` na raiz (ou use os defaults do Compose):
```
POSTGRES_DB=healthtrack
POSTGRES_USER=healthtrack
POSTGRES_PASSWORD=secret
```

---

## 📦 Estrutura
```
Gestão de Prontuários/
├─ docker-compose.yml
├─ .env.example
├─ README.md
├─ diagram.md
├─ db/
│  └─ init.sql
├─ backend/
│  ├─ Dockerfile
│  ├─ package.json
│  └─ src/
│     └─ server.js
└─ frontend/
   ├─ Dockerfile
   ├─ nginx.conf
   ├─ package.json
   ├─ vite.config.js
   └─ src/
      ├─ index.html
      ├─ main.jsx
      └─ App.jsx
```

---

## 📘 API (resumo)
### `GET /pacientes`
Lista pacientes.

### `POST /pacientes`
```json
{ "nome": "Ana", "idade": 32, "email": "ana@ex.com", "telefone": "8599..." }
```

### `GET /consultas`
Lista consultas (JOIN com nome do paciente).

### `POST /consultas`
```json
{ "paciente_id": 1, "data_consulta": "2025-11-01T14:30:00", "medico": "Dr. Silva", "observacao": "Retorno" }
```

---

## 🧪 Testes rápidos (curl)
```bash
# Criar paciente
curl -X POST http://localhost:3000/pacientes \
  -H "Content-Type: application/json" \
  -d '{"nome":"Maria","idade":28,"email":"maria@ex.com","telefone":"8599999-0001"}'

# Listar pacientes
curl http://localhost:3000/pacientes

# Criar consulta
curl -X POST http://localhost:3000/consultas \
  -H "Content-Type: application/json" \
  -d '{"paciente_id":1,"data_consulta":"2025-11-01T09:00:00","medico":"Dra. Carla","observacao":"Primeira consulta"}'

# Listar consultas
curl http://localhost:3000/consultas
```

---

## 🗺️ Diagrama
Veja `diagram.md` (Mermaid). Dica: abra no VS Code com extensão de Mermaid para visualizar.

---

## 🔐 Observações
- Código e design **não são foco** da avaliação, mas a stack é moderna (React + Vite, Node 20, Postgres 16).
- Repositório recomendado como **privado** no GitHub (envie o link ao professor).
- **Sem reutilização** entre equipes.
