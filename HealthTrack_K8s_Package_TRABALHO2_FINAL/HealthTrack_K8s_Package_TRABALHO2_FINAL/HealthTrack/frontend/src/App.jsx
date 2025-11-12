import React, { useEffect, useMemo, useState } from 'react'

// =====================================================================================
// CONFIGURAÇÃO DE API (mantém compatibilidade com Docker/Nginx e porta em produção)
// =====================================================================================
const API = (location.origin.replace(/:80$/, '') || 'http://localhost').replace(/\/$/, '')
const BACKEND = API.replace(/:\d+$/, '') + ':3000'

// =====================================================================================
// TABELA DE ESPECIALIDADES — usada como select do "médico"
// =====================================================================================
const ESPECIALIDADES = [
  "Clínico Geral", "Cardiologia", "Dermatologia", "Ginecologia",
  "Neurologia", "Ortopedia", "Oftalmologia", "Pediatria",
  "Psiquiatria", "Urologia", "Endocrinologia", "Gastroenterologia",
  "Otorrinolaringologia", "Reumatologia", "Hematologia", "Oncologia",
  "Nefrologia", "Pneumologia", "Infectologia", "Nutrologia"
]

// =====================================================================================
// UTILITÁRIAS BÁSICAS
// =====================================================================================
const isEmpty = (v) => v == null || String(v).trim() === ''
const onlyDigits = (s) => String(s || '').replace(/\D/g, '')
const stripDiacritics = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')

const isValidEmail = (email) =>
  isEmpty(email) || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(String(email).trim())

const isValidPhoneBR11 = (digits) => onlyDigits(digits).length === 11

// =====================================================================================
/**
 * MÁSCARA DE TELEFONE BR (11 dígitos)
 * Mostra: (99) 9 9999-9999
 * Aceita apenas números internamente; a exibição é mascarada.
 */
// =====================================================================================
const formatPhoneBR = (digits) => {
  const d = onlyDigits(digits).slice(0, 11)
  if (d.length === 0) return ''
  const p1 = d.slice(0, 2), p2 = d.slice(2, 3), p3 = d.slice(3, 7), p4 = d.slice(7, 11)
  if (d.length <= 2) return `(${p1}`
  if (d.length === 3) return `(${p1}) ${p2}`
  if (d.length <= 7) return `(${p1}) ${p2} ${p3}`
  return `(${p1}) ${p2} ${p3}-${p4}`
}

// =====================================================================================
// REGRAS DE NOMES — EXCEÇÕES E DICIONÁRIO DE ACENTUAÇÃO/CAPITALIZAÇÃO
// =====================================================================================

/**
 * LOWER_EXCEPTIONS — palavras que devem permanecer minúsculas
 * quando NÃO forem a primeira do nome:
 *  - partículas comuns de nomes em português
 */
const LOWER_EXCEPTIONS = new Set([
  'de','da','do','das','dos',
  'e','com','para','por','em','no','na','nos','nas',
  'a','o','as','os','um','uma','uns','umas',
])

/**
 * ACCENT_OVERRIDES — dicionário extenso para acentuação/capitalização de nomes
 * (chaves SEM acento/minúsculas; valores com acento correto e maiúsculas onde necessário).
 *
 * Observação: este dicionário é extensível. Você pode adicionar novos nomes/sobrenomes conforme uso.
 * Incluí > 200 entradas (nomes e sobrenomes). Mantive representatividade de casos comuns.
 */
