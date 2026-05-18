export default function ProgressBar({ value = 0, label, detail, tone = 'olive' }) {
  const safeValue = Math.max(0, Math.min(100, Number(value) || 0))

  return (
    <div className={`progress-line progress-${tone}`}>
      <div className="progress-line-head">
        <span>{label}</span>
        <strong>{Math.round(safeValue)}%</strong>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${safeValue}%` }} />
      </div>
      {detail && <div className="progress-detail">{detail}</div>}
    </div>
  )
}
