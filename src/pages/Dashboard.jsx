import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { ai } from '../services/ai'
import ClinicalIntelligence from '../components/dashboard/ClinicalIntelligence'
import ClinicalRelationshipInsights from '../components/dashboard/ClinicalRelationshipInsights'
import { calculateClinicalProgress, getPatientRisk } from '../domain/clinical'

const STATUS_COLOR = { Agendado: '#8FA090', Confirmado: '#1A4A7A', Realizado: '#2A6E47', Falta: '#A83228', Cancelado: '#8FA090' }
const STATUS_BG = { Agendado: 'rgba(143,160,144,0.10)', Confirmado: 'rgba(26,74,122,0.08)', Realizado: 'rgba(42,110,71,0.08)', Falta: 'rgba(168,50,40,0.08)', Cancelado: 'rgba(143,160,144,0.08)' }

function currency(v) { return `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` }

function Sparkline({ values, color = 'var(--success)' }) {
  if (!values || values.length < 2) return null
  const max = Math.max(...values, 1)
  const w = 108, h = 34
  const pts = values.map((v, i) => {
    const x = Math.round((i / (values.length - 1)) * w)
    const y = Math.round(h - (v / max) * (h - 6) - 3)
    return `${x},${y}`
  }).join(' ')
  const lastX = Math.round(((values.length - 1) / (values.length - 1)) * w)
  const lastY = Math.round(h - (values[values.length - 1] / max) * (h - 6) - 3)
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: 'visible', display: 'block' }} aria-hidden="true">
      <polyline fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={pts} />
      <circle cx={lastX} cy={lastY} r="3.5" fill={color} />
    </svg>
  )
}

function daysSince(dateStr) {
  if (!dateStr) return null
  return Math.floor((new Date() - new Date(dateStr + 'T12:00')) / 86400000)
}

function serviceInitials(name = '') {
  return name.split(' ').filter(Boolean).map(p => p[0]).join('').slice(0, 2).toUpperCase()
}

// ── Risk label ────────────────────────────────────────────────────────────────
function RiskPill({ risk }) {
  if (!risk || risk.value < 45) return null
  const color = risk.value >= 70 ? 'var(--danger)' : 'var(--warning)'
  const bg = risk.value >= 70 ? 'var(--danger-light)' : 'var(--warning-light)'
  return (
    <span style={{ fontSize: 10.5, fontWeight: 700, padding: '2px 7px', borderRadius: 999, background: bg, color, letterSpacing: '0.03em' }}>
      {risk.level}
    </span>
  )
}

