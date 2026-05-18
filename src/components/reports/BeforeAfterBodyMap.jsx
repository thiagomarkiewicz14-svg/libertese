import { useState } from 'react'
import { CLINICAL_AREAS } from '../../domain/clinical'

function intensityClass(v) {
  if (v >= 7) return 'body-point-high'
  if (v >= 4) return 'body-point-mid'
  if (v > 0) return 'body-point-low'
  return 'body-point-none'
}

const EMPTY_MAP = { areas: {}, mobilityNotes: '', generalScore: 5 }

function BodyPanel({ label, accent, map, onChange, readOnly }) {
  const [selected, setSelected] = useState('lombar')
  const data = map || EMPTY_MAP
  const areas = data.areas || {}
  const active = areas[selected] || { intensity: 0, note: '' }

  function updateArea(key, patch) {
    if (readOnly) return
    onChange?.({
      ...data,
      areas: { ...areas, [key]: { ...(areas[key] || { intensity: 0, note: '' }), ...patch } },
    })
  }

  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ textAlign: 'center', marginBottom: 14 }}>
        <span style={{
          fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em',
          color: accent, padding: '4px 16px', borderRadius: 999,
          background: accent + '18', border: `1.5px solid ${accent}40`,
        }}>
          {label}
        </span>
        <div style={{ marginTop: 8, fontSize: 13, color: 'var(--text-3)' }}>
          Score geral: <strong style={{ color: accent, fontSize: 15 }}>{data.generalScore ?? 5}/10</strong>
        </div>
      </div>

      <div style={{ maxWidth: 280, margin: '0 auto' }}>
      <div
        className="body-silhouette"
        aria-label={`Mapa corporal — ${label}`}
      >
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
            className={`body-point ${intensityClass(areas[area.key]?.intensity || 0)} ${!readOnly && selected === area.key ? 'active' : ''}`}
            style={{ left: `${area.x}%`, top: `${area.y}%`, cursor: readOnly ? 'default' : 'pointer' }}
            onClick={() => !readOnly && setSelected(area.key)}
            aria-label={area.label}
          >
            <span>{areas[area.key]?.intensity || 0}</span>
          </button>
        ))}
      </div>
      </div>

      {!readOnly && (
        <div style={{ marginTop: 16, padding: '14px', background: 'var(--surface-2)', borderRadius: 14 }}>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', marginBottom: 5 }}>
              {CLINICAL_AREAS.find(a => a.key === selected)?.label} — {active.intensity}/10
            </div>
            <input
              type="range" min={0} max={10} value={active.intensity}
              style={{ width: '100%', accentColor: accent }}
              onChange={e => updateArea(selected, { intensity: Number(e.target.value) })}
            />
            <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
              {[0, 3, 6, 9].map(n => (
                <button key={n} type="button" className="btn btn-xs btn-secondary"
                  onClick={() => updateArea(selected, { intensity: n })}
                  style={{ flex: 1 }}>
                  {n === 0 ? '—' : n}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', marginBottom: 5 }}>
              Score geral — {data.generalScore ?? 5}/10
            </div>
            <input
              type="range" min={0} max={10} value={data.generalScore ?? 5}
              style={{ width: '100%', accentColor: accent }}
              onChange={e => onChange?.({ ...data, generalScore: Number(e.target.value) })}
            />
          </div>

          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', marginBottom: 5 }}>
              Notas de mobilidade / tensão
            </div>
            <textarea
              className="form-control"
              rows={2}
              value={data.mobilityNotes || ''}
              onChange={e => onChange?.({ ...data, mobilityNotes: e.target.value })}
              placeholder="Tensão, amplitude, restrições observadas..."
            />
          </div>
        </div>
      )}

      {readOnly && data.mobilityNotes && (
        <div style={{ marginTop: 10, padding: '8px 10px', background: 'var(--surface-2)', borderRadius: 10, fontSize: 12, color: 'var(--text-2)', textAlign: 'center' }}>
          {data.mobilityNotes}
        </div>
      )}
    </div>
  )
}

export default function BeforeAfterBodyMap({ beforeMap, afterMap, onBeforeChange, onAfterChange, readOnly = false }) {
  const beforeScore = beforeMap?.generalScore ?? 5
  const afterScore = afterMap?.generalScore ?? 5
  const delta = beforeScore - afterScore

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 28 }}>
        <BodyPanel
          label="Estado inicial — Antes"
          accent="var(--warning)"
          map={beforeMap}
          onChange={onBeforeChange}
          readOnly={readOnly}
        />
        <BodyPanel
          label="Resposta pós-sessão — Depois"
          accent="var(--success)"
          map={afterMap}
          onChange={onAfterChange}
          readOnly={readOnly}
        />
      </div>

      {(beforeMap || afterMap) && (
        <div style={{
          marginTop: 18, padding: '12px 18px',
          background: delta > 0 ? 'var(--success-light, #e8f5ee)' : delta < 0 ? 'var(--warning-light)' : 'var(--surface-2)',
          borderRadius: 12,
          borderLeft: `3px solid ${delta > 0 ? 'var(--success)' : delta < 0 ? 'var(--warning)' : 'var(--border)'}`,
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <span style={{ fontSize: 20 }}>{delta > 0 ? '✓' : delta < 0 ? '↑' : '='}</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: delta > 0 ? 'var(--success)' : delta < 0 ? 'var(--warning)' : 'var(--text-2)' }}>
              {delta > 0
                ? `Melhora de ${delta} pont${delta === 1 ? 'o' : 'os'} no score geral`
                : delta < 0
                ? `Score aumentou ${Math.abs(delta)} pont${Math.abs(delta) === 1 ? 'o' : 'os'} — avaliar resposta`
                : 'Score mantido — sessão de manutenção'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
              Antes {beforeScore}/10 → Depois {afterScore}/10
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
