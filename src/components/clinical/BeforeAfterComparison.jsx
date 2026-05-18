import { useState } from 'react'
import { calculateClinicalProgress, formatDate, getCompletedSessions } from '../../domain/clinical'

export default function BeforeAfterComparison({ patient, slots }) {
  const [position, setPosition] = useState(58)
  if (!patient) return null

  const completed = getCompletedSessions(slots, patient.id)
  const first = completed[0]
  const latest = completed[completed.length - 1]
  const progress = calculateClinicalProgress(patient, slots)

  return (
    <section className="before-after-card">
      <div className="body-map-head">
        <div>
          <div className="section-kicker">Antes / Depois</div>
          <h3>Comparativo de postura e evolucao</h3>
        </div>
        <span className="badge badge-muted">Comparativo visual</span>
      </div>

      <div className="comparison-stage">
        <div className="comparison-photo comparison-before">
          <span>Antes</span>
          <strong>{first ? formatDate(first.date, { day: 'numeric', month: 'short' }) : 'Inicio'}</strong>
        </div>
        <div className="comparison-photo comparison-after" style={{ clipPath: `inset(0 0 0 ${position}%)` }}>
          <span>Depois</span>
          <strong>{latest ? formatDate(latest.date, { day: 'numeric', month: 'short' }) : 'Atual'}</strong>
        </div>
        <div className="comparison-divider" style={{ left: `${position}%` }} />
        <input
          className="comparison-slider"
          type="range"
          min="8"
          max="92"
          value={position}
          onChange={e => setPosition(Number(e.target.value))}
          aria-label="Comparar antes e depois"
        />
      </div>

      <div className="comparison-copy">
        <strong>{progress.trend}</strong>
        <p>
          Reducao estimada de {Math.max(0, progress.painImprovement)} ponto{progress.painImprovement === 1 ? '' : 's'} de dor,
          com {completed.length} sessao{completed.length === 1 ? '' : 'es'} registrada{completed.length === 1 ? '' : 's'}.
        </p>
      </div>
    </section>
  )
}
