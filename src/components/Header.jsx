import { useLocation, useNavigate } from 'react-router-dom'

const PAGE_INFO = {
  '/': { title: 'Dashboard', subtitle: 'Visão clínica do dia' },
  '/agenda': { title: 'Agenda', subtitle: 'Centro operacional de atendimentos' },
  '/pacientes': { title: 'Pacientes', subtitle: 'Carteira clínica e jornadas ativas' },
  '/prontuario': { title: 'Prontuário', subtitle: 'Jornada clínica e evolução do paciente' },
  '/sessoes': { title: 'Sessões', subtitle: 'Histórico de evoluções e notas clínicas' },
  '/crm': { title: 'Relacionamento', subtitle: 'Jornadas e continuidade do cuidado' },
  '/financeiro': { title: 'Financeiro', subtitle: 'Saúde financeira do estúdio' },
  '/servicos': { title: 'Serviços', subtitle: 'Modalidades terapêuticas e precificação' },
  '/planos': { title: 'Planos Terapêuticos', subtitle: 'Protocolos, prescrições e exercícios' },
  '/area-paciente': { title: 'Portal do Paciente', subtitle: 'Experiência de acompanhamento premium' },
  '/relatorio-pos-sessao': { title: 'Pós-sessão', subtitle: 'Relatório terapêutico e mapa corporal' },
}

export default function Header() {
  const { pathname } = useLocation()
  const navigate = useNavigate()

  const base = '/' + pathname.split('/')[1]
  const info = PAGE_INFO[base] || { title: 'Clínica', subtitle: '' }

  const today = new Date().toLocaleDateString('pt-BR', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
  })

  return (
    <header className="header">
      <div className="header-copy">
        <h2 className="header-title">{info.title}</h2>
        {info.subtitle && <p className="header-sub">Bom trabalho. {info.subtitle}</p>}
      </div>
      <div className="header-right">
        <div className="header-search" aria-label="Busca global visual">
          <input placeholder="Buscar jornada, paciente ou protocolo" readOnly />
        </div>
        <span className="header-date"><span className="date-dot" aria-hidden="true" />{today}</span>
        <button className="btn btn-primary btn-sm quick-action" onClick={() => navigate('/agenda')}>
          Agendar cuidado
        </button>
      </div>
    </header>
  )
}
