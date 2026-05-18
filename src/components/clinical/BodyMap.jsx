import { useMemo, useState } from 'react'
import { CLINICAL_AREAS, getDefaultBodyMap } from '../../domain/clinical'

function intensityClass(value) {
  if (value >= 7) return 'body-point-high'
  if (value >= 4) return 'body-point-mid'
  if (value > 0) return 'body-point-low'
  return 'body-point-none'
}

export default function BodyMap({ patient, value, onChange }) {
  const defaults = useMemo(() => getDefaultBodyMap(patient), [patient])
  const map = value || defaults
  const [selected, setSelected] = useState('lombar')
  const active = map[selected] || { intensity: 0, note: '' }

  function updateArea(area, patch) {
    onChange?.({
      ...map,
      [area]: { ...(map[area] || { intensity: 0, note: '' }), ...patch },
    })
  }

  function quickMark(intensity) {
    updateArea(selected, { intensity })
  }

  return (
    <section className="body-map-card">
      <div className="body-map-head">
        <div>
          <div className="section-kicker">Mapa corporal</div>
          <h3>Marcações rápidas</h3>
        </div>
        <span className="badge badge-muted">Avaliação local</span>
      </div>

      <div className="body-map-layout">
        <div className="body-silhouette" aria-label="Mapa corporal simplificado">
          <div className="body-line body-line-head" />
          <div className="body-line body-line-torso" />
          <div className="body-line body-line-hips" />
          <div className="body-line body-line-leg-left" />
          <div className="body-line body-line-leg-right" />
          <div className="body-line body-line-arm-left" />
          <div className="body-line body-line-arm-right" />
          {CLINICAL_AREAS.map(area => (
            <button
              key={area.key}
              type="button"
              className={`body-point ${intensityClass(map[area.key]?.intensity || 0)} ${selected === area.key ? 'active' : ''}`}
              style={{ left: `${area.x}%`, top: `${area.y}%` }}
              onClick={() => setSelected(area.key)}
              aria-label={area.label}
            >
              <span>{map[area.key]?.intensity || 0}</span>
            </button>
          ))}
        </div>

        <div className="body-map-editor">
          <div className="body-map-selected">{CLINICAL_AREAS.find(a => a.key === selected)?.label}</div>
          <label className="form-label">Intensidade: {active.intensity}/10</label>
          <input
            className="body-map-range"
            type="range"
            min="0"
            max="10"
            value={active.intensity}
            onChange={e => updateArea(selected, { intensity: Number(e.target.value) })}
          />
          <div className="body-map-quick">
            {[0, 3, 6, 9].map(n => (
              <button key={n} type="button" className="btn btn-xs btn-secondary" onClick={() => quickMark(n)}>
                {n === 0 ? 'Limpar' : `${n}/10`}
              </button>
            ))}
          </div>
          <label className="form-label">Observacoes</label>
          <textarea
            className="form-control"
            rows={3}
            value={active.note || ''}
            onChange={e => updateArea(selected, { note: e.target.value })}
            placeholder="Ex: dor ao flexionar, tensao recorrente, irradiacao..."
          />
        </div>
      </div>
    </section>
  )
}
