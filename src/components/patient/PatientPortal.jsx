import ClinicalProgress from '../clinical/ClinicalProgress'
import { EXERCISE_LIBRARY, calculateClinicalProgress, formatDate, getCompletedSessions, getNextSession } from '../../domain/clinical'

export default function PatientPortal({ patient, slots, plans }) {
  if (!patient) return null

  const completed = getCompletedSessions(slots, patient.id)
  const sessions = completed.slice(-4).reverse()
  const next = getNextSession(slots, patient.id)
  const plan = plans.find(p => p.id === patient.planId) || (plans.length === 1 ? plans[0] : null)
  const planName = plan?.name || null
  const recommended = EXERCISE_LIBRARY.slice(0, 3)
  const progress = calculateClinicalProgress(patient, slots)
  const planTotal = plan?.sessions || 10
  const planCompletion = Math.min(100, Math.round((completed.length / planTotal) * 100))
  const nextSteps = [
    progress.latestPain >= 5 ? 'Priorizar mobilidade guiada e reduzir carga nas próximas 48h.' : 'Manter rotina leve para consolidar a melhora percebida.',
    next ? `Próximo encontro em ${formatDate(next.date, { day: 'numeric', month: 'long' })} às ${next.time}.` : 'Agendar retorno para manter continuidade terapêutica.',
    'Registrar percepção de dor, energia e rigidez antes da próxima sessão.',
  ]

  return (
    <section className="patient-portal">
      <div className="patient-portal-hero">
        <div>
          <div className="section-kicker">Sua jornada de cuidado</div>
          <h3>{patient.name?.split(' ')[0]}, bem-vindo ao seu espaço</h3>
          <p>Aqui você acompanha sua evolução, seus próximos passos e as orientações da clínica entre as sessões.</p>
        </div>
        <span className="badge badge-success">Jornada ativa</span>
      </div>

      <div className="portal-message-card">
        <span>Mensagem da equipe clínica</span>
        <strong>{progress.trend}</strong>
        <p>
          {progress.overall >= 70
            ? 'Sua evolução está consistente e dentro do esperado. Vamos manter o ritmo e preservar juntos os ganhos conquistados.'
            : 'Estamos acompanhando sua resposta ao tratamento de perto. Cada sessão importa — pequenos ajustes garantem uma evolução segura e duradoura.'}
        </p>
      </div>

      <ClinicalProgress patient={patient} slots={slots} compact />

      <div className="patient-portal-grid">
        <div className="portal-panel">
          <div className="portal-panel-title">Exercícios recomendados</div>
          {recommended.map(item => (
            <div key={item.id} className="exercise-prescription">
              <div>
                <strong>{item.name}</strong>
                <small>{item.target}</small>
              </div>
              <span>{item.duration}</span>
            </div>
          ))}
        </div>

        <div className="portal-panel">
          <div className="portal-panel-title">Sessões recentes</div>
          {sessions.length === 0 ? (
            <p className="metric-detail">Nenhuma sessão concluída ainda.</p>
          ) : (
            sessions.map(session => (
              <div key={session.id} className="portal-session-row">
                <strong>{formatDate(session.date, { day: 'numeric', month: 'short' })}</strong>
                <span>{session.evolucao || session.relatorioParaPaciente || 'Sessão registrada.'}</span>
              </div>
            ))
          )}
        </div>

        <div className="portal-panel">
          <div className="portal-panel-title">Pacote atual</div>
          <div className="package-card">
            <strong>{planName || 'Protocolo em acompanhamento'}</strong>
            <span>{completed.length} {plan ? `de ${planTotal} sessões concluídas` : 'sessões realizadas'}</span>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${planCompletion}%` }} />
            </div>
            <small>{next ? `Próximo atendimento: ${formatDate(next.date)} às ${next.time}` : 'Sem retorno marcado'}</small>
          </div>
        </div>
      </div>

      <div className="portal-next-steps">
        <div>
          <div className="section-kicker">Próximos passos</div>
          <h4>Continuidade do cuidado</h4>
        </div>
        <div className="portal-step-list">
          {nextSteps.map(step => <span key={step}>{step}</span>)}
        </div>
      </div>
    </section>
  )
}
