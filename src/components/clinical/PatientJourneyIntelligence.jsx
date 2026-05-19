import { useMemo } from 'react'
import { useApp } from '../../context/AppContext'
import { generateClinicalRelationshipInsights, getClinicalEngagementScore } from '../../domain/clinicalInsights'

const SEVERITY_LABEL = { high: 'Alta', medium: 'Média', low: 'Baixa' }
const SEVERITY_CSS = { high: 'cri-badge-high', medium: 'cri-badge-medium', low: 'cri-badge-low' }

const SCORE_COLORS = {
  stable: 'var(--success)',
  monitor: 'var(--primary)',
  attention: 'var(--warning)',
  interrupted: 'var(--danger)',
}

function ScoreGauge({ score, label, classification }) {
  const color = SCORE_COLORS[classification] || 'var(--primary)'
  const circumference = 2 * Math.PI * 32
  const dash = (score / 100) * circumference

  return (
    <div className="pji-gauge-wrapper">
      <svg width="84" height="84" viewBox="0 0 84 84" aria-hidden="true">
        <circle cx="42" cy="42" r="32" fill="none" stroke="var(--border-light)" strokeWidth="7" />
        <circle
          cx="42" cy="42" r="32" fill="none"
          stroke={color} strokeWidth="7"
          strokeDasharray={`${dash} ${circumference}`}
          strokeLinecap="round"
          transform="rotate(-90 42 42)"
          style={{ transition: 'stroke-dasharray 0.6s ease' }}
        />
        <text x="42" y="46" textAnchor="middle" fontSize="17" fontWeight="700" fill={color}>{score}</text>
      </svg>
      <div className="pji-gauge-label" style={{ color }}>{label}</div>
    </div>
  )
}

export default function PatientJourneyIntelligence({ patient }) {
  const { agendaSlots, prontuarios, patients, plans, showToast } = useApp()

  const score = useMemo(() =>
    getClinicalEngagementScore(patient.id, {
      patients,
      sessions: agendaSlots,
      evaluations: prontuarios,
    }),
    [patient.id, patients, agendaSlots, prontuarios]
  )

  const allInsights = useMemo(() =>
    generateClinicalRelationshipInsights({
      patients,
      sessions: agendaSlots,
      evaluations: prontuarios,
      plans,
    }),
    [patients, agendaSlots, prontuarios, plans]
  )

  const patientInsights = allInsights.filter(i => i.patientId === patient.id).slice(0, 4)
  const topInsight = patientInsights[0]

  function handleAction(label) {
    showToast(`${label} registrado para ${patient.name}`, 'info')
  }

  return (
    <div className="pji-block card">
      <div className="pji-header">
        <div>
          <div className="section-kicker">Inteligência da jornada</div>
          <h4 className="pji-title">Análise de engajamento clínico</h4>
        </div>
        <span className="badge badge-muted">Local</span>
      </div>

      <div className="pji-body">
        <div className="pji-score-side">
          <ScoreGauge score={score.score} label={score.label} classification={score.classification} />
          <div className="pji-score-meta">
            {score.inactiveDays !== null && (
              <div className="pji-meta-row">
                <span className="pji-meta-label">Último cuidado</span>
                <span className="pji-meta-val">{score.inactiveDays} dia{score.inactiveDays !== 1 ? 's' : ''}</span>
              </div>
            )}
            <div className="pji-meta-row">
              <span className="pji-meta-label">Sessões realizadas</span>
              <span className="pji-meta-val">{score.completedCount}</span>
            </div>
            <div className="pji-meta-row">
              <span className="pji-meta-label">Próximo agendamento</span>
              <span className="pji-meta-val">{score.hasNextSession ? 'Sim' : 'Não marcado'}</span>
            </div>
          </div>
        </div>

        <div className="pji-alerts-side">
          {patientInsights.length === 0 ? (
            <div className="pji-no-alerts">
              <span className="pji-no-alerts-icon">✦</span>
              <p>Sem alertas clínicos no momento. Jornada dentro do esperado.</p>
            </div>
          ) : (
            <>
              <div className="pji-alerts-label">Principais alertas</div>
              <div className="pji-alerts-list">
                {patientInsights.map(insight => (
                  <div key={insight.id} className={`pji-alert pji-alert-${insight.severity}`}>
                    <div className="pji-alert-top">
                      <span className={`cri-badge ${SEVERITY_CSS[insight.severity]}`}>{SEVERITY_LABEL[insight.severity]}</span>
                      <span className="pji-alert-title">{insight.title}</span>
                    </div>
                    <p className="pji-alert-desc">{insight.description}</p>
                  </div>
                ))}
              </div>
            </>
          )}

          {topInsight && (
            <div className="pji-next-action">
              <div className="pji-next-label">Próxima ação recomendada</div>
              <p className="pji-next-text">{topInsight.suggestedAction}</p>
              <div className="pji-action-btns">
                <button className="btn btn-sm btn-primary" onClick={() => handleAction('Agendamento de retorno')}>Agendar retorno</button>
                <button className="btn btn-sm btn-secondary" onClick={() => handleAction('Contato registrado')}>Registrar contato</button>
                <button className="btn btn-sm btn-whatsapp" onClick={() => handleAction('WhatsApp preparado')}>WhatsApp</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
