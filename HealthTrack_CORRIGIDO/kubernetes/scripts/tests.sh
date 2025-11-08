#!/usr/bin/env bash
set -euo pipefail
curl -sSf http://localhost:30080 >/dev/null && echo "OK frontend (200)"
curl -sSf http://localhost:3000/pacientes >/dev/null && echo "OK backend /pacientes"
curl -sSf http://localhost:3000/consultas >/dev/null && echo "OK backend /consultas"
