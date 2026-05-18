import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { PROFISSIONAIS } from '../domain/constants'
import Modal from '../components/Modal'
import ClinicalTimeline from '../components/clinical/ClinicalTimeline'
import ClinicalProgress from '../components/clinical/ClinicalProgress'
import BodyMap from '../components/clinical/BodyMap'
import BeforeAfterComparison from '../components/clinical/BeforeAfterComparison'
import PatientPortal from '../components/patient/PatientPortal'
import PatientClinicalCommandCenter from '../components/clinical/PatientClinicalCommandCenter'

function Section({ title, children }) {
  return (
    <div className="prontuario-section">
      <div className="prontuario-section-title">{title}</div>
      {children}
    </div>
  )
}

function PainScale({ value, onChange, label }) {
  return (
    <div>
      <div className="form-label">{label} {value !== null ? `— ${value}/10` : ''}</div>
      <div className="pain-scale">
        {[0,1,2,3,4,5,6,7,8,9,10].map(n => (
          <button key={n} type="button"
            className={`pain-btn ${value === n ? `active-${n}` : ''}`}
            onClick={() => onChange(n)}>
            {n}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function Prontuario() {
  const { patientId: paramId } = useParams()
  const { patients, getProntuario, updateProntuario, addEvolucao, agendaSlots, servicos, plans, getBodyMap, saveBodyMap, saveSessionNotes } = useApp()
  const navigate = useNavigate()

  const [selectedId, setSelectedId] = useState(paramId || '')
  const [prontuario, setProntuario] = useState(null)
  const [form, setForm] = useState({})
  const [evolucaoText, setEvolucaoText] = useState('')
  const [evolucaoProfissional, setEvolucaoProfissional] = useState(PROFISSIONAIS[0])
  const [tab, setTab] = useState('visao')
  const [dirty, setDirty] = useState(false)
  const [bodyMapDraft, setBodyMapDraft] = useState(null)
  const [sessionModal, setSessionModal] = useState(null)
  const [sessionNotes, setSessionNotes] = useState({})
  const [sessionEditing, setSessionEditing] = useState(false)

  const patient = patients.find(p => p.id === selectedId)

  useEffect(() => {
    if (!selectedId) return
    const data = getProntuario(selectedId)
    setProntuario(data)
    setForm({ anamnese: data.anamnese || '', queixaPrincipal: data.queixaPrincipal || '', historico: data.historico || '', restricoes: data.restricoes || '', objetivos: data.objetivos || '' })
    setBodyMapDraft(getBodyMap(selectedId))
    setDirty(false)
  }, [selectedId, getProntuario, getBodyMap])

  useEffect(() => {
    if (paramId) setSelectedId(paramId)
  }, [paramId])

  function handleSave() {
    updateProntuario(selectedId, form)
    setDirty(false)
  }

  function handleAddEvolucao() {
    if (!evolucaoText.trim()) return
    addEvolucao(selectedId, evolucaoText, evolucaoProfissional)
    setEvolucaoText('')
    const updated = getProntuario(selectedId)
    setProntuario(updated)
  }

  function handleSaveBodyMap() {
    if (!bodyMapDraft) return
    saveBodyMap(selectedId, bodyMapDraft)
  }

  const sessoes = agendaSlots
    .filter(s => s.patientId === selectedId && s.status === 'Realizado')
    .sort((a, b) => b.date.localeCompare(a.date))

  const initials = patient ? patient.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : ''

  if (!selectedId || !patient) {
    return (
      <div className="page-body">
        <div className="card" style={{ maxWidth: 560, margin: '0 auto' }}>
          <div className="card-header"><h3 className="card-title">Abrir jornada clínica</h3></div>
          <div className="card-body">
            <div className="form-group">
              <label className="form-label">Paciente</label>
              <select className="form-control" value={selectedId} onChange={e => { setSelectedId(e.target.value); navigate(`/prontuario/${e.target.value}`) }}>
                <option value="">Selecione um paciente...</option>
                {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="empty-state">
              <div className="empty-icon" />
              <h3>Selecione uma jornada</h3>
              <p>Escolha um paciente para visualizar evolução, timeline, mapa corporal e relatórios.</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-body">
      {/* Patient header */}
      <div className="card clinical-record-header" style={{ marginBottom: 20 }}>
        <div className="card-body" style={{ padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div className="avatar avatar-lg">{initials}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 17 }}>{patient.name}</div>
            <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 2 }}>
              {patient.phone} · {patient.email}
              {patient.birthDate && ` · ${new Date(patient.birthDate + 'T12:00').toLocaleDateString('pt-BR')}`}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-sm btn-secondary" onClick={() => navigate('/pacientes')}>Carteira clínica</button>
            <select className="form-control" style={{ width: 220 }} value={selectedId} onChange={e => navigate(`/prontuario/${e.target.value}`)}>
              {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="prontuario-grid" style={{ gap: 20 }}>
        {/* Main prontuário */}
        <div>
          <div className="tabs" style={{ marginBottom: 20 }}>
            {['visao', 'jornada', 'evolucao', 'mapa', 'anamnese', 'portal', 'sessoes'].map(t => (
              <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
                {t === 'visao' ? 'Visão clínica' : t === 'anamnese' ? 'Dados clínicos' : t === 'jornada' ? 'Jornada' : t === 'evolucao' ? 'Evolução visual' : t === 'mapa' ? 'Mapa corporal' : t === 'portal' ? 'Área do paciente' : 'Sessões'}
              </button>
            ))}
          </div>

          {tab === 'visao' && (
            <PatientClinicalCommandCenter
              patient={patient}
              slots={agendaSlots}
              prontuario={prontuario}
              onOpenJourney={() => setTab('jornada')}
              onOpenMap={() => setTab('mapa')}
            />
          )}

          {tab === 'anamnese' && (
            <div className="card">
              <div className="card-body">
                <Section title="Queixa Principal">
                  <div className="form-group">
                    <textarea className="form-control" rows={3} value={form.queixaPrincipal}
                      onChange={e => { setForm(f => ({ ...f, queixaPrincipal: e.target.value })); setDirty(true) }}
                      placeholder="Descreva a queixa principal do paciente..." />
                  </div>
                </Section>

                <Section title="Anamnese / História Clínica">
                  <div className="form-group">
                    <textarea className="form-control" rows={4} value={form.anamnese}
                      onChange={e => { setForm(f => ({ ...f, anamnese: e.target.value })); setDirty(true) }}
                      placeholder="Histórico de saúde, comorbidades, medicamentos, alergias..." />
                  </div>
                </Section>

                <Section title="Histórico de Tratamentos">
                  <div className="form-group">
                    <textarea className="form-control" rows={3} value={form.historico}
                      onChange={e => { setForm(f => ({ ...f, historico: e.target.value })); setDirty(true) }}
                      placeholder="Tratamentos anteriores, cirurgias, internações..." />
                  </div>
                </Section>

                <Section title="Restrições e Contraindicações">
                  <div className="form-group">
                    <textarea className="form-control" rows={2} value={form.restricoes}
                      onChange={e => { setForm(f => ({ ...f, restricoes: e.target.value })); setDirty(true) }}
                      placeholder="Movimentos proibidos, alergias, limitações físicas..." />
                  </div>
                </Section>

                <Section title="Objetivos Terapêuticos">
                  <div className="form-group">
                    <textarea className="form-control" rows={2} value={form.objetivos}
                      onChange={e => { setForm(f => ({ ...f, objetivos: e.target.value })); setDirty(true) }}
                      placeholder="O que o paciente deseja alcançar com o tratamento..." />
                  </div>
                </Section>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  {dirty && <span style={{ fontSize: 12, color: 'var(--warning)', alignSelf: 'center' }}>Alterações não salvas</span>}
                  <button className="btn btn-primary" onClick={handleSave}>Salvar evolução clínica</button>
                </div>
              </div>
            </div>
          )}

          {tab === 'jornada' && (
            <ClinicalTimeline patient={patient} slots={agendaSlots} prontuario={prontuario} servicos={servicos} />
          )}

          {tab === 'evolucao' && (
            <div>
              <div className="card" style={{ marginBottom: 16 }}>
                <div className="card-body">
                  <ClinicalProgress patient={patient} slots={agendaSlots} />
                </div>
              </div>

              <div className="card" style={{ marginBottom: 16 }}>
                <div className="card-header"><h3 className="card-title">Registrar evolução clínica</h3></div>
                <div className="card-body">
                  <div className="form-group">
                    <label className="form-label">Profissional</label>
                    <select className="form-control" value={evolucaoProfissional} onChange={e => setEvolucaoProfissional(e.target.value)}>
                      {PROFISSIONAIS.map(p => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Registro de evolução</label>
                    <textarea className="form-control" rows={4} value={evolucaoText}
                      onChange={e => setEvolucaoText(e.target.value)}
                      placeholder="Descreva a evolução do paciente nesta sessão..." />
                  </div>
                  <button className="btn btn-primary" onClick={handleAddEvolucao} disabled={!evolucaoText.trim()}>
                    Registrar evolução
                  </button>
                </div>
              </div>

              <div>
                {(prontuario?.evolucoes || []).length === 0 ? (
                  <div className="empty-state"><div className="empty-icon" /><h3>Sem evoluções registradas</h3><p>Registre a primeira leitura clínica para iniciar a narrativa do paciente.</p></div>
                ) : (
                  <div className="timeline">
                    {(prontuario.evolucoes || []).map(ev => (
                      <div key={ev.id} className="timeline-item">
                        <div className="timeline-dot" />
                        <div className="evolucao-item">
                          <div className="evolucao-header">
                            <span style={{ fontWeight: 600, fontSize: 13 }}>{ev.professional}</span>
                            <span className="evolucao-date">{new Date(ev.date + 'T12:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                          </div>
                          <div className="evolucao-text">{ev.text}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === 'mapa' && (
            <div className="clinical-map-stack">
              <BodyMap patient={patient} value={bodyMapDraft} onChange={setBodyMapDraft} />
              <BeforeAfterComparison patient={patient} slots={agendaSlots} />
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn btn-primary" onClick={handleSaveBodyMap}>Salvar mapa corporal</button>
              </div>
            </div>
          )}

          {tab === 'portal' && (
            <PatientPortal patient={patient} slots={agendaSlots} plans={plans} />
          )}

          {tab === 'sessoes' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 18 }}>
                <div>
                  <div className="section-kicker">Evoluções do paciente</div>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 500, marginTop: 4 }}>
                    {sessoes.length} {sessoes.length !== 1 ? 'sessões' : 'sessão'} realizada{sessoes.length !== 1 ? 's' : ''}
                  </h3>
                </div>
                <button className="btn btn-sm btn-secondary" onClick={() => navigate('/sessoes')}>
                  Ver histórico completo
                </button>
              </div>
              {sessoes.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon" />
                  <h3>Sem sessões realizadas</h3>
                  <p>Quando uma sessão for marcada como realizada, ela aparecerá aqui.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: 10 }}>
                  {sessoes.slice(0, 8).map(s => {
                    const srv = servicos.find(sv => sv.id === s.serviceId)
                    const dorDiff = s.dorAntes !== null && s.dorDepois !== null ? s.dorAntes - s.dorDepois : null
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => { setSessionModal(s); setSessionNotes({ notasInternas: s.notasInternas || '', relatorioParaPaciente: s.relatorioParaPaciente || '', dorAntes: s.dorAntes ?? null, dorDepois: s.dorDepois ?? null, evolucao: s.evolucao || '', exercicios: s.exercicios || '', recomendacoes: s.recomendacoes || '', retorno: s.retorno || '' }); setSessionEditing(false) }}
                        style={{ display: 'flex', gap: 14, alignItems: 'flex-start', padding: '14px 16px', border: '1px solid var(--border-light)', borderRadius: 16, background: 'rgba(255,253,249,0.72)', cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'background 0.15s, box-shadow 0.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(232,238,230,0.48)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(47,77,64,0.08)' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,253,249,0.72)'; e.currentTarget.style.boxShadow = 'none' }}
                      >
                        <div style={{ minWidth: 52, fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 500, lineHeight: 1.2, color: 'var(--olive-700)' }}>
                          <div>{new Date(s.date + 'T12:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}</div>
                          <div style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--muted)', fontWeight: 600, marginTop: 2 }}>{s.time}</div>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 4 }}>
                            {srv && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 12, background: srv.color + '18', color: srv.color, fontWeight: 600 }}>{srv.name}</span>}
                            {dorDiff !== null && (
                              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 12, background: dorDiff > 0 ? 'var(--success-light)' : 'var(--surface-2)', color: dorDiff > 0 ? 'var(--success)' : 'var(--text-3)', fontWeight: 600 }}>
                                Dor: {s.dorAntes} → {s.dorDepois}{dorDiff > 0 ? ` ↓${dorDiff}` : ''}
                              </span>
                            )}
                          </div>
                          {s.evolucao
                            ? <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.55, margin: 0 }}>{s.evolucao.slice(0, 140)}{s.evolucao.length > 140 ? '…' : ''}</p>
                            : <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0, fontStyle: 'italic' }}>Sem evolução registrada — clique para adicionar</p>
                          }
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                          <div style={{ color: 'var(--muted)', fontSize: 12 }}>›</div>
                          <button
                            type="button"
                            className={`btn btn-xs ${s.postSessionReport ? 'btn-secondary' : 'btn-ghost'}`}
                            style={{ fontSize: 10, padding: '2px 8px', whiteSpace: 'nowrap' }}
                            onClick={e => { e.stopPropagation(); navigate(`/relatorio-pos-sessao?sessionId=${s.id}`) }}>
                            {s.postSessionReport ? 'Ver relatório ✓' : 'Pós-sessão'}
                          </button>
                        </div>
                      </button>
                    )
                  })}
                  {sessoes.length > 8 && (
                    <div style={{ textAlign: 'center', paddingTop: 6 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => navigate('/sessoes')}>
                        Ver todas as {sessoes.length} evoluções →
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar info */}
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-header"><h3 className="card-title" style={{ fontSize: 13 }}>Resumo do Paciente</h3></div>
            <div className="card-body" style={{ padding: 16 }}>
              <div className="info-grid">
                <div className="info-item"><div className="info-label">Status</div><div className="info-value" style={{ fontSize: 13 }}>{patient.status}</div></div>
                <div className="info-item"><div className="info-label">Gênero</div><div className="info-value" style={{ fontSize: 13 }}>{patient.gender === 'F' ? 'Feminino' : patient.gender === 'M' ? 'Masculino' : 'Outro'}</div></div>
                <div className="info-item"><div className="info-label">Ingresso</div><div className="info-value" style={{ fontSize: 13 }}>{new Date(patient.joinDate + 'T12:00').toLocaleDateString('pt-BR')}</div></div>
                <div className="info-item"><div className="info-label">Sessões</div><div className="info-value" style={{ fontSize: 13 }}>{sessoes.length} realizada{sessoes.length !== 1 ? 's' : ''}</div></div>
              </div>
              {patient.notes && (
                <div style={{ marginTop: 14, padding: '10px 12px', background: 'var(--warning-light)', borderRadius: 8, fontSize: 13, color: 'var(--text-2)', borderLeft: '3px solid var(--warning)' }}>
                  {patient.notes}
                </div>
              )}
            </div>
          </div>

          {sessoes.length > 0 && (
            <div className="card">
              <div className="card-header"><h3 className="card-title" style={{ fontSize: 13 }}>Última Sessão</h3></div>
              <div className="card-body" style={{ padding: 16 }}>
                <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 8 }}>
                  {new Date(sessoes[0].date + 'T12:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                </div>
                {sessoes[0].evolucao && <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6, marginBottom: 10 }}>{sessoes[0].evolucao}</p>}
                {sessoes[0].recomendacoes && (
                  <div style={{ padding: '8px 12px', background: 'var(--primary-bg)', borderRadius: 8, fontSize: 12.5, color: 'var(--text-2)' }}>
                    <strong style={{ display: 'block', marginBottom: 4, color: 'var(--primary)' }}>Recomendações:</strong>
                    {sessoes[0].recomendacoes}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Modal inline de evolução da sessão ─────────────────────────── */}
      {sessionModal && (() => {
        const srv = servicos.find(sv => sv.id === sessionModal.serviceId)
        const dorDiff = sessionModal.dorAntes !== null && sessionModal.dorDepois !== null ? sessionModal.dorAntes - sessionModal.dorDepois : null
        return (
          <Modal
            title={`Sessão de ${new Date(sessionModal.date + 'T12:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })} · ${sessionModal.time}`}
            onClose={() => { setSessionModal(null); setSessionEditing(false) }}
            footer={
              sessionEditing ? (
                <>
                  <button className="btn btn-secondary" onClick={() => setSessionEditing(false)}>Cancelar</button>
                  <button className="btn btn-primary" onClick={() => { saveSessionNotes(sessionModal.id, sessionNotes); setSessionModal(null); setSessionEditing(false) }}>Salvar evolução</button>
                </>
              ) : (
                <>
                  <button className="btn btn-secondary" onClick={() => { setSessionModal(null); setSessionEditing(false) }}>Fechar</button>
                  <button className="btn btn-primary" onClick={() => setSessionEditing(true)}>Registrar evolução</button>
                </>
              )
            }
          >
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
              {srv && <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 12, background: srv.color + '18', color: srv.color, fontWeight: 600 }}>{srv.name}</span>}
              <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 12, background: 'var(--surface-3)', color: 'var(--ink-soft)', fontWeight: 600 }}>{sessionModal.professional}</span>
              {dorDiff !== null && (
                <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 12, background: dorDiff > 0 ? 'var(--success-light)' : 'var(--surface-2)', color: dorDiff > 0 ? 'var(--success)' : 'var(--text-3)', fontWeight: 600 }}>
                  Dor: {sessionModal.dorAntes} → {sessionModal.dorDepois}{dorDiff > 0 ? ` ↓${dorDiff}` : ''}
                </span>
              )}
            </div>

            {!sessionEditing ? (
              <div style={{ display: 'grid', gap: 12 }}>
                {sessionModal.evolucao ? (
                  <div style={{ padding: '12px 14px', background: 'rgba(232,238,230,0.48)', borderRadius: 12 }}>
                    <div style={{ fontSize: 10.5, fontWeight: 750, color: 'var(--olive-500)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Evolução clínica</div>
                    <p style={{ fontSize: 13.5, color: 'var(--graphite)', lineHeight: 1.65, margin: 0 }}>{sessionModal.evolucao}</p>
                  </div>
                ) : (
                  <div style={{ padding: '14px', background: 'var(--surface-2)', borderRadius: 12, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
                    Nenhuma evolução registrada. Clique em "Registrar evolução" para documentar esta sessão.
                  </div>
                )}
                {sessionModal.recomendacoes && (
                  <div style={{ padding: '12px 14px', background: 'rgba(244,234,220,0.42)', borderRadius: 12 }}>
                    <div style={{ fontSize: 10.5, fontWeight: 750, color: 'var(--champagne)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Recomendações</div>
                    <p style={{ fontSize: 13.5, color: 'var(--ink-soft)', lineHeight: 1.65, margin: 0 }}>{sessionModal.recomendacoes}</p>
                  </div>
                )}
                {sessionModal.exercicios && (
                  <div style={{ padding: '12px 14px', background: 'rgba(232,238,230,0.48)', borderRadius: 12 }}>
                    <div style={{ fontSize: 10.5, fontWeight: 750, color: 'var(--olive-500)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Exercícios para casa</div>
                    <p style={{ fontSize: 13.5, color: 'var(--ink-soft)', lineHeight: 1.65, margin: 0 }}>{sessionModal.exercicios}</p>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 14 }}>
                <div className="form-row">
                  <div>
                    <PainScale label="Dor antes" value={sessionNotes.dorAntes} onChange={v => setSessionNotes(n => ({ ...n, dorAntes: v }))} />
                  </div>
                  <div>
                    <PainScale label="Dor depois" value={sessionNotes.dorDepois} onChange={v => setSessionNotes(n => ({ ...n, dorDepois: v }))} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Evolução clínica</label>
                  <textarea className="form-control" rows={3} value={sessionNotes.evolucao} onChange={e => setSessionNotes(n => ({ ...n, evolucao: e.target.value }))} placeholder="Descreva a evolução do paciente nesta sessão..." />
                </div>
                <div className="form-group">
                  <label className="form-label">Exercícios para casa</label>
                  <textarea className="form-control" rows={2} value={sessionNotes.exercicios} onChange={e => setSessionNotes(n => ({ ...n, exercicios: e.target.value }))} placeholder="Ex: Cat-Cow 3x10, Respiração diafragmática 5min..." />
                </div>
                <div className="form-group">
                  <label className="form-label">Recomendações (enviadas ao paciente)</label>
                  <textarea className="form-control" rows={2} value={sessionNotes.recomendacoes} onChange={e => setSessionNotes(n => ({ ...n, recomendacoes: e.target.value }))} placeholder="Cuidados, restrições, orientações pós-sessão..." />
                </div>
                <div className="form-group">
                  <label className="form-label">Notas internas</label>
                  <textarea className="form-control" rows={2} value={sessionNotes.notasInternas} onChange={e => setSessionNotes(n => ({ ...n, notasInternas: e.target.value }))} placeholder="Observações técnicas para uso interno..." />
                </div>
              </div>
            )}
          </Modal>
        )
      })()}
    </div>
  )
}