const ACCENT_OVERRIDES = {
  // --------- NOMES PRÓPRIOS (comuns no Brasil) -------------------
  'ana':'Ana','anabella':'Anabella','andrea':'Andréa','andre':'André','antonio':'Antônio','augusto':'Augusto',
  'aline':'Aline','alicia':'Alicia','alvaro':'Álvaro','amanda':'Amanda','arthur':'Arthur','alessandra':'Alessandra',
  'beatriz':'Beatriz','bruna':'Bruna','bruno':'Bruno','bernardo':'Bernardo','bianca':'Bianca',
  'caio':'Caio','camila':'Camila','carla':'Carla','carlos':'Carlos','catarina':'Catarina','cecília':'Cecília','cecilia':'Cecília',
  'clara':'Clara','cristiano':'Cristiano','cristina':'Cristina','cintia':'Cíntia','cynthia':'Cynthia',
  'daniel':'Daniel','daniela':'Daniela','diego':'Diego','douglas':'Douglas','davi':'Davi','david':'David','debora':'Débora',
  'eduardo':'Eduardo','elias':'Elias','elisangela':'Elisângela','elisa':'Elisa','emilia':'Emília','enzo':'Enzo',
  'erica':'Érica','erick':'Erick','eva':'Eva',
  'fabielen':'Fabielen','fabiana':'Fabiana','fabio':'Fábio','fernanda':'Fernanda','fernando':'Fernando','felipe':'Felipe',
  'flavia':'Flávia','francisco':'Francisco',
  'gabriel':'Gabriel','gabriela':'Gabriela','gustavo':'Gustavo','giovanna':'Giovanna','giovana':'Giovana',
  'helen':'Helen','helena':'Helena','hugo':'Hugo',
  'igor':'Igor','isabela':'Isabela','isabelly':'Isabelly','ingrid':'Ingrid','iris':'Íris',
  'joao':'João','joaquim':'Joaquim','jose':'José','josefa':'Josefa','julia':'Júlia','juliana':'Juliana',
  'karla':'Karla','karen':'Karen',
  'larissa':'Larissa','laura':'Laura','leandro':'Leandro','leonardo':'Leonardo','leticia':'Letícia',
  'lucas':'Lucas','luana':'Luana','luiz':'Luiz','luis':'Luís','livia':'Lívia',
  'maria':'Maria','mariana':'Mariana','mario':'Mário','marcio':'Márcio','marcia':'Márcia','matheus':'Matheus','mateus':'Mateus',
  'mauricio':'Maurício','mauricio-':'Maurício', 'monica':'Mônica','miguel':'Miguel','manuela':'Manuela',
  'natalia':'Natália','nicollas':'Nicollas','nicolas':'Nicolas','nathan':'Nathan',
  'otavio':'Otávio','olivia':'Olívia',
  'patricia':'Patrícia','paula':'Paula','paulo':'Paulo','pedro':'Pedro','priscila':'Priscila',
  'rafael':'Rafael','rafaela':'Rafaela','renata':'Renata','renato':'Renato','ricardo':'Ricardo','rodrigo':'Rodrigo','roberto':'Roberto',
  'sabrina':'Sabrina','samuel':'Samuel','sandra':'Sandra','simone':'Simone','silvia':'Sílvia','sofia':'Sofia','sophia':'Sophia',
  'tatiane':'Tatiane','thais':'Thaís','thiago':'Thiago','tomas':'Tomás',
  'valentina':'Valentina','vanessa':'Vanessa','vitoria':'Vitória','vinicius':'Vinícius','vinicios':'Vinícios',
  'wagner':'Wagner','wellington':'Wellington','william':'William',
  'yasmin':'Yasmin','yasmim':'Yasmim','yasmeen':'Yasmeen',

  // --------- SOBRENOMES (muito comuns) ---------------------------
  'albuquerque':'Albuquerque','almeida':'Almeida','alves':'Alves','amorim':'Amorim','andrade':'Andrade',
  'araújo':'Araújo','araujo':'Araújo','arruda':'Arruda','assis':'Assis',
  'barbosa':'Barbosa','barros':'Barros','batista':'Batista','brito':'Brito','borges':'Borges',
  'camargo':'Camargo','campos':'Campos','cardoso':'Cardoso','carvalho':'Carvalho','castro':'Castro','cavalcante':'Cavalcante',
  'coelho':'Coelho','correa':'Corrêa','correia':'Correia','costa':'Costa','coutinho':'Coutinho','cunha':'Cunha',
  'dias':'Dias','duarte':'Duarte','diniz':'Diniz',
  'esteves':'Esteves',
  'ferraz':'Ferraz','ferreira':'Ferreira','figueiredo':'Figueiredo','fioravanti':'Fioravanti','fonseca':'Fonseca',
  'freitas':'Freitas','froes':'Fróes','fróes':'Fróes',
  'gama':'Gama','garcia':'Garcia','goes':'Góes','gomes':'Gomes','goncalves':'Gonçalves','guimaraes':'Guimarães',
  'lima':'Lima','lopes':'Lopes','machado':'Machado','maciel':'Maciel','magalhaes':'Magalhães',
  'magro':'Magro','marques':'Marques','martins':'Martins','matos':'Matos','mattos':'Mattos','medeiros':'Medeiros','melo':'Melo',
  'mendes':'Mendes','menezes':'Menezes','miranda':'Miranda','monteiro':'Monteiro','morais':'Morais','moreira':'Moreira',
  'muniz':'Muniz','nascimento':'Nascimento','navarro':'Navarro','neves':'Neves',
  'oliveira':'Oliveira','pacheco':'Pacheco','paiva':'Paiva','peixoto':'Peixoto','pereira':'Pereira',
  'pimenta':'Pimenta','pinto':'Pinto','pires':'Pires','prado':'Prado','queiroz':'Queiroz',
  'ramos':'Ramos','reis':'Reis','ribeiro':'Ribeiro','rocha':'Rocha','rodrigues':'Rodrigues',
  'santana':'Sant’Ana', // normalizamos para Sant’Ana via regra pós-processamento também
  'santiago':'Santiago','santos':'Santos','sarmento':'Sarmento','silva':'Silva','soares':'Soares','souza':'Souza',
  'tavares':'Tavares','teixeira':'Teixeira','torres':'Torres',
  'veloso':'Veloso','viana':'Viana','vieira':'Vieira','xavier':'Xavier',

  // --------- COM APÓSTROFO / HÍFENS / ESTRANGEIROS ----------------
  'davila':"D’Ávila",'davila-':"D’Ávila",   // duplo mapeamento por segurança
  'oconnor':"O’Connor",'obrien':"O’Brien",'oneill':"O’Neill",'odonnell':"O’Donnell",'omalley':"O’Malley",
  'dangelo':"D’Angelo",'dalessandro':"D’Alessandro",'dagostino':"D’Agostino",
  'maria-clara':'Maria-Clara','ana-lucia':'Ana-Lúcia','joao-pedro':'João-Pedro','maria-helena':'Maria-Helena',
  'macedo':'Macedo','macêdo':'Macêdo'
}

