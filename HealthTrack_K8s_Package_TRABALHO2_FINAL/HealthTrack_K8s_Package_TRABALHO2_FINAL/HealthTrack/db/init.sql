CREATE TABLE IF NOT EXISTS pacientes (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  idade INT,
  email VARCHAR(120),
  telefone VARCHAR(20),
  criado_em TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS consultas (
  id SERIAL PRIMARY KEY,
  paciente_id INT REFERENCES pacientes(id) ON DELETE CASCADE,
  data_consulta TIMESTAMP NOT NULL,
  medico VARCHAR(100),
  observacao TEXT,
  criado_em TIMESTAMP DEFAULT NOW()
);
