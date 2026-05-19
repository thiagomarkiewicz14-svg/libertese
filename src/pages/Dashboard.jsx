import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { ai } from '../services/ai'
import ClinicalIntelligence from '../components/dashboard/ClinicalIntelligence'
import ClinicalRelationshipInsights from '../components/dashboard/ClinicalRelationshipInsights'
import { calculateClinicalProgress, getPatientRisk } from '../domain/clinical'

const STATUS_COLOR = { Agendado: '#8FA090', Confirmado: '#1A4A7A', Realizado: '#2A6E47', Falta: '#A83228', Cancelado: '#8FA090' }

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
  return name
    .split(' ')
    .filter(Boolean)
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export default function Dashboard() {
  const { patients, agendaSlots, financeiro, servicos, professionals, rooms, getProfessionalById, getPatientById, getServicoById } = useApp()
  const navigate = useNavigate()
  const [aiSummary, setAiSummary] = useState(null)

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
  const recommendedMoves = dayPriorities.length ? dayPriorities : [
    { label: 'Revisão clínica', title: 'Auditar evoluções', detail: 'Atualize registros recentes para manter a jornada narrativa.', route: '/sessoes' },
    { label: 'Relacionamento', title: 'Nutrir retornos', detail: 'Revise pacientes sem contato e prepare mensagens humanas.', route: '/crm' },
    { label: 'Protocolos', title: 'Refinar prescrições', detail: 'Ajuste exercícios e próximos passos por perfil clínico.', route: '/planos' },
  ]

  // ── Operação do dia ──────────────────────────────────────────────────────
  const ACTIVE_SET = new Set(['Agendado', 'Confirmado', 'Realizado'])

  const conflictsToday = useMemo(() => {
    const active = agendaSlots.filter(s => ACTIVE_SET.has(s.status))
    const roomGroups = {}
    const profGroups = {}
    active.forEach(s => {
      if (s.roomId) {
        const k = `${s.date}|${s.time}|r${s.roomId}`
        ;(roomGroups[k] = roomGroups[k] || []).push(s.id)
      }
      if (s.professionalId) {
        const k = `${s.date}|${s.time}|p${s.professionalId}`
        ;(profGroups[k] = profGroups[k] || []).push(s.id)
      }
    })
    const conflictIds = new Set()
    Object.values(roomGroups).filter(ids => ids.length > 1).forEach(ids => ids.forEach(id => conflictIds.add(id)))
    Object.values(profGroups).filter(ids => ids.length > 1).forEach(ids => ids.forEach(id => conflictIds.add(id)))
    return [...conflictIds].filter(id => agendaSlots.find(s => s.id === id && s.date === TODAY)).length
  }, [agendaSlots, TODAY])

  const todayProfIds = [...new Set(todaySlots.filter(s => s.professionalId).map(s => s.professionalId))]
  const todayRoomIds = [...new Set(todaySlots.filter(s => s.roomId).map(s => s.roomId))]
  const todayProfs = todayProfIds.map(id => getProfessionalById(id)).filter(Boolean)

  const serviceDemandTotals = Object.fromEntries(
    servicos.map(srv => [srv.id, agendaSlots.filter(s => s.serviceId === srv.id && s.status === 'Realizado').length])
  )
  const maxDemandTotal = Math.max(...Object.values(serviceDemandTotals), 1)

  return (
    <div className="page-body">
      <section className="dashboard-hero">
        <div className="overview-panel">
          <div className="overview-content">
            <div className="eyebrow">Visão clínica do dia</div>
            <h1 className="overview-title">Cuidado organizado para um dia mais leve.</h1>
            <p className="overview-copy">
              {todaySlots.length > 0
                ? `Hoje há ${todaySlots.length} atendimentos no estúdio, com ${pendingSlots.length} ainda em agenda e ${doneSlots.length} já realizados.`
                : 'Hoje não há atendimentos agendados. Um bom momento para revisar retornos, prontuários e planejamento terapêutico.'}
            </p>
            <div className="overview-actions">
              <button className="btn btn-primary" onClick={() => navigate('/agenda')}>Abrir centro operacional</button>
              <button className="btn btn-secondary" onClick={() => navigate('/pacientes')}>Ver jornadas clínicas</button>
              <button className="btn btn-secondary" onClick={() => navigate('/crm')}>Priorizar retornos</button>
            </div>
          </div>
        </div>

        <aside className="clinic-status">
          <div className="status-panel">
            <div className="section-kicker">Status operacional</div>
            <div className="status-number">{operationalLabel}</div>
            <p className="status-label">
              {nextSlot
                ? `Próximo atendimento às ${nextSlot.time}, com ${getPatientById(nextSlot.patientId)?.name || 'paciente'}.`
                : 'Nenhum atendimento pendente para hoje.'}
            </p>
            <div className="status-list">
              <span>{doneSlots.length} realizados</span>
              <span>{pendingSlots.length} pendentes</span>
              <span>{inactivePatients.length} inativos +30d</span>
            </div>
          </div>
          {aiSummary ? (
            <div className="insight-banner" style={{ marginBottom: 0 }}>
              <span className="insight-icon" aria-hidden="true" />
              <div>
                <div className="insight-label">Insight do dia</div>
                <div className="insight-text">{aiSummary.summary}</div>
                {aiSummary.insight && <div className="metric-detail">{aiSummary.insight}</div>}
              </div>
            </div>
          ) : (
            <div className="insight-banner skeleton-insight" style={{ marginBottom: 0 }}>
              <span className="skeleton-dot" />
              <div>
                <div className="skeleton-line short" />
                <div className="skeleton-line" />
                <div className="skeleton-line small" />
              </div>
            </div>
          )}
        </aside>
      </section>

      <section className="dashboard-metrics">
        <div className="metric-card">
          <div className="metric-label">Pacientes em cuidado</div>
          <div className="metric-value">{activePatients}</div>
          <div className="metric-detail">{criticalPatients.length > 0 ? `${criticalPatients.length} requer${criticalPatients.length === 1 ? '' : 'em'} atenção` : 'Carteira clínica estável'}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Ocupação do dia</div>
          <div className="metric-value">{occupancy}%</div>
          <div className="metric-detail">{todaySlots.length > 0 ? `${doneSlots.length} concluídos · ${pendingSlots.length} pendentes` : 'Nenhum agendamento hoje'}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Receita do mês</div>
          <div className="metric-value">{currency(monthRevenue)}</div>
          <div className="metric-detail">{monthPending > 0 ? `${currency(monthPending)} a receber` : 'Sem pendências de entrada'}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Evolução clínica média</div>
          <div className="metric-value">{evolutionAverage}%</div>
          <div className="metric-detail">{attendanceRate}% de comparecimento no mês</div>
        </div>
      </section>

      <section className="executive-ops-strip">
        <div className="ops-health-card">
          <div className="section-kicker">Saúde operacional</div>
          <h3>{attendanceRate}% de comparecimento</h3>
          <p>{occupancy}% de ocupação hoje, {criticalPatients.length} paciente{criticalPatients.length === 1 ? '' : 's'} pedindo atenção.</p>
        </div>
        <div className="ops-priority-grid">
          {recommendedMoves.map(item => (
            <button key={`${item.label}-${item.title}`} className="ops-priority-card" onClick={() => navigate(item.route)}>
              <span>{item.label}</span>
              <strong>{item.title}</strong>
              <small>{item.detail}</small>
            </button>
          ))}
        </div>
      </section>

      <ClinicalRelationshipInsights onOpenPatient={id => navigate(`/prontuario/${id}`)} />

      <div className="dashboard-grid" style={{ gap: 22 }}>
        <div>
          <section className="card" style={{ marginBottom: 20 }}>
            <div className="card-header">
              <div>
                <h3 className="card-title">Agenda de hoje</h3>
                <p className="card-subtitle">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
              </div>
              <button className="btn btn-sm btn-secondary" onClick={() => navigate('/agenda')}>Ver agenda completa</button>
            </div>

            {todaySlots.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon" />
                <h3>Sem atendimentos hoje</h3>
                <p>Use o dia para reativar pacientes ou organizar protocolos.</p>
                <button className="btn btn-primary btn-sm" style={{ marginTop: 14 }} onClick={() => navigate('/agenda')}>Agendar atendimento</button>
              </div>
            ) : (
              <div className="clinical-list">
                {todaySlots.map((slot, idx) => {
                  const patient = getPatientById(slot.patientId)
                  const servico = getServicoById(slot.serviceId)
                  const isLast = idx === todaySlots.length - 1
                  return (
                    <div
                      key={slot.id}
                      className="today-slot-row"
                      onClick={() => navigate('/agenda')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 16,
                        padding: '17px 22px',
                        borderBottom: isLast ? 'none' : '1px solid var(--border-light)',
                        cursor: 'pointer',
                        borderLeft: `4px solid ${STATUS_COLOR[slot.status] || 'transparent'}`,
                      }}
                    >
                      <div className="today-slot-time" style={{ minWidth: 52, fontWeight: 700, color: 'var(--text)' }}>{slot.time}</div>
                      <div className="slot-service-mark" style={{ color: servico?.color || 'var(--primary)' }}>{serviceInitials(servico?.name)}</div>
                      <div className="today-slot-info" style={{ flex: 1 }}>
                        <div style={{ fontWeight: 650 }}>{patient?.name || 'Paciente não informado'}</div>
                        <div className="metric-detail">{servico?.name || 'Serviço'} · {slot.duration}min · {slot.professional}</div>
                      </div>
                      <div className="today-slot-status">
                        <span className="badge badge-muted" style={{ color: STATUS_COLOR[slot.status] }}>{slot.status}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          <section className="card">
            <div className="card-header">
              <div>
                <h3 className="card-title">Pacientes para retorno</h3>
                <p className="card-subtitle">Relacionamento e continuidade de cuidado</p>
              </div>
              <button className="btn btn-sm btn-secondary" onClick={() => navigate('/crm')}>Ver relacionamento</button>
            </div>
            {awaitingReturn.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon" />
                <h3>Nenhum retorno pendente</h3>
                <p>Os pacientes em acompanhamento estão em dia.</p>
              </div>
            ) : (
              <div className="clinical-list">
                {awaitingReturn.slice(0, 5).map((p, i) => {
                  const last = agendaSlots.filter(s => s.patientId === p.id && s.status === 'Realizado').sort((a, b) => b.date.localeCompare(a.date))[0]
                  const days = last ? daysSince(last.date) : null
                  const initials = p.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
                  return (
                    <div key={p.id} className="clinical-row" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '15px 22px', borderBottom: i < awaitingReturn.slice(0, 5).length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                      <div className="avatar avatar-sm">{initials}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 650 }}>{p.name}</div>
                        <div className="metric-detail">{days !== null ? `Última sessão há ${days} dias` : 'Ainda sem sessão registrada'}</div>
                      </div>
                      <button className="btn btn-xs btn-whatsapp" onClick={() => navigate('/crm')}>Preparar contato</button>
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        </div>

        <aside>
          <section className="card" style={{ marginBottom: 18 }}>
            <div className="card-header">
              <h3 className="card-title">Operação do dia</h3>
              <button className="btn btn-ghost btn-xs" onClick={() => navigate('/agenda')}>Ver agenda</button>
            </div>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ padding: '10px 12px', background: 'var(--surface-2)', borderRadius: 10 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Profissionais</div>
                  <div style={{ fontWeight: 700, fontSize: 20, color: 'var(--text)', marginBottom: 6 }}>{todayProfIds.length}</div>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {todayProfs.map(p => (
                      <span key={p.id} title={p.name} style={{ width: 20, height: 20, borderRadius: '50%', background: p.color, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#fff', fontWeight: 700 }}>
                        {p.name[0]}
                      </span>
                    ))}
                    {todayProfIds.length === 0 && <span style={{ fontSize: 12, color: 'var(--text-3)' }}>—</span>}
                  </div>
                </div>
                <div style={{ padding: '10px 12px', background: 'var(--surface-2)', borderRadius: 10 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Salas em uso</div>
                  <div style={{ fontWeight: 700, fontSize: 20, color: 'var(--text)', marginBottom: 6 }}>{todayRoomIds.length}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
                    {todayRoomIds.length > 0
                      ? todayRoomIds.map(id => rooms.find(r => r.id === id)?.number).filter(Boolean).map(n => `Sala ${n}`).join(', ')
                      : '—'}
                  </div>
                </div>
                <div style={{ padding: '10px 12px', background: 'var(--surface-2)', borderRadius: 10 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Ocupação</div>
                  <div style={{ fontWeight: 700, fontSize: 20, color: 'var(--text)' }}>{occupancy}%</div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>{todaySlots.length} slot{todaySlots.length !== 1 ? 's' : ''} hoje</div>
                </div>
                <div style={{ padding: '10px 12px', background: conflictsToday > 0 ? 'var(--warning-light)' : 'var(--surface-2)', borderRadius: 10 }}>
                  <div style={{ fontSize: 11, color: conflictsToday > 0 ? 'var(--warning)' : 'var(--text-3)', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Conflitos</div>
                  <div style={{ fontWeight: 700, fontSize: 20, color: conflictsToday > 0 ? 'var(--warning)' : 'var(--success)' }}>{conflictsToday}</div>
                  <div style={{ fontSize: 12, color: conflictsToday > 0 ? 'var(--warning)' : 'var(--text-3)', marginTop: 4 }}>
                    {conflictsToday > 0 ? 'Verificar agenda' : 'Sem conflitos'}
                  </div>
                </div>
              </div>
              {conflictsToday > 0 && (
                <div style={{ marginTop: 12, padding: '10px 12px', background: 'var(--warning-light)', borderRadius: 10, borderLeft: '3px solid var(--warning)', fontSize: 13, color: 'var(--warning)', fontWeight: 600 }}>
                  ⚠ {conflictsToday} conflito{conflictsToday > 1 ? 's' : ''} detectado{conflictsToday > 1 ? 's' : ''} na agenda de hoje
                </div>
              )}
            </div>
          </section>

          <section className="card" style={{ marginBottom: 18 }}>
            <div className="card-header"><h3 className="card-title">Próximos atendimentos</h3></div>
            {upcomingSlots.length === 0 ? (
              <div className="empty-state"><div className="empty-icon" /><h3>Agenda futura livre</h3></div>
            ) : (
              <div>
                {upcomingSlots.map((slot, i) => {
                  const p = getPatientById(slot.patientId)
                  const srv = getServicoById(slot.serviceId)
                  return (
                    <div key={slot.id} className="clinical-row" style={{ padding: '14px 18px', borderBottom: i < upcomingSlots.length - 1 ? '1px solid var(--border-light)' : 'none', display: 'flex', gap: 12, alignItems: 'center' }}>
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

          <section className="card" style={{ marginBottom: 18 }}>
            <div className="card-header">
              <h3 className="card-title">Saúde financeira</h3>
              <button className="btn btn-ghost btn-xs" onClick={() => navigate('/financeiro')}>Visão executiva</button>
            </div>
            <div className="card-body">
              {[
                ['Receita', currency(monthRevenue), 'var(--success)'],
                ['Despesas', currency(monthExpenses), 'var(--danger)'],
                ['Resultado', currency(balance), balance >= 0 ? 'var(--success)' : 'var(--danger)'],
              ].map(([label, val, color]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-light)' }}>
                  <span className="metric-detail">{label}</span>
                  <strong style={{ color }}>{val}</strong>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: 14, gap: 10 }}>
                <span style={{ fontSize: 10.5, color: 'var(--muted)', fontWeight: 650, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Receita · 6 meses</span>
                <Sparkline values={sparkValues} color={balance >= 0 ? 'var(--success)' : 'var(--danger)'} />
              </div>
            </div>
          </section>

          <ClinicalIntelligence
            patients={patients}
            slots={agendaSlots}
            compact
            onOpenPatient={id => navigate(`/prontuario/${id}`)}
          />

          <section className="card">
            <div className="card-header"><h3 className="card-title">Demanda por serviço</h3></div>
            <div className="card-body">
              {servicos.length === 0 ? (
                <p style={{ fontSize: 13, color: 'var(--text-3)', textAlign: 'center', padding: '12px 0' }}>Nenhum serviço cadastrado.</p>
              ) : servicos.map((srv, idx) => {
                const total = serviceDemandTotals[srv.id]
                const pct = Math.round((total / maxDemandTotal) * 100)
                return (
                  <div key={srv.id} style={{ padding: '10px 0', borderBottom: idx < servicos.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 7 }}>
                      <div className="service-mark" style={{ color: srv.color }}>{serviceInitials(srv.name)}</div>
                      <span style={{ flex: 1, fontWeight: 600 }}>{srv.name}</span>
                      <span className="metric-detail">{total} {total !== 1 ? 'sessões' : 'sessão'}</span>
                    </div>
                    <div style={{ height: 4, borderRadius: 2, background: 'var(--border-light)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, borderRadius: 2, background: srv.color || 'var(--primary)', opacity: 0.65, transition: 'width 0.4s ease' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}
