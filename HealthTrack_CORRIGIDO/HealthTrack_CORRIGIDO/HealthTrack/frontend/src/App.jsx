import React, { useEffect, useState } from 'react'

const API = (location.origin.replace(/:80$/, '') || 'http://localhost').replace(/\/$/, '')
const BACKEND = API.replace(/:\d+$/, '') + ':3000'

const ESPECIALIDADES = [
  "Clínico Geral",
  "Cardiologia",
  "Dermatologia",
  "Ginecologia",
  "Neurologia",
  "Ortopedia",
  "Oftalmologia",
  "Pediatria",
  "Psiquiatria",
  "Urologia"
]

// Gera horários FUTUROS: hoje até +30 dias, 08:00 → 18:00 (1h). 
// Se for hoje, horários passados ficam indisponíveis (disabled no <option>).
const gerarHorariosFuturos = () => {
  const slots = []
  const agora = new Date()

  for (let addDia = 0; addDia <= 30; addDia++) {
    const base = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() + addDia)
    for (let h = 8; h <= 18; h++) {
      const dt = new Date(base.getFullYear(), base.getMonth(), base.getDate(), h, 0, 0)
      slots.push(dt.toISOString())
    }
  }
  return slots
}
export default function App() {
  const [pacientes, setPacientes] = useState([])
  const [consultas, setConsultas] = useState([])

  const [p, setP] = useState({ nome: '', idade: '', email: '', telefone: '' })
  const [c, setC] = useState({ paciente_id: '', data_consulta: '', medico: '', observacao: '' })

  const horarios = gerarHorariosFuturos()

  const carregar = async () => {
    const ps = await fetch(`${BACKEND}/pacientes`).then(r => r.json())
    const cs = await fetch(`${BACKEND}/consultas`).then(r => r.json())
    setPacientes(ps); setConsultas(cs)
  }

  useEffect(() => { carregar() }, [])

  const addPaciente = async (e) => {
    e.preventDefault()
    const resp = await fetch(`${BACKEND}/pacientes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...p, idade: p.idade ? Number(p.idade) : null })
    })
    if (!resp.ok) return alert('Erro ao salvar paciente')
    setP({ nome: '', idade: '', email: '', telefone: '' })
    await carregar()
  }

  const addConsulta = async (e) => {
    e.preventDefault()
    const payload = { ...c }
    const resp = await fetch(`${BACKEND}/consultas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    if (!resp.ok) return alert('Erro ao salvar consulta')
    const created = await resp.json()

    // Enriquecer para exibir imediatamente com nome do paciente
    const paciente = pacientes.find(px => String(px.id) === String(created.paciente_id))
    const display = {
      id: created.id,
      paciente_id: created.paciente_id,
      paciente_nome: paciente ? paciente.nome : `Paciente #${created.paciente_id}`,
      data_consulta: created.data_consulta,
      medico: created.medico,
      observacao: created.observacao,
      criado_em: created.criado_em
    }
    setConsultas(prev => [display, ...prev])

    setC({ paciente_id: '', data_consulta: '', medico: '', observacao: '' })
  }

  return (
    <div className="container">
      <nav className="nav">
        <div className="brand">
          <div className="logo" />
          <span>Gestão de Prontuários</span>
        </div>
        <small>React + Node + Postgres • Docker</small>
      </nav>

      <div className="hero">
        <h1>Registro de Pacientes e Consultas</h1>
        <p className="muted">Inclua pacientes, agende consultas e visualize tudo em tempo real.</p>
      </div>

      <section className="grid">
        <div className="card">
          <h2>Novo Paciente</h2>
          <form onSubmit={addPaciente}>
            <input placeholder="Nome *" value={p.nome} onChange={e => setP({ ...p, nome: e.target.value })} required />
            <input placeholder="Idade" type="number" min="0" value={p.idade} onChange={e => setP({ ...p, idade: e.target.value })} />
            <input placeholder="E-mail" value={p.email} onChange={e => setP({ ...p, email: e.target.value })} />
            <input placeholder="Telefone" value={p.telefone} onChange={e => setP({ ...p, telefone: e.target.value })} />
            <button>Salvar Paciente</button>
          </form>
        </div>

        <div className="card">
          <h2>Agendar Consulta</h2>
          <form onSubmit={addConsulta}>
            <select value={c.paciente_id} onChange={e => setC({ ...c, paciente_id: e.target.value })} required>
              <option value="">Selecione o Paciente *</option>
              {pacientes.map(px => <option key={px.id} value={px.id}>{px.nome}</option>)}
            </select>

            {/* Campo Data/Hora: opções 08:00 → 18:00 */}
            <select value={c.data_consulta} onChange={e => setC({ ...c, data_consulta: e.target.value })} required>
              <option value="">Selecione Data/Hora *</option>
              {horarios.map(h => {
                const isPast = new Date(h) < new Date();
                return (
                <option key={h} value={h} disabled={isPast}>
                  {new Date(h).toLocaleString()}{isPast ? " (indisponível)" : ""}
                </option>
              )})}
            </select>

            {/* Campo Médico: lista de especialidades */}
            <select value={c.medico} onChange={e => setC({ ...c, medico: e.target.value })}>
              <option value="">Especialidade</option>
              {ESPECIALIDADES.map(sp => <option key={sp} value={sp}>{sp}</option>)}
            </select>

            <input placeholder="Observação" value={c.observacao} onChange={e => setC({ ...c, observacao: e.target.value })} />
            <button>Salvar Consulta</button>
          </form>
        </div>

        <div className="card">
          <h2>Pacientes <span className="badge">{pacientes.length}</span></h2>
          {pacientes.length === 0 && <p className="muted">Nenhum paciente cadastrado.</p>}
          <div className="list">
            {pacientes.map(px => (
              <div className="item" key={px.id}>
                <strong>{px.nome}</strong> {px.idade ? `— ${px.idade} anos` : ''}
                {px.email ? ` • ${px.email}` : ''}
                {px.telefone ? ` • ${px.telefone}` : ''}
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h2>Consultas <span className="badge">{consultas.length}</span></h2>
          {consultas.length === 0 && <p className="muted">Nenhuma consulta registrada.</p>}
          <div className="list">
            {consultas.map(cx => (
              <div className="item" key={cx.id}>
                <strong>{cx.paciente_nome}</strong> — {new Date(cx.data_consulta).toLocaleString()}
                {cx.medico ? ` • ${cx.medico}` : ''}
                {cx.observacao ? ` • ${cx.observacao}` : ''}
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="footer">© {new Date().getFullYear()} Gestão de Prontuários</div>
    </div>
  )
}
