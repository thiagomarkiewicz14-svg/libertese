import ClinicalProgress from './ClinicalProgress'
import ProgressBar from '../ui/ProgressBar'
import { formatDate, getPatientNarrative } from '../../domain/clinical'

function NarrativeList({ title, items, tone = 'olive' }) {
  return (
    <div className={`narrative-list narrative-${tone}`}>
      <div className="narrative-title">{title}</div>
      {items.slice(0, 4).map(item => (
        <div key={item} className="narrative-item">{item}</div>
      ))}
    </div>
  )
}

export default function PatientClinicalCommandCenter({ patient, slots, prontuario, onOpenJourney, onOpenMap }) {
  if (!patient) return null

  const narrative = getPatientNarrative(patient, slots, prontuario)
  const latest = narrative.latest

  return (
    <section className="patient-command">
      <div className="patient-command-hero">
        <div>
          <div className="section-kicker">Centro clinico vivo</div>
          <h2>{narrative.headline}</h2>
          <p>
            {patient.name} tem {narrative.completed.length} sessao{narrative.completed.length === 1 ? '' : 'es'} concluida{narrative.completed.length === 1 ? '' : 's'}.
            {narrative.next ? ` Proximo cuidado em ${formatDate(narrative.next.date)} as ${narrative.next.time}.` : ' Ainda sem retorno futuro marcado.'}
          </p>
        </div>
        <div className="patient-command-actions">
          <button className="btn btn-primary" onClick={onOpenJourney}>Ver jornada</button>
          <button className="btn btn-secondary" onClick={onOpenMap}>Mapa corporal</button>
        </div>
      </div>

      <div className="patient-command-grid">
        <article className="patient-snapshot-card span-2">
          <div className="snapshot-head">
            <div>
              <span>Ultima evolucao</span>
              <h3>{latest ? formatDate(latest.date) : 'Sem sessao concluida'}</h3>
            </div>
            <span className={`risk-pill risk-${narrative.risk.level.toLowerCase()}`}>Risco {narrative.risk.level}</span>
          </div>
          <p>{latest?.evolucao || latest?.relatorioParaPaciente || prontuario?.queixaPrincipal || 'Ainda nao ha evolucao clinica suficiente para uma leitura narrativa.'}</p>
          <div className="snapshot-metrics">
            <div><strong>{narrative.progress.overall}%</strong><span>Evolucao</span></div>
            <div><strong>{narrative.consistency.value}%</strong><span>Aderencia</span></div>
            <div><strong>{narrative.progress.latestPain}/10</strong><span>Dor atual</span></div>
          </div>
        </article>

        <article className="patient-snapshot-card">
          <div className="narrative-title">Tendencia</div>
          <ProgressBar value={narrative.progress.overall} label={narrative.progress.trend} detail={narrative.progress.metrics[4].detail} tone="gold" />
          <ProgressBar value={narrative.consistency.value} label={narrative.consistency.label} detail={narrative.consistency.detail} />
        </article>

        <NarrativeList title="Melhoras" items={narrative.improvements} tone="success" />
        <NarrativeList title="Observacoes recorrentes" items={narrative.recurringObservations} />
        <NarrativeList title="Pontos de atencao" items={narrative.attention} tone="warning" />
      </div>

      <div className="patient-command-progress">
        <ClinicalProgress patient={patient} slots={slots} compact />
      </div>
    </section>
  )
}
