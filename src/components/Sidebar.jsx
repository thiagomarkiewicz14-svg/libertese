import { NavLink, useLocation } from 'react-router-dom'

const NAV = [
  { section: 'Clínica', items: [
    { to: '/', icon: 'OV', label: 'Dashboard' },
    { to: '/agenda', icon: 'AG', label: 'Agenda' },
  ]},
  { section: 'Pacientes', items: [
    { to: '/pacientes', icon: 'PC', label: 'Pacientes' },
    { to: '/prontuario', icon: 'CL', label: 'Centro clínico' },
    { to: '/sessoes', icon: 'SS', label: 'Sessões' },
    { to: '/relatorio-pos-sessao', icon: 'RP', label: 'Pós-sessão' },
    { to: '/area-paciente', icon: 'AP', label: 'Portal paciente' },
  ]},
  { section: 'Gestão', items: [
    { to: '/crm', icon: 'RL', label: 'Relacionamento' },
    { to: '/financeiro', icon: 'FN', label: 'Financeiro' },
  ]},
  { section: 'Configurações', items: [
    { to: '/servicos', icon: 'SV', label: 'Serviços' },
    { to: '/planos', icon: 'PL', label: 'Planos Terapêuticos' },
    { to: '/equipe', icon: 'EQ', label: 'Equipe' },
  ]},
]

export default function Sidebar() {
  const { pathname } = useLocation()

  function isActive(to) {
    return to === '/' ? pathname === '/' : pathname.startsWith(to)
  }

  return (
    <aside className="sidebar" aria-label="Navegação principal">
      <div className="sidebar-logo">
        <div className="sidebar-logo-brand">
          <img src="/brand/libertese-logo.jpeg" alt="Liberte-se" className="sidebar-logo-img" />
        </div>
        <p className="sidebar-logo-tagline">Pilates · Osteopatia · Movimento consciente</p>
      </div>

      <nav className="sidebar-nav">
        {NAV.map(group => (
          <div key={group.section}>
            <div className="nav-section-label">{group.section}</div>
            {group.items.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                className={() => `nav-item ${isActive(item.to) ? 'active' : ''}`}
              >
                <span className="nav-icon" aria-hidden="true">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        Liberte-se · 2026
      </div>
    </aside>
  )
}
