import express from "express";
import cors from "cors";
import pkg from "pg";

const app = express();
app.use(cors());
app.use(express.json());

const { Pool } = pkg;
const pool = new Pool({
  host: process.env.DB_HOST || "db",
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME || "healthtrack",
  user: process.env.DB_USER || "healthtrack",
  password: process.env.DB_PASSWORD || "secret"
});

// Saúde
app.get("/health", (_req, res) => res.json({ status: "ok" }));

// Pacientes
app.get("/pacientes", async (_req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM pacientes ORDER BY id DESC");
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: "Erro ao listar pacientes" });
  }
});

app.post("/pacientes", async (req, res) => {
  const { nome, idade, email, telefone } = req.body || {};
  if (!nome) return res.status(400).json({ error: "Campo obrigatório: nome" });
  try {
    const { rows } = await pool.query(
      "INSERT INTO pacientes (nome, idade, email, telefone) VALUES ($1,$2,$3,$4) RETURNING *",
      [nome, idade || null, email || null, telefone || null]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: "Erro ao criar paciente" });
  }
});

// Consultas
app.get("/consultas", async (_req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT c.id, c.paciente_id, p.nome as paciente_nome, c.data_consulta, c.medico, c.observacao, c.criado_em
      FROM consultas c
      JOIN pacientes p ON p.id = c.paciente_id
      ORDER BY c.data_consulta DESC
    `);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: "Erro ao listar consultas" });
  }
});

app.post("/consultas", async (req, res) => {
  const { paciente_id, data_consulta, medico, observacao } = req.body || {};
  if (!paciente_id || !data_consulta) {
    return res.status(400).json({ error: "Campos obrigatórios: paciente_id, data_consulta" });
  }
  try {
    const { rows } = await pool.query(
      "INSERT INTO consultas (paciente_id, data_consulta, medico, observacao) VALUES ($1,$2,$3,$4) RETURNING *",
      [Number(paciente_id), data_consulta, medico || null, observacao || null]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: "Erro ao criar consulta" });
  }
});

const port = Number(process.env.PORT || 3000);
app.listen(port, () => console.log(`HealthTrack API rodando na porta ${port}`));
