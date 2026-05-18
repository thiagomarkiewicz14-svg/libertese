import { useState } from 'react'
import { useApp } from '../context/AppContext'
import Modal from '../components/Modal'
import { NIVEL_PLANO } from '../domain/constants'
import { EXERCISE_LIBRARY } from '../domain/clinical'

const LEVEL_COLOR = { Iniciante: '#2D7A5F', Intermediário: '#1E3A5F', Avançado: '#A83228' }

const CATEGORY_VISUAL = {
  'Mobilidade': 'linear-gradient(135deg,#3f7256,#789284)',
  'Coluna':     'linear-gradient(135deg,#2f4d40,#526f5e)',
  'Core':       'linear-gradient(135deg,#1a3d5c,#3e637b)',
  'Extensão':   'linear-gradient(135deg,#8d652c,#b6996d)',
  'Quadril':    'linear-gradient(135deg,#344e6a,#5a7899)',
}
const DEFAULT_GRADIENT = 'linear-gradient(135deg,#3f7256,#789284)'

const EMPTY_FORM = { name: '', description: '', level: 'Iniciante', sessions: 12, exercises: [] }
const EMPTY_EX = { name: '', series: '3', reps: '10', notes: '' }

export default function Planos() {
  const { plans, addPlan, updatePlan, deletePlan } = useApp()
  const [modal, setModal] = useState(null)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [newEx, setNewEx] = useState(EMPTY_EX)
  const [viewPlan, setViewPlan] = useState(null)

  function openAdd() { setForm({ ...EMPTY_FORM, exercises: [] }); setNewEx(EMPTY_EX); setSelected(null); setModal('form') }
  function openEdit(p) { setSelected(p); setForm({ name: p.name, description: p.description, level: p.level, sessions: p.sessions, exercises: [...p.exercises] }); setNewEx(EMPTY_EX); setModal('form') }
  function openView(p) { setViewPlan(p); setModal('view') }
  function close() { setModal(null); setSelected(null); setViewPlan(null) }

  function addExercise() {
    if (!newEx.name.trim()) return
    setForm(f => ({ ...f, exercises: [...f.exercises, { ...newEx, id: `e${Date.now()}` }] }))
    setNewEx(EMPTY_EX)
  }

  function removeExercise(id) { setForm(f => ({ ...f, exercises: f.exercises.filter(e => e.id !== id) })) }

  function handleSave() {
    if (!form.name.trim()) return
    const data = { ...form, sessions: Number(form.sessions) }
    if (selected) updatePlan(selected.id, data)
    else addPlan(data)
    close()
  }

  function handleDelete(plan) {
    if (window.confirm(`Excluir "${plan.name}"?`)) { deletePlan(plan.id); if (modal === 'view') close() }
  }

  return (
    <div className="page-body">
      <div className="page-toolbar">
        <div style={{ fontSize: 14, color: 'var(--text-2)' }}>{plans.length} protocolos terapêuticos</div>
        <button className="btn btn-primary" onClick={openAdd}>Criar protocolo terapêutico</button>
      </div>

      <section className="prescription-library">
        <div className="prescription-library-head">
          <div>
            <div className="section-kicker">Prescrições e exercícios</div>
            <h3>Biblioteca terapêutica premium</h3>
            <p>Alongamentos, exercícios e vídeos demonstrativos para orientar continuidade do cuidado.</p>
          </div>
          <span className="badge badge-muted">Exercícios em visualização</span>
        </div>
        <div className="exercise-library-grid">
          {EXERCISE_LIBRARY.map(item => {
            const gradient = CATEGORY_VISUAL[item.category] || DEFAULT_GRADIENT
            return (
              <article key={item.id} className="exercise-library-card">
                <div className="exercise-video-thumb" style={{
                  background: `linear-gradient(180deg,transparent 30%,rgba(0,0,0,0.38) 100%), ${gradient}`,
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                  <svg aria-hidden="true" style={{ position: 'absolute', top: -14, right: -14, width: 88, height: 88, opacity: 0.18 }} viewBox="0 0 88 88">
                    <circle cx="44" cy="44" r="36" fill="none" stroke="white" strokeWidth="2.5" />
                    <circle cx="44" cy="44" r="20" fill="none" stroke="white" strokeWidth="1.5" />
                    <circle cx="44" cy="44" r="5" fill="white" opacity="0.6" />
                  </svg>
                  <span style={{ position: 'relative', zIndex: 1 }}>{item.duration}</span>
                </div>
                <div>
                  <span className="tag-pill">{item.category}</span>
                  <h4>{item.name}</h4>
                  <p>{item.target}</p>
                  <small>{item.level}</small>
                </div>
              </article>
            )
          })}
        </div>
      </section>

      {plans.length === 0 ? (
        <div className="empty-state" style={{ marginTop: 60 }}>
          <div className="empty-icon" />
          <h3>Nenhum protocolo criado</h3>
          <p>Crie protocolos terapêuticos com exercícios para seus pacientes.</p>
        </div>
      ) : (
        <div className="plans-grid">
          {plans.map(plan => (
            <div key={plan.id} className="plan-card">
              <div className="plan-card-header">
                <div style={{ display: 'inline-block', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: LEVEL_COLOR[plan.level], marginBottom: 8, padding: '2px 8px', background: LEVEL_COLOR[plan.level] + '15', borderRadius: 20 }}>{plan.level}</div>
                <h3 style={{ fontSize: 16, marginBottom: 8 }}>{plan.name}</h3>
                {plan.description && <p style={{ fontSize: 12.5, color: 'var(--text-2)', fontFamily: 'Inter', fontWeight: 400, lineHeight: 1.6 }}>{plan.description}</p>}
                <div style={{ display: 'flex', gap: 14, marginTop: 12, fontSize: 12.5 }}>
                  <span style={{ color: 'var(--text-3)' }}>{plan.exercises.length} exercícios</span>
                  <span style={{ color: 'var(--text-3)' }}>{plan.sessions} sessões</span>
                </div>
              </div>
              <div className="plan-card-body">
                {plan.exercises.slice(0, 3).map((ex, i) => (
                  <div key={ex.id} className="exercise-item">
                    <div className="exercise-num">{i + 1}</div>
                    <div>
                      <div className="exercise-name">{ex.name}</div>
                      <div className="exercise-detail">{ex.series} séries × {ex.reps}{ex.notes ? ` · ${ex.notes}` : ''}</div>
                    </div>
                  </div>
                ))}
                {plan.exercises.length > 3 && (
                  <div style={{ padding: '8px 0', fontSize: 12, color: 'var(--text-3)', textAlign: 'center' }}>+{plan.exercises.length - 3} exercícios</div>
                )}
                <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                  <button className="btn btn-sm btn-secondary" style={{ flex: 1 }} onClick={() => openView(plan)}>Ver prescrição</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => openEdit(plan)}>Ajustar</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(plan)}>Remover</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal === 'view' && viewPlan && (
        <Modal title={viewPlan.name} onClose={close}
          footer={<><button className="btn btn-danger btn-sm" onClick={() => handleDelete(viewPlan)}>Excluir</button><button className="btn btn-secondary btn-sm" onClick={close}>Fechar</button><button className="btn btn-primary btn-sm" onClick={() => openEdit(viewPlan)}>Ajustar protocolo</button></>}>
          <div style={{ marginBottom: 16 }}>
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', padding: '3px 10px', borderRadius: 20, background: LEVEL_COLOR[viewPlan.level] + '15', color: LEVEL_COLOR[viewPlan.level] }}>{viewPlan.level}</span>
            <span style={{ fontSize: 13, color: 'var(--text-2)', marginLeft: 12 }}>{viewPlan.sessions} sessões · {viewPlan.exercises.length} exercícios</span>
          </div>
          {viewPlan.description && <p style={{ fontSize: 13.5, color: 'var(--text-2)', marginBottom: 20, lineHeight: 1.6 }}>{viewPlan.description}</p>}
          {viewPlan.exercises.map((ex, i) => (
            <div key={ex.id} className="exercise-item">
              <div className="exercise-num">{i + 1}</div>
              <div>
                <div className="exercise-name">{ex.name}</div>
                <div className="exercise-detail">{ex.series} séries × {ex.reps}{ex.notes ? ` · ${ex.notes}` : ''}</div>
              </div>
            </div>
          ))}
        </Modal>
      )}

      {modal === 'form' && (
        <Modal title={selected ? 'Ajustar Protocolo' : 'Novo Protocolo Terapêutico'} onClose={close}
          footer={<><button className="btn btn-secondary" onClick={close}>Cancelar</button><button className="btn btn-primary" onClick={handleSave}>{selected ? 'Salvar protocolo' : 'Criar protocolo'}</button></>}>
          <div className="form-group">
            <label className="form-label">Nome do protocolo *</label>
            <input className="form-control" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Protocolo Lombalgia Crônica" />
          </div>
          <div className="form-group">
            <label className="form-label">Descrição</label>
            <textarea className="form-control" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Objetivo terapêutico do protocolo..." />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Nível</label>
              <select className="form-control" value={form.level} onChange={e => setForm(f => ({ ...f, level: e.target.value }))}>
                {NIVEL_PLANO.map(l => <option key={l}>{l}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Sessões previstas</label>
              <input className="form-control" type="number" min={1} value={form.sessions} onChange={e => setForm(f => ({ ...f, sessions: e.target.value }))} />
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 4 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: 'var(--text)' }}>Exercícios ({form.exercises.length})</div>
            {form.exercises.map((ex, i) => (
              <div key={ex.id} style={{ display: 'flex', gap: 10, padding: '8px 12px', background: 'var(--surface-2)', borderRadius: 8, marginBottom: 7, alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 700, minWidth: 18 }}>{i + 1}.</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, fontSize: 13.5 }}>{ex.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{ex.series}×{ex.reps}{ex.notes ? ` · ${ex.notes}` : ''}</div>
                </div>
                <button className="btn btn-ghost btn-xs" onClick={() => removeExercise(ex.id)}>Remover</button>
              </div>
            ))}
            <div style={{ background: 'var(--surface-2)', borderRadius: 8, padding: 14, marginTop: 8 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-2)', marginBottom: 10 }}>Adicionar exercício</div>
              <div className="form-group">
                <input className="form-control" value={newEx.name} onChange={e => setNewEx(n => ({ ...n, name: e.target.value }))} placeholder="Nome do exercício" />
              </div>
              <div className="form-row">
                <div className="form-group"><input className="form-control" value={newEx.series} onChange={e => setNewEx(n => ({ ...n, series: e.target.value }))} placeholder="Séries (ex: 3)" /></div>
                <div className="form-group"><input className="form-control" value={newEx.reps} onChange={e => setNewEx(n => ({ ...n, reps: e.target.value }))} placeholder="Reps (ex: 10)" /></div>
              </div>
              <div className="form-group"><input className="form-control" value={newEx.notes} onChange={e => setNewEx(n => ({ ...n, notes: e.target.value }))} placeholder="Observações (opcional)" /></div>
              <button className="btn btn-sm btn-secondary" onClick={addExercise} style={{ width: '100%' }}>Adicionar exercício ao protocolo</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
