import { useState, useMemo } from 'react'
import { useApp } from '../../context/AppContext'
import { generateClinicalRelationshipInsights, getClinicalEngagementScore } from '../../domain/clinicalInsights'

const TYPE_LABELS = {
  RETURN_OVERDUE: 'Retorno pendente',
  NO_FOLLOW_UP_AFTER_SESSION: 'Sem próximo passo',
  ABANDONMENT_RISK: 'Risco de afastamento',
  ATTENDANCE_DROP: 'Frequência em queda',
  RECURRING_ABSENCE: 'Ausências recorrentes',
  REACTIVATION_OPPORTUNITY: 'Reativação',
  EVALUATION_OUTDATED: 'Reavaliação',
  PACKAGE_OPPORTUNITY: 'Pacote',
}

const SEVERITY_LABEL = { high: 'Alta', medium: 'Média', low: 'Baixa' }
const SEVERITY_CSS = { high: 'cri-badge-high', medium: 'cri-badge-medium', low: 'cri-badge-low' }
const CATEGORY_ICON = {
  retention: '◈',
  attendance: '◎',
  clinical: '✦',
  commercial: '◇',
}

const FILTER_OPTIONS = [
  { key: 'all', label: 'Todos' },
  { key: 'retention', label: 'Retorno pendente' },
  { key: 'attention', label: 'Em atenção' },
  { key: 'reactivation', label: 'Reativação' },
  { key: 'clinical', label: 'Avaliação' },
  { key: 'attendance', label: 'Frequência' },
]

function ActionModal({ insight, onClose }) {
  const { showToast } = useApp()

  function handle(action) {
    const msgs = {
      schedule: `Agendar retorno anotado para ${insight.patientName}`,
      contact: `Contato registrado para ${insight.patientName}`,
      whatsapp: `WhatsApp preparado para ${insight.patientName}`,
      followed: `${insight.patientName} marcada como acompanhada`,
    }
    showToast(msgs[action] || 'Ação registrada', action === 'followed' ? 'success' : 'info')
    onClose()
  }

  return (
    <div className="cri-modal-backdrop" onClick={onClose}>
      <div className="cri-modal" onClick={e => e.stopPropagation()}>
        <div className="cri-modal-header">
          <div>
            <span className="cri-modal-kicker">Ação rápida</span>
            <h4 className="cri-modal-title">{insight.patientName}</h4>
          </div>
          <button className="cri-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="cri-modal-body">
          <p className="cri-modal-desc">{insight.description}</p>
          <p className="cri-modal-action-hint">{insight.suggestedAction}</p>
        </div>
        <div className="cri-modal-actions">
          <button className="btn btn-primary btn-sm" onClick={() => handle('schedule')}>Agendar retorno</button>
          <button className="btn btn-secondary btn-sm" onClick={() => handle('contact')}>Registrar contato</button>
          <button className="btn btn-whatsapp btn-sm" onClick={() => handle('whatsapp')}>Enviar WhatsApp</button>
          <button className="btn btn-ghost btn-sm" onClick={() => handle('followed')}>Marcar como acompanhada</button>
        </div>
      </div>
    </div>
  )
}

function InsightItem({ insight, onAction, onOpenPatient, dismissed, onDismiss }) {
  if (dismissed) return null
  return (
    <div className={`cri-item cri-item-${insight.severity}`}>
      <div className="cri-item-left">
        <span className="cri-category-icon" title={insight.category}>{CATEGORY_ICON[insight.category] || '·'}</span>
      </div>
      <div className="cri-item-body">
        <div className="cri-item-top">
          <span className={`cri-badge ${SEVERITY_CSS[insight.severity]}`}>{SEVERITY_LABEL[insight.severity]}</span>
          <span className="cri-item-type">{TYPE_LABELS[insight.type] || insight.type}</span>
        </div>
        <button className="cri-item-name" onClick={() => onOpenPatient?.(insight.patientId)}>
          {insight.patientName}
        </button>
        <p className="cri-item-desc">{insight.description}</p>
        <p className="cri-item-hint">{insight.suggestedAction}</p>
        {insight.daysSinceLastSession !== null && (
          <span className="cri-item-meta">
            Última sessão há {insight.daysSinceLastSession} dia{insight.daysSinceLastSession === 1 ? '' : 's'}
          </span>
        )}
      </div>
      <div className="cri-item-actions">
        <button className="cri-action-btn" onClick={() => onAction(insight)}>Agir</button>
        <button className="cri-dismiss-btn" onClick={() => onDismiss(insight.id)} title="Dispensar">✕</button>
      </div>
    </div>
  )
}