export default function Dashboard() {
  const { patients, agendaSlots, financeiro, servicos, professionals, rooms, getProfessionalById, getPatientById, getServicoById } = useApp()
  const navigate = useNavigate()
  const [aiSummary, setAiSummary] = useState(null)

  // ── Data ──────────────────────────────────────────────────────────────────
  const TODAY = new Date().toISOString().slice(0, 10)
  const THIS_MONTH = new Date().toISOString().slice(0, 7)

  const todaySlots = agendaSlots.filter(s => s.date === TODAY).sort((a, b) => a.time.localeCompare(b.time))
  const pendingSlots = todaySlots.filter(s => ['Agendado', 'Confirmado'].includes(s.status))
  const doneSlots = todaySlots.filter(s => s.status === 'Realizado')

  const monthRevenue = financeiro.filter(f => f.date.startsWith(THIS_MONTH) && f.type === 'Entrada' && f.status === 'Pago').reduce((s, f) => s + Number(f.value), 0)
  const monthExpenses = financeiro.filter(f => f.date.startsWith(THIS_MONTH) && f.type === 'Saída' && f.status === 'Pago').reduce((s, f) => s + Number(f.value), 0)
  const monthPending = financeiro.filter(f => f.date.startsWith(THIS_MONTH) && f.status === 'Pendente').reduce((s, f) => s + Number(f.value), 0)

  const sparkMonths = Array.from({ length: 6 }, (_, i) => {
    const d = new Date()
    d.setDate(1)
    d.setMonth(d.getMonth() - (5 - i))
    return d.toISOString().slice(0, 7)
  })
  const sparkValues = sparkMonths.map(m =>
    financeiro.filter(f => f.date.startsWith(m) && f.type === 'Entrada' && f.status === 'Pago').reduce((s, f) => s + Number(f.value), 0)
  )

  const activePatients = patients.filter(p => p.status === 'Ativo' || p.status === 'Em Tratamento').length
  const awaitingReturn = patients.filter(p => p.status === 'Aguardando Retorno')
  const inactivePatients = patients.filter(p => {
    const last = agendaSlots.filter(s => s.patientId === p.id && s.status === 'Realizado').sort((a, b) => b.date.localeCompare(a.date))[0]
    const d = last ? daysSince(last.date) : null
    return d !== null && d > 30
  })

  const upcomingSlots = agendaSlots
    .filter(s => s.date > TODAY && ['Agendado', 'Confirmado'].includes(s.status))
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
    .slice(0, 5)

  useEffect(() => {
    ai.generateDailySummary({ patients, slots: agendaSlots, financeiro }).then(setAiSummary)
  }, [])

  const nextSlot = pendingSlots[0]
  const operationalLabel = todaySlots.length >= 5 ? 'Agenda em alta' : todaySlots.length > 0 ? 'Operação tranquila' : 'Dia livre'
  const balance = monthRevenue - monthExpenses
  const occupancy = Math.min(100, Math.round((todaySlots.length / 8) * 100))
  const evolutionAverage = patients.length
    ? Math.round(patients.reduce((sum, patient) => sum + calculateClinicalProgress(patient, agendaSlots).overall, 0) / patients.length)
    : 0
  const attendanceBase = agendaSlots.filter(s => s.date.startsWith(THIS_MONTH) && ['Realizado', 'Falta'].includes(s.status))
  const attendanceRate = attendanceBase.length
    ? Math.round((attendanceBase.filter(s => s.status === 'Realizado').length / attendanceBase.length) * 100)
    : 100

  const criticalPatients = patients
    .map(patient => ({ patient, risk: getPatientRisk(patient, agendaSlots) }))
    .filter(item => item.risk.value >= 45)
    .sort((a, b) => b.risk.value - a.risk.value)

  const dayPriorities = [
    nextSlot && { label: 'Próximo cuidado', title: getPatientById(nextSlot.patientId)?.name || 'Paciente', detail: `${nextSlot.time} · ${getServicoById(nextSlot.serviceId)?.name || 'Serviço'}`, route: '/agenda' },
    criticalPatients[0] && { label: 'Paciente em atenção', title: criticalPatients[0].patient.name, detail: criticalPatients[0].risk.reason, route: `/prontuario/${criticalPatients[0].patient.id}` },
    awaitingReturn[0] && { label: 'Retorno pendente', title: awaitingReturn[0].name, detail: 'Reativar continuidade do tratamento', route: '/crm' },
  ].filter(Boolean)

  const ACTIVE_SET = new Set(['Agendado', 'Confirmado', 'Realizado'])
  const conflictsToday = useMemo(() => {
    const active = agendaSlots.filter(s => ACTIVE_SET.has(s.status))
    const roomGroups = {}, profGroups = {}
    active.forEach(s => {
      if (s.roomId) { const k = `${s.date}|${s.time}|r${s.roomId}`; (roomGroups[k] = roomGroups[k] || []).push(s.id) }
      if (s.professionalId) { const k = `${s.date}|${s.time}|p${s.professionalId}`; (profGroups[k] = profGroups[k] || []).push(s.id) }
    })
    const conflictIds = new Set()
    Object.values(roomGroups).filter(ids => ids.length > 1).forEach(ids => ids.forEach(id => conflictIds.add(id)))
    Object.values(profGroups).filter(ids => ids.length > 1).forEach(ids => ids.forEach(id => conflictIds.add(id)))
    return [...conflictIds].filter(id => agendaSlots.find(s => s.id === id && s.date === TODAY)).length
  }, [agendaSlots, TODAY])

  const todayProfIds = [...new Set(todaySlots.filter(s => s.professionalId).map(s => s.professionalId))]
  const todayRoomIds = [...new Set(todaySlots.filter(s => s.roomId).map(s => s.roomId))]
  const todayProfs = todayProfIds.map(id => getProfessionalById(id)).filter(Boolean)

  const todayDateStr = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })

  // ── View ──────────────────────────────────────────────────────────────────
  return (
    <div className="page-body dashboard-v2">

      {/* ── 1. COMMAND BAR ─────────────────────────────────────────────────── */}
      <div className="command-bar">
        <div className="command-bar-left">
          <h2 className="command-date">{todayDateStr}</h2>
          <span className="command-context-tag">{operationalLabel}</span>
        </div>
        <div className="command-kpis">
          <div className="cq-item">
            <span className="cq-value">{activePatients}</span>
            <span className="cq-label">em cuidado</span>
          </div>
          <div className="cq-sep" />
          <div className="cq-item">
            <span className="cq-value">{todaySlots.length}</span>
            <span className="cq-label">hoje</span>
          </div>
          <div className="cq-sep" />
          <div className="cq-item">
            <span className="cq-value">{attendanceRate}%</span>
            <span className="cq-label">aderência</span>
          </div>
          <div className="cq-sep" />
          <div className="cq-item">
            <span className="cq-value" style={{ color: criticalPatients.length > 0 ? 'var(--warning)' : 'var(--success)' }}>{criticalPatients.length}</span>
            <span className="cq-label">em atenção</span>
          </div>
        </div>
        <div className="command-bar-actions">
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/agenda')}>
            Agenda completa
          </button>
        </div>
      </div>

      {/* ── 2. AI INSIGHT ──────────────────────────────────────────────────── */}
      {aiSummary ? (
        <div className="command-insight insight-banner">
          <span className="insight-icon" aria-hidden="true" />
          <div>
            <div className="insight-label">Copiloto clínico</div>
            <div className="insight-text">{aiSummary.summary}</div>
            {aiSummary.insight && <div className="metric-detail" style={{ marginTop: 2 }}>{aiSummary.insight}</div>}
          </div>
        </div>
      ) : (
        <div className="command-insight insight-banner skeleton-insight">
          <span className="skeleton-dot" />
          <div>
            <div className="skeleton-line short" />
            <div className="skeleton-line" />
          </div>
        </div>
      )}

      {/* ── 3. PRIORITY STRIP ──────────────────────────────────────────────── */}
      {dayPriorities.length > 0 && (
        <div className="priority-flow">
          {dayPriorities.map(item => (
            <button
              key={`${item.label}-${item.title}`}
              className="priority-flow-card"
              onClick={() => navigate(item.route)}
            >
              <span className="priority-flow-label">{item.label}</span>
              <strong className="priority-flow-title">{item.title}</strong>
              <span className="priority-flow-detail">{item.detail}</span>
            </button>
          ))}
          {conflictsToday > 0 && (
            <button className="priority-flow-card priority-flow-alert" onClick={() => navigate('/agenda')}>
              <span className="priority-flow-label">Conflito de agenda</span>
              <strong className="priority-flow-title">{conflictsToday} conflito{conflictsToday > 1 ? 's' : ''}</strong>
              <span className="priority-flow-detail">Verificar e resolver</span>
            </button>
          )}
        </div>
      )}

      {/* ── 4. MAIN LAYOUT ─────────────────────────────────────────────────── */}
      <div className="command-main">

        {/* ── LEFT: clinical timeline + returns ── */}
        <div className="command-content">

          {/* Today's clinical flow */}
          <section className="today-clinical-flow">
            <div className="flow-header">
              <div>
                <div className="section-kicker">Fluxo clínico do dia</div>
                <h3 className="flow-title">Atendimentos de hoje</h3>
                {todaySlots.length > 0 && (
                  <p className="flow-sub">
                    {doneSlots.length} concluído{doneSlots.length !== 1 ? 's' : ''} · {pendingSlots.length} pendente{pendingSlots.length !== 1 ? 's' : ''}
                    {nextSlot && ` · próximo às ${nextSlot.time}`}
                  </p>
                )}
              </div>
              <button className="btn btn-sm btn-secondary" onClick={() => navigate('/agenda')}>
                Ver agenda
              </button>
            </div>

            {todaySlots.length === 0 ? (
              <div className="flow-empty">
                <div className="empty-icon" />
                <h4>Sem atendimentos hoje</h4>
                <p>Use este tempo para revisar retornos, atualizar evoluções e planejar a semana clínica.</p>
                <button className="btn btn-primary btn-sm" style={{ marginTop: 16 }} onClick={() => navigate('/agenda')}>
                  Agendar atendimento
                </button>
              </div>
            ) : (
              <div className="clinical-flow-list">
                {todaySlots.map((slot, idx) => {
                  const patient = getPatientById(slot.patientId)
                  const servico = getServicoById(slot.serviceId)
                  const risk = patient ? getPatientRisk(patient, agendaSlots) : null
                  const isNext = slot.id === nextSlot?.id
                  const isLast = idx === todaySlots.length - 1
                  return (
                    <div
                      key={slot.id}
                      className={`flow-entry${isNext ? ' flow-entry-next' : ''}`}
                      style={{ borderBottom: isLast ? 'none' : '1px solid var(--border-light)' }}
                    >
                      {/* Time column */}
                      <div className="flow-time-col">
                        <span className="flow-time">{slot.time}</span>
                        <span className="flow-duration">{slot.duration}min</span>
                      </div>

                      {/* Status indicator */}
                      <div
                        className="flow-status-bar"
                        style={{ background: STATUS_COLOR[slot.status] || 'var(--border)' }}
                        title={slot.status}
                      />

                      {/* Card body */}
                      <div className="flow-card">
                        <div className="flow-card-top">
                          <div className="flow-patient-row">
                            <button
                              className="flow-patient-name"
                              onClick={() => navigate(`/prontuario/${slot.patientId}`)}
                            >
                              {patient?.name || 'Paciente não informado'}
                            </button>
                            <RiskPill risk={risk} />
                          </div>
                          <span
                            className="flow-status-badge"
                            style={{ color: STATUS_COLOR[slot.status], background: STATUS_BG[slot.status] }}
                          >
                            {slot.status}
                          </span>
                        </div>

                        <div className="flow-meta">
                          <span className="flow-service-dot" style={{ background: servico?.color || 'var(--primary)' }} />
                          {servico?.name || 'Serviço'} · {slot.professional || 'Profissional'}
                        </div>

                        {slot.evolucao && (
                          <p className="flow-note">"{slot.evolucao}"</p>
                        )}

                        <div className="flow-actions">
                          <button
                            className="flow-action-btn"
                            onClick={() => navigate(`/prontuario/${slot.patientId}`)}
                          >
                            Ver jornada
                          </button>
                          <button
                            className="flow-action-btn"
                            onClick={() => navigate('/agenda')}
                          >
                            {slot.status === 'Realizado' ? 'Ver sessão' : 'Gerenciar'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          {/* Awaiting return */}
          {awaitingReturn.length > 0 && (
            <section className="card return-section">
              <div className="card-header">
                <div>
                  <h3 className="card-title">Pacientes aguardando retorno</h3>
                  <p className="card-subtitle">Continuidade do cuidado</p>
                </div>
                <button className="btn btn-sm btn-secondary" onClick={() => navigate('/crm')}>Ver todos</button>
              </div>
              <div>
                {awaitingReturn.slice(0, 5).map((p, i) => {
                  const last = agendaSlots.filter(s => s.patientId === p.id && s.status === 'Realizado').sort((a, b) => b.date.localeCompare(a.date))[0]
                  const days = last ? daysSince(last.date) : null
                  const initials = p.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
                  return (
                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 22px', borderBottom: i < Math.min(awaitingReturn.length, 5) - 1 ? '1px solid var(--border-light)' : 'none' }}>
                      <div className="avatar avatar-sm">{initials}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 650, fontSize: 14 }}>{p.name}</div>
                        <div className="metric-detail">{days !== null ? `Última sessão há ${days} dias` : 'Ainda sem sessão registrada'}</div>
                      </div>
                      <button className="btn btn-xs btn-whatsapp" onClick={() => navigate('/crm')}>Preparar contato</button>
                    </div>
                  )
                })}
              </div>
            </section>
          )}
        </div>

        {/* ── RIGHT SIDEBAR ── */}
        <aside className="command-sidebar">

          {/* Quick stats */}
          <section className="card sidebar-stats-card">
            <div className="card-header">
              <h3 className="card-title">Operação</h3>
            </div>
            <div className="card-body" style={{ padding: '14px 18px' }}>
              <div className="sidebar-stat-row">
                <span className="sidebar-stat-label">Profissionais hoje</span>
                <span className="sidebar-stat-value">{todayProfIds.length}</span>
              </div>
              <div className="sidebar-stat-row">
                <span className="sidebar-stat-label">Salas em uso</span>
                <span className="sidebar-stat-value">{todayRoomIds.length}</span>
              </div>
              <div className="sidebar-stat-row">
                <span className="sidebar-stat-label">Ocupação</span>
                <span className="sidebar-stat-value">{occupancy}%</span>
              </div>
              <div className="sidebar-stat-row">
                <span className="sidebar-stat-label">Conflitos</span>
                <span className="sidebar-stat-value" style={{ color: conflictsToday > 0 ? 'var(--danger)' : 'var(--success)' }}>
                  {conflictsToday > 0 ? `${conflictsToday} ⚠` : 'Nenhum'}
                </span>
              </div>
              <div className="sidebar-stat-row">
                <span className="sidebar-stat-label">Evolução clínica</span>
                <span className="sidebar-stat-value">{evolutionAverage}%</span>
              </div>
            </div>
          </section>

          {/* Upcoming */}
          <section className="card">
            <div className="card-header">
              <h3 className="card-title">Próximos atendimentos</h3>
            </div>
            {upcomingSlots.length === 0 ? (
              <div className="empty-state" style={{ padding: '24px 18px' }}>
                <div className="empty-icon" />
                <h4>Agenda futura livre</h4>
              </div>
            ) : (
              <div>
                {upcomingSlots.map((slot, i) => {
                  const p = getPatientById(slot.patientId)
                  const srv = getServicoById(slot.serviceId)
                  return (
                    <div key={slot.id} style={{ padding: '13px 18px', borderBottom: i < upcomingSlots.length - 1 ? '1px solid var(--border-light)' : 'none', display: 'flex', gap: 12, alignItems: 'center' }}>
                      <div className="service-mark" style={{ color: srv?.color || 'var(--primary)' }}>{serviceInitials(srv?.name)}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 650, fontSize: 13.5 }}>{p?.name || 'Paciente'}</div>
                        <div className="metric-detail">{new Date(slot.date + 'T12:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })} · {slot.time}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          {/* Financial snapshot */}
          <section className="card">
            <div className="card-header">
              <h3 className="card-title">Saúde financeira</h3>
              <button className="btn btn-ghost btn-xs" onClick={() => navigate('/financeiro')}>Detalhar</button>
            </div>
            <div className="card-body">
              {[
                ['Receita', currency(monthRevenue), 'var(--success)'],
                ['Despesas', currency(monthExpenses), 'var(--danger)'],
                ['Resultado', currency(balance), balance >= 0 ? 'var(--success)' : 'var(--danger)'],
              ].map(([label, val, color]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid var(--border-light)' }}>
                  <span className="metric-detail">{label}</span>
                  <strong style={{ color, fontSize: 13.5 }}>{val}</strong>
                </div>
              ))}
              {monthPending > 0 && (
                <div style={{ marginTop: 10, padding: '8px 10px', background: 'var(--warning-light)', borderRadius: 8, fontSize: 12, color: 'var(--warning)', fontWeight: 600 }}>
                  {currency(monthPending)} a receber
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 12 }}>
                <Sparkline values={sparkValues} color={balance >= 0 ? 'var(--success)' : 'var(--danger)'} />
              </div>
            </div>
          </section>

          {/* Clinical intelligence compact */}
          <ClinicalIntelligence
            patients={patients}
            slots={agendaSlots}
            compact
            onOpenPatient={id => navigate(`/prontuario/${id}`)}
          />
        </aside>
      </div>

      {/* ── 5. CLINICAL RELATIONSHIP INSIGHTS (full width) ─────────────────── */}
      <ClinicalRelationshipInsights onOpenPatient={id => navigate(`/prontuario/${id}`)} />
    </div>
  )
}
