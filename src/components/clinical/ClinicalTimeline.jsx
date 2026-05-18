import { useMemo, useState } from 'react'
import { buildClinicalTimeline, formatDate } from '../../domain/clinical'

const FILTERS = ['Todos', 'Sessão realizada', 'Evolução clínica', 'Agendamento']

export default function ClinicalTimeline({ patient, slots, prontuario, servicos }) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('Todos')

  const items = useMemo(
    () => buildClinicalTimeline({ patient, slots, prontuario, servicos }),
    [patient, slots, prontuario, servicos]
  )

  const filtered = items.filter(item => {
    const matchesType = filter === 'Todos' || item.type === filter
    const q = query.trim().toLowerCase()
    const matchesQuery = !q || [item.title, item.summary, item.professional, item.status].join(' ').toLowerCase().includes(q)
    return matchesType && matchesQuery
  })

  return (
    <section className="journey-shell">
      <div className="journey-toolbar">
        <div>
          <div className="section-kicker">Jornada do paciente</div>
          <h3>Histórico cronológico</h3>
        </div>
        <div className="journey-tools">
          <div className="search-bar">
            <span className="search-icon" />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar na jornada..." />
          </div>
          <select className="form-control" value={filter} onChange={e => setFilter(e.target.value)}>
            {FILTERS.map(item => <option key={item}>{item}</option>)}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon" />
          <h3>Nenhum registro encontrado</h3>
          <p>Ajuste os filtros para visualizar a jornada clínica.</p>
        </div>
      ) : (
        <div className="premium-timeline">
          {filtered.map((item, index) => (
            <article key={item.id} className={`premium-timeline-item timeline-${item.tone}`}>
              <div className="timeline-rail">
                <span className="timeline-node" />
                {index < filtered.length - 1 && <span className="timeline-line" />}
              </div>
              <div className="timeline-card">
                <div className="timeline-card-head">
                  <div>
                    <span className="timeline-type">{item.type}</span>
                    <h4>{item.title}</h4>
                  </div>
                  <div className="timeline-date">{formatDate(item.date)}{item.time ? `, ${item.time}` : ''}</div>
                </div>
                <p>{item.summary}</p>
                <div className="timeline-meta">
                  <span>{item.professional || 'Equipe clínica'}</span>
                  <span>{item.meta}</span>
                  <span>{item.status}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
