import { NavLink, useLocation } from 'react-router-dom'

const NAV = [
  {
    section: 'Hoje',
    items: [
      { to: '/', icon: 'ID', label: 'Início do dia' },
      { to: '/agenda', icon: 'AG', label: 'Agenda clínica' },
    ],
  },
  {
    section: 'Pacientes',
    items: [
      { to: '/prontuario', icon: 'JC', label: 'Jornada clínica' },
      { to: '/pacientes', icon: 'PC', label: 'Lista de pacientes' },
    ],
  },
  {
    section: 'Inteligência',
    items: [
      { to: '/crm', icon: 'IC', label: 'Insights clínicos' },
    ],
  },
  {
    section: 'Operação',
    items: [
      { to: '/financeiro', icon: 'FN', label: 'Financeiro' },
      { to: '/servicos', icon: 'SV', label: 'Serviços' },
      { to: '/planos', icon: 'PL', label: 'Planos' },
      { to: '/equipe', icon: 'EQ', label: 'Equipe' },
    ],
  },
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