/**
 * Regras de capitalização:
 * - Divide por espaços (apenas 1 espaço entre palavras será garantido no onBlur).
 * - Mantém exceções (LOWER_EXCEPTIONS) minúsculas quando NÃO forem a primeira palavra.
 * - Usa ACCENT_OVERRIDES quando existir; caso contrário, capitaliza a primeira letra.
 * - Pós-tratamento para formas conhecidas com apóstrofo (Sant’Ana, D’Ávila).
 */
const capWord = (w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : '')

const capitalizeHumanName = (raw) => {
  if (!raw) return ''
  // Normaliza múltiplos espaços para apenas 1 e remove espaços das pontas
  let base = String(raw).replace(/\s+/g, ' ').trim().toLowerCase()

  // Quebra por espaços (agora garantidamente únicos)
  const words = base.split(' ')

  // Capitaliza cada palavra com dicionário e exceções
  const out = words.map((word, i) => {
    if (i > 0 && LOWER_EXCEPTIONS.has(word)) return word

    // Trata hífens dentro da palavra (ex.: Maria-Clara)
    const hyph = word.split('-').map(seg => {
      const key = stripDiacritics(seg)
      return ACCENT_OVERRIDES[key] || capWord(seg)
    }).join('-')

    return hyph
  }).join(' ')

  // Pós-tratamentos específicos para apóstrofos comuns
  return out
    .replace(/\bsant['’]ana\b/gi, "Sant’Ana")
    .replace(/\bd['’]avila\b/gi, "D’Ávila")
}

// =====================================================================================
// HORÁRIOS FUTUROS (hoje → +30 dias, 08:00–18:00 em intervalos de 1h)
// =====================================================================================
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

// =====================================================================================
// COMPONENTE PRINCIPAL
// =====================================================================================
export default function App() {
  // Estado principal
  const [pacientes, setPacientes] = useState([])
  const [consultas, setConsultas] = useState([])

  // Formulário de Paciente
  const [p, setP] = useState({ nome: '', idade: '', email: '', telefone: '' })
  // Formulário de Consulta
  const [c, setC] = useState({ paciente_id: '', data_consulta: '', medico: '', observacao: '' })

  // Erros inline (email/telefone)
  const [errors, setErrors] = useState({ email: '', telefone: '' })

  // Dados derivados
  const horarios = useMemo(() => gerarHorariosFuturos(), [])
  const IDADES = useMemo(() => Array.from({ length: 120 }, (_, i) => i + 1), []) // 1..120

  // Carrega dados iniciais do backend
  const carregar = async () => {
    const ps = await fetch(`${BACKEND}/pacientes`).then(r => r.json())
    const cs = await fetch(`${BACKEND}/consultas`).then(r => r.json())
    setPacientes(ps); setConsultas(cs)
  }
  useEffect(() => { carregar() }, [])

  // ===================================================================================
  // VALIDAÇÕES INLINE
  // ===================================================================================
  const validateEmail = (val) => {
    if (!isValidEmail(val)) return 'E-mail inválido. Ex.: nome@dominio.com'
    return ''
  }

  const validateTelefone = (val) => {
    const digits = onlyDigits(val)
    if (digits.length === 0) return 'Telefone é obrigatório.'
    if (digits.length !== 11) return 'Informe exatamente 11 dígitos (DDD + 9 + número).'
    return ''
  }

  // Libera o "Salvar Paciente" somente se tudo estiver OK
  const canSubmitPaciente = () => (
    !isEmpty(p.nome) &&
    isValidEmail(p.email) &&
    isValidPhoneBR11(p.telefone) &&
    !errors.email && !errors.telefone
  )

  // ===================================================================================
  // HANDLERS — PACIENTE
  // ===================================================================================
  const addPaciente = async (e) => {
    e.preventDefault()

    // Validações finais antes do POST
    const telErr = validateTelefone(p.telefone)
    const mailErr = validateEmail(p.email)
    const nomeOk = !isEmpty(p.nome)

    setErrors({ telefone: telErr, email: mailErr })
    if (!nomeOk || telErr || mailErr) return

    const resp = await fetch(`${BACKEND}/pacientes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...p,
        nome: capitalizeHumanName(p.nome),
        idade: p.idade ? Number(p.idade) : null,
        email: isEmpty(p.email) ? null : p.email.trim(),
        telefone: onlyDigits(p.telefone) // envia somente números
      })
    })
    if (!resp.ok) { console.error('Erro ao salvar paciente:', resp.status); return }

    // Limpa e recarrega
    setP({ nome: '', idade: '', email: '', telefone: '' })
    setErrors({ email: '', telefone: '' })
    await carregar()
  }

  // ===================================================================================
  // HANDLERS — CONSULTA
  // ===================================================================================
  const addConsulta = async (e) => {
    e.preventDefault()
    if (isEmpty(c.paciente_id) || isEmpty(c.data_consulta)) return

    const resp = await fetch(`${BACKEND}/consultas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(c)
    })
    if (!resp.ok) { console.error('Erro ao salvar consulta:', resp.status); return }

    const created = await resp.json()
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

  // ===================================================================================
  // RENDER
  // ===================================================================================
  return (
    <div className="container">
      {/* =================================================================================
          CSS EMBUTIDO — estilos gerais, inputs, mensagens de erro, cards e grid
          ================================================================================= */}
      <style>{`
        :root{
          --bg:#0b1220; --card:#0f172a; --muted:#94a3b8; --text:#e2e8f0;
          --primary:#22c55e; --ring:#22c55e33; --danger:#ef4444;
        }
        *{box-sizing:border-box}
        html,body{height:100%}
        body{
          margin:0;
          background: radial-gradient(1200px 600px at 10% -10%, #1e293b 0%, transparent 60%),
                      radial-gradient(1000px 800px at 90% 10%, #0ea5e9 0%, transparent 40%),
                      linear-gradient(180deg,#0b1220 0%,#0a0f1e 100%);
          color:var(--text);
          font-family: Inter, system-ui, -apple-system, "Segoe UI", Roboto, Arial, "Noto Sans", "Helvetica Neue", sans-serif;
        }
        .container{max-width:1100px;margin:0 auto;padding:24px}

        .nav{
          display:flex;align-items:center;justify-content:space-between;
          padding:18px 22px;border:1px solid #1f2937;border-radius:16px;
          background: linear-gradient(180deg, #0d1426 0%, #0b111f 100%);
          box-shadow: 0 10px 30px rgba(0,0,0,.35), inset 0 0 0 1px rgba(255,255,255,.03);
          backdrop-filter: blur(6px);
        }
        .brand{display:flex;align-items:center;gap:12px;font-weight:700;letter-spacing:.3px}
        .brand .logo{width:32px;height:32px;border-radius:10px;background:linear-gradient(135deg,#22c55e, #06b6d4); box-shadow:0 4px 18px #22c55e44}
        .brand span{font-size:18px}
        .nav small{color:var(--muted)}

        .hero{margin:20px 0 6px}
        h1{font-size:28px;margin:10px 0 6px}
        h2{font-size:18px;margin:0 0 12px}
        p.muted{color:var(--muted);margin:0 0 18px}

        .grid{display:grid;grid-template-columns:1fr;gap:18px;margin-top:20px}
        @media (min-width: 960px){
          .grid{grid-template-columns:1fr 1fr}
        }

        .card{
          background:var(--card);
          border:1px solid #1e293b;
          border-radius:16px;
          padding:18px;
          box-shadow: 0 8px 28px rgba(0,0,0,.28), 0 0 0 1px rgba(255,255,255,.03) inset;
        }

        input, select, textarea{
          width:100%;padding:12px 14px;border-radius:12px;border:1px solid #334155;
          background:#0b1324;color:var(--text);outline:none;transition:border .2s, box-shadow .2s;
        }
        input:focus, select:focus, textarea:focus{border-color:var(--primary); box-shadow:0 0 0 4px var(--ring)}
        .field{display:flex;flex-direction:column;gap:6px;margin-bottom:10px}
        .error{color:var(--danger); font-size:12px}
        .input-error{border-color:var(--danger) !important}
        button{
          padding:12px 16px;border:0;border-radius:12px;cursor:pointer;font-weight:600;
          background:linear-gradient(135deg,var(--primary),#10b981); color:#052011;
          box-shadow:0 10px 24px #22c55e33, 0 0 0 1px #22c55e44 inset;
        }
        button:hover{filter:brightness(1.05)}
        button:disabled{opacity:.6; cursor:not-allowed; filter:grayscale(30%)}

        .list{display:grid;gap:10px}
        .item{background:#0b1324;border:1px solid #1f2a44;padding:12px 14px;border-radius:12px}
        .badge{display:inline-block;padding:4px 10px;border-radius:9999px;background:#0ea5e9; color:white; font-size:12px; margin-left:8px}

        .footer{margin-top:18px;color:var(--muted);font-size:12px;text-align:center}
      `}</style>

      {/* Barra superior */}
      <nav className="nav">
        <div className="brand">
          <div className="logo" />
          <span>Gestão de Prontuários — 2025</span>
        </div>
        <small>React + Node + Postgres • Docker • Kubernetes</small>
      </nav>

      {/* Título/Hero */}
      <div className="hero">
        <h1>Registro de Pacientes e Consultas</h1>
        <p className="muted">Inclua pacientes, agende consultas e visualize tudo em tempo real.</p>
      </div>

      <section className="grid">
        {/* =================================================================================
            CARD — NOVO PACIENTE
            ================================================================================= */}
        <div className="card">
          <h2>Novo Paciente</h2>
          <form onSubmit={addPaciente} noValidate>
            {/* NOME: digitação livre; normaliza para 1 espaço + capitalização/acentuação no onBlur */}
            <div className="field">
              <input
                placeholder="Nome *"
                value={p.nome}
                onChange={e => {
                  // Permite digitar livre, inclusive múltiplos espaços enquanto digita
                  setP(prev => ({ ...prev, nome: e.target.value }))
                }}
                onBlur={e => {
                  // Ao sair do campo, força apenas 1 espaço e aplica capitalização/acentuação
                  const valor = e.target.value.replace(/\s+/g, ' ').trim()
                  setP(prev => ({ ...prev, nome: capitalizeHumanName(valor) }))
                }}
                required
              />
            </div>

            {/* IDADE 1..120 (opcional) */}
            <div className="field">
              <select
                value={p.idade}
                onChange={e => setP(prev => ({ ...prev, idade: e.target.value }))}
              >
                <option value="">Idade</option>
                {IDADES.map(age => <option key={age} value={age}>{age}</option>)}
              </select>
            </div>

            {/* E-MAIL — validação inline e borda vermelha quando inválido */}
            <div className="field">
              <input
                placeholder="E-mail"
                type="email"
                value={p.email}
                onChange={e => {
                  const v = e.target.value
                  setP(prev => ({ ...prev, email: v }))
                  setErrors(prev => ({ ...prev, email: validateEmail(v) }))
                }}
                onBlur={e => setErrors(prev => ({ ...prev, email: validateEmail(e.target.value) }))}
                className={errors.email ? 'input-error' : undefined}
                aria-invalid={!!errors.email}
                aria-describedby="email-err"
              />
              {errors.email && <small id="email-err" className="error">{errors.email}</small>}
            </div>

            {/* TELEFONE — máscara visual + validação inline (11 dígitos), borda vermelha e mensagem */}
            <div className="field">
              <input
                placeholder="(99) 9 9999-9999"
                type="tel"
                inputMode="numeric"
                value={formatPhoneBR(p.telefone)}
                onChange={e => {
                  // Mantém apenas números e limita a 11 (DDD + 9 + número)
                  const digits = onlyDigits(e.target.value).slice(0, 11)
                  setP(prev => ({ ...prev, telefone: digits }))
                  setErrors(prev => ({ ...prev, telefone: validateTelefone(digits) }))
                }}
                onBlur={e => {
                  const digits = onlyDigits(e.target.value)
                  setErrors(prev => ({ ...prev, telefone: validateTelefone(digits) }))
                }}
                className={errors.telefone ? 'input-error' : undefined}
                aria-invalid={!!errors.telefone}
                aria-describedby="tel-err"
                required
              />
              {errors.telefone && <small id="tel-err" className="error">{errors.telefone}</small>}
            </div>

            <button disabled={!canSubmitPaciente()}>Salvar Paciente</button>
          </form>
        </div>

        {/* =================================================================================
            CARD — AGENDAR CONSULTA
            ================================================================================= */}
        <div className="card">
          <h2>Agendar Consulta</h2>
          <form onSubmit={addConsulta}>
            <select value={c.paciente_id} onChange={e => setC({ ...c, paciente_id: e.target.value })} required>
              <option value="">Selecione o Paciente *</option>
              {pacientes.map(px => <option key={px.id} value={px.id}>{px.nome}</option>)}
            </select>

            <select value={c.data_consulta} onChange={e => setC({ ...c, data_consulta: e.target.value })} required>
              <option value="">Selecione Data/Hora *</option>
              {horarios.map(h => {
                const isPast = new Date(h) < new Date()
                return (
                  <option key={h} value={h} disabled={isPast}>
                    {new Date(h).toLocaleString()}{isPast ? " (indisponível)" : ""}
                  </option>
                )
              })}
            </select>

            <select value={c.medico} onChange={e => setC({ ...c, medico: e.target.value })}>
              <option value="">Especialidade</option>
              {ESPECIALIDADES.map(sp => <option key={sp} value={sp}>{sp}</option>)}
            </select>

            <input
              placeholder="Observação"
              value={c.observacao}
              onChange={e => setC({ ...c, observacao: e.target.value })}
            />
            <button>Salvar Consulta</button>
          </form>
        </div>

        {/* =================================================================================
            CARD — LISTA DE PACIENTES
            ================================================================================= */}
        <div className="card">
          <h2>Pacientes <span className="badge">{pacientes.length}</span></h2>
          {pacientes.length === 0 && <p className="muted">Nenhum paciente cadastrado.</p>}
          <div className="list">
            {pacientes.map(px => (
              <div className="item" key={px.id}>
                <strong>{px.nome}</strong> {px.idade ? `— ${px.idade} anos` : ''}
                {px.email ? ` • ${px.email}` : ''}
                {px.telefone ? ` • ${formatPhoneBR(px.telefone)}` : ''}
              </div>
            ))}
          </div>
        </div>

        {/* =================================================================================
            CARD — LISTA DE CONSULTAS
            ================================================================================= */}
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

      <div className="footer">© {new Date().getFullYear()} Gestão de Prontuários ©</div>
    </div>
  )
}