export default function ClinicalRelationshipInsights({ onOpenPatient }) {
  const { patients, agendaSlots, prontuarios, plans, showToast } = useApp()
  const [filter, setFilter] = useState('all')
  const [activeModal, setActiveModal] = useState(null)
  const [dismissed, setDismissed] = useState(new Set())

  const insights = useMemo(() =>
    generateClinicalRelationshipInsights({
      patients,
      sessions: agendaSlots,
      evaluations: prontuarios,
      plans,
    }),
    [patients, agendaSlots, prontuarios, plans]
  )

  const filtered = useMemo(() => {
    if (filter === 'all') return insights
    if (filter === 'retention') return insights.filter(i => i.category === 'retention')
    if (filter === 'attention') return insights.filter(i => i.severity === 'high' || i.severity === 'medium')
    if (filter === 'reactivation') return insights.filter(i => i.type === 'REACTIVATION_OPPORTUNITY')
    if (filter === 'clinical') return insights.filter(i => i.category === 'clinical')
    if (filter === 'attendance') return insights.filter(i => i.category === 'attendance')
    return insights
  }, [insights, filter])

  const visible = filtered.filter(i => !dismissed.has(i.id))

  const summaryCards = [
    {
      label: 'Retornos pendentes',
      value: insights.filter(i => i.type === 'RETURN_OVERDUE').length,
      tone: 'high',
    },
    {
      label: 'Jornadas em atenção',
      value: insights.filter(i => i.severity === 'high').length,
      tone: 'medium',
    },
    {
      label: 'Oportunidades de reativação',
      value: insights.filter(i => i.type === 'REACTIVATION_OPPORTUNITY').length,
      tone: 'low',
    },
    {
      label: 'Avaliações desatualizadas',
      value: insights.filter(i => i.type === 'EVALUATION_OUTDATED').length,
      tone: 'clinical',
    },
  ]

  const priority = visible.filter(i => i.severity === 'high').slice(0, 5)

  function handleDismiss(id) {
    setDismissed(prev => new Set([...prev, id]))
    showToast('Acompanhamento dispensado', 'info')
  }

  return (
    <section className="cri-section">
      <div className="cri-header">
        <div>
          <div className="section-kicker">Inteligência de relacionamento clínico</div>
          <h3 className="cri-title">Jornadas que merecem atenção agora</h3>
        </div>
        <span className="badge badge-muted">Local · Sem IA externa</span>
      </div>

      <div className="cri-summary-grid">
        {summaryCards.map(card => (
          <div key={card.label} className={`cri-summary-card cri-summary-${card.tone}`}>
            <div className="cri-summary-value">{card.value}</div>
            <div className="cri-summary-label">{card.label}</div>
          </div>
        ))}
      </div>

      {priority.length > 0 && (
        <div className="cri-priority-strip">
          <div className="cri-priority-label">Hoje você deveria acompanhar</div>
          <div className="cri-priority-list">
            {priority.map(insight => (
              <div key={insight.id} className="cri-priority-item">
                <span className={`cri-badge ${SEVERITY_CSS[insight.severity]}`}>{SEVERITY_LABEL[insight.severity]}</span>
                <button className="cri-priority-name" onClick={() => onOpenPatient?.(insight.patientId)}>
                  {insight.patientName}
                </button>
                <span className="cri-priority-reason">{insight.title}</span>
                {insight.daysSinceLastSession !== null && (
                  <span className="cri-priority-days">{insight.daysSinceLastSession}d</span>
                )}
                <button className="cri-action-btn cri-action-sm" onClick={() => setActiveModal(insight)}>Agir</button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="cri-filter-bar">
        {FILTER_OPTIONS.map(opt => (
          <button
            key={opt.key}
            className={`cri-filter-btn ${filter === opt.key ? 'active' : ''}`}
            onClick={() => setFilter(opt.key)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="cri-empty">
          <div className="empty-icon" />
          <h4>Nenhum alerta no momento</h4>
          <p>Todas as jornadas clínicas estão sem pendências para este filtro.</p>
        </div>
      ) : (
        <div className="cri-list">
          {visible.map(insight => (
            <InsightItem
              key={insight.id}
              insight={insight}
              onAction={setActiveModal}
              onOpenPatient={onOpenPatient}
              dismissed={dismissed.has(insight.id)}
              onDismiss={handleDismiss}
            />
          ))}
        </div>
      )}

      {activeModal && (
        <ActionModal insight={activeModal} onClose={() => setActiveModal(null)} />
      )}
    </section>
  )
}
