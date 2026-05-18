import { generateAutomations, generateClinicalInsights } from '../../domain/clinical'

export default function ClinicalIntelligence({ patients, slots, compact = false, onOpenPatient }) {
  const insights = generateClinicalInsights({ patients, slots })
  const automations = generateAutomations({ patients, slots }).slice(0, compact ? 4 : 8)

  return (
    <section className={`clinical-intelligence ${compact ? 'clinical-intelligence-compact' : ''}`}>
      <div className="clinical-intelligence-head">
        <div>
          <div className="section-kicker">Inteligência clínica</div>
          <h3>Assistente operacional</h3>
        </div>
        <span className="badge badge-muted">Assistente local</span>
      </div>

      <div className="insight-grid">
        {insights.map(item => (
          <article key={item.title} className={`ai-insight-card insight-${item.tone}`}>
            <span>{item.title}</span>
            <strong>{item.text}</strong>
            <p>{item.detail}</p>
          </article>
        ))}
      </div>

      <div className="automation-panel">
        <div className="automation-title">Próximos movimentos sugeridos</div>
        {automations.length === 0 ? (
          <div className="metric-detail">Nenhuma prioridade clínica pendente agora.</div>
        ) : (
          automations.map(task => (
            <button key={task.id} className="automation-row" onClick={() => onOpenPatient?.(task.patient.id)}>
              <span className={`automation-priority priority-${task.priority.toLowerCase()}`}>{task.priority}</span>
              <span>
                <strong>{task.type}</strong>
                <small>{task.patient.name} - {task.detail}</small>
              </span>
            </button>
          ))
        )}
      </div>
    </section>
  )
}
