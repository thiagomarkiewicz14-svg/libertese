import ProgressBar from '../ui/ProgressBar'
import { calculateClinicalProgress } from '../../domain/clinical'

export default function ClinicalProgress({ patient, slots, compact = false }) {
  if (!patient) return null

  const progress = calculateClinicalProgress(patient, slots)

  return (
    <section className={`clinical-progress ${compact ? 'clinical-progress-compact' : ''}`}>
      <div className="clinical-progress-summary">
        <div>
          <div className="section-kicker">Evolução clínica visual</div>
          <h3>{progress.overall}% de evolução geral</h3>
          <p>{progress.trend}. Dor inicial {progress.firstPain}/10, dor atual {progress.latestPain}/10.</p>
        </div>
        <div className="clinical-score-ring" style={{ '--score': progress.overall }}>
          <span>{progress.overall}</span>
          <small>/100</small>
        </div>
      </div>

      <div className="clinical-progress-grid">
        {progress.metrics.map(metric => (
          <ProgressBar
            key={metric.key}
            value={metric.value}
            label={metric.label}
            detail={metric.detail}
            tone={metric.key === 'overall' ? 'gold' : 'olive'}
          />
        ))}
      </div>
    </section>
  )
}
