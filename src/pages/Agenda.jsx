import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import Modal from '../components/Modal'
import { whatsapp } from '../services/whatsapp'
import { STATUS_AGENDAMENTO } from '../domain/constants'
import OperationalTimeline from '../components/agenda/OperationalTimeline'
import AppointmentCommandCard from '../components/agenda/AppointmentCommandCard'

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const HOURS = ['07:00','07:30','08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30','12:00','13:00','14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30','18:00','18:30','19:00']
const STATUS_COLOR = { 'Agendado': '#8FA090', 'Confirmado': '#1A4A7A', 'Realizado': '#2A6E47', 'Falta': '#A83228', 'Cancelado': '#8FA090' }

function getWeekDates(offset = 0) {
  const today = new Date()
  const dow = today.getDay()
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() - dow + i + offset * 7)
    return d
  })
}

const EMPTY = {
  patientId: '', serviceId: '', date: new Date().toISOString().slice(0, 10),
  time: '09:00', duration: 60, professionalId: '', roomId: '',
  professional: '', status: 'Agendado', notes: '',
}

export default function Agenda() {
  const {
    agendaSlots, patients, servicos,
    professionals, rooms,
    addAgendaSlot, updateAgendaSlot, deleteAgendaSlot,
    getProfessionalById, getRoomById, showToast,
  } = useApp()
  const navigate = useNavigate()
  const [weekOffset, setWeekOffset] = useState(0)
  const [view, setView] = useState('dia')
  const [modal, setModal] = useState(null)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [activeSlotId, setActiveSlotId] = useState(null)

  // ── Filters ────────────────────────────────────────────────────────────────
  const [filterProfId, setFilterProfId] = useState('')
  const [filterRoomId, setFilterRoomId] = useState('')

  const activeProfs = professionals.filter(p => p.active)
  const activeRooms = rooms.filter(r => r.active)

  function applyFilters(slots) {
    return slots
      .filter(s => !filterProfId || s.professionalId === filterProfId)
      .filter(s => !filterRoomId || s.roomId === filterRoomId)
  }

  const weekDates = getWeekDates(weekOffset)
  const todayStr = new Date().toISOString().slice(0, 10)

  const slotsForDay = (dateStr) =>
    applyFilters(agendaSlots.filter(s => s.date === dateStr).sort((a, b) => a.time.localeCompare(b.time)))

  // ── Modal helpers ──────────────────────────────────────────────────────────
  function openAdd(dateStr, time = '09:00') {
    setForm({ ...EMPTY, date: dateStr, time })
    setSelected(null)
    setModal('form')
  }

  function openEdit(slot) {
    setSelected(slot)
    setForm({
      patientId: slot.patientId, serviceId: slot.serviceId,
      date: slot.date, time: slot.time, duration: slot.duration,
      professionalId: slot.professionalId || '',
      roomId: slot.roomId || '',
      professional: slot.professional || '',
      status: slot.status, notes: slot.notes || '',
    })
    setModal('form')
  }

  function openDetail(slot) { setSelected(slot); setModal('detail') }
  function close() { setModal(null); setSelected(null) }

  function handleSave() {
    if (!form.patientId || !form.serviceId) return
    const prof = professionals.find(p => p.id === form.professionalId)
    const data = {
      ...form,
      duration: Number(form.duration),
      professional: prof ? prof.name : (form.professional || ''),
    }
    if (selected) updateAgendaSlot(selected.id, data)
    else addAgendaSlot(data)
    close()
  }

  function handleDelete() { deleteAgendaSlot(selected.id); close() }

  function quickWhatsapp(slot) {
    const patient = patientMap[slot.patientId]
    const servico = serviceMap[slot.serviceId]
    if (!patient || !servico) return
    whatsapp.sendConfirmation(patient, slot, servico.name)
  }

  function quickConfirm(slot) { updateAgendaSlot(slot.id, { status: 'Confirmado' }) }

  function quickStart(slot) {
    setActiveSlotId(slot.id)
    if (slot.status === 'Agendado') updateAgendaSlot(slot.id, { status: 'Confirmado' })
    showToast('Sessão iniciada na linha operacional.', 'success')
  }

  function quickComplete(slot) {
    updateAgendaSlot(slot.id, { status: 'Realizado' })
    if (activeSlotId === slot.id) setActiveSlotId(null)
  }

  function quickReschedule(slot, patch) { updateAgendaSlot(slot.id, patch) }

  const patientMap = Object.fromEntries(patients.map(p => [p.id, p]))
  const serviceMap = Object.fromEntries(servicos.map(s => [s.id, s]))

  // ── Conflict detection ─────────────────────────────────────────────────────
  const ACTIVE_SET = new Set(['Agendado', 'Confirmado', 'Realizado'])

  // Map slotId → conflict type ('room' | 'prof' | 'both') — for card badges
  const conflictSlotIds = useMemo(() => {
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
    const result = {}
    Object.values(roomGroups).filter(ids => ids.length > 1).forEach(ids =>
      ids.forEach(id => { result[id] = result[id] === 'prof' ? 'both' : 'room' })
    )
    Object.values(profGroups).filter(ids => ids.length > 1).forEach(ids =>
      ids.forEach(id => { result[id] = result[id] === 'room' ? 'both' : 'prof' })
    )
    return result
  }, [agendaSlots])

  // Live conflict check for the open form
  const formCandidates = modal === 'form'
    ? agendaSlots.filter(s =>
        s.date === form.date &&
        s.time === form.time &&
        ACTIVE_SET.has(s.status) &&
        s.id !== selected?.id
      )
    : []
  const roomConflict = form.roomId
    ? formCandidates.find(s => s.roomId === form.roomId) || null
    : null
  const profConflict = form.professionalId
    ? formCandidates.find(s => s.professionalId === form.professionalId) || null
    : null

  const todaySlots = slotsForDay(todayStr)

  // profissionais elegíveis para o form (filtrado por serviço se selecionado)
  const eligibleProfs = form.serviceId
    ? activeProfs.filter(p => !p.serviceIds?.length || p.serviceIds.includes(form.serviceId))
    : activeProfs

  return (
    <div className="page-body">

      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <div className="page-toolbar">
        <div className="toolbar-left">
          <div className="tabs" style={{ marginBottom: 0 }}>
            <button className={`tab ${view === 'semana' ? 'active' : ''}`} onClick={() => setView('semana')}>Semana</button>
            <button className={`tab ${view === 'dia' ? 'active' : ''}`} onClick={() => setView('dia')}>Hoje</button>
          </div>
          {view === 'semana' && (
            <div className="agenda-period-nav" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setWeekOffset(w => w - 1)}>←</button>
              <button className="btn btn-ghost btn-sm agenda-next-mobile" onClick={() => setWeekOffset(w => w + 1)}>→</button>
              <span className="agenda-period-label" style={{ fontSize: 13, color: 'var(--text-2)', minWidth: 140, textAlign: 'center' }}>
                {weekDates[0].toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })} – {weekDates[6].toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}
              </span>
              <button className="btn btn-ghost btn-sm agenda-next-desktop" onClick={() => setWeekOffset(w => w + 1)}>→</button>
              {weekOffset !== 0 && <button className="btn btn-xs btn-secondary" onClick={() => setWeekOffset(0)}>Hoje</button>}
            </div>
          )}
        </div>
        <button className="btn btn-primary" onClick={() => openAdd(todayStr)}>Agendar atendimento</button>
      </div>

      {/* ── Filter bar ──────────────────────────────────────────────────── */}
      {(activeProfs.length > 0 || activeRooms.length > 0) && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16, padding: '10px 14px', background: 'var(--surface-2)', borderRadius: 12, border: '1px solid var(--border-light)' }}>
          {/* Professional filter */}
          {activeProfs.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Profissional</span>
              <button
                onClick={() => setFilterProfId('')}
                style={{ padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: '1.5px solid var(--border)', background: !filterProfId ? 'var(--primary)' : 'transparent', color: !filterProfId ? '#fff' : 'var(--text-2)', transition: 'all 0.12s' }}>
                Todos
              </button>
              {activeProfs.map(p => (
                <button
                  key={p.id}
                  onClick={() => setFilterProfId(filterProfId === p.id ? '' : p.id)}
                  style={{ padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.12s', border: `1.5px solid ${p.color}`, background: filterProfId === p.id ? p.color : 'transparent', color: filterProfId === p.id ? '#fff' : p.color }}>
                  {p.name.split(' ')[0]}
                </button>
              ))}
            </div>
          )}
          {/* Room filter */}
          {activeRooms.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Sala</span>
              <button
                onClick={() => setFilterRoomId('')}
                style={{ padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: '1.5px solid var(--border)', background: !filterRoomId ? 'var(--primary)' : 'transparent', color: !filterRoomId ? '#fff' : 'var(--text-2)', transition: 'all 0.12s' }}>
                Todas
              </button>
              {activeRooms.map(r => (
                <button
                  key={r.id}
                  onClick={() => setFilterRoomId(filterRoomId === r.id ? '' : r.id)}
                  style={{ padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.12s', border: '1.5px solid var(--primary)', background: filterRoomId === r.id ? 'var(--primary)' : 'transparent', color: filterRoomId === r.id ? '#fff' : 'var(--primary)' }}>
                  Sala {r.number}
                </button>
              ))}
            </div>
          )}
          {(filterProfId || filterRoomId) && (
            <button
              onClick={() => { setFilterProfId(''); setFilterRoomId('') }}
              style={{ marginLeft: 'auto', padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: '1.5px solid var(--border)', background: 'transparent', color: 'var(--text-3)' }}>
              Limpar filtros ×
            </button>
          )}
        </div>
      )}

      {/* ── Dia view ────────────────────────────────────────────────────── */}
      {view === 'dia' && (
        <div>
          <OperationalTimeline slots={todaySlots} activeSlotId={activeSlotId} />
          {todaySlots.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon" />
              <h3>{filterProfId || filterRoomId ? 'Nenhum atendimento para este filtro' : 'Sem atendimentos hoje'}</h3>
              <p>{filterProfId || filterRoomId ? 'Ajuste os filtros ou agende um novo atendimento.' : 'Use o dia para revisar retornos, prescrições e evolução clínica.'}</p>
            </div>
          ) : (
            todaySlots.map(slot => {
              const p = patientMap[slot.patientId]
              const srv = serviceMap[slot.serviceId]
              const conflictType = conflictSlotIds[slot.id]
              return (
                <div key={slot.id} style={conflictType ? { borderLeft: '3px solid var(--warning)', paddingLeft: 6, borderRadius: '0 10px 10px 0', marginBottom: 4 } : {}}>
                  {conflictType && (
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--warning)', padding: '4px 8px 2px', letterSpacing: '0.03em' }}>
                      {conflictType === 'room' ? '⚠ Conflito de sala' : conflictType === 'prof' ? '⚠ Agenda dupla' : '⚠ Conflito de sala e agenda'}
                    </div>
                  )}
                  <AppointmentCommandCard
                    slot={slot}
                    patient={p}
                    service={srv}
                    professional={getProfessionalById(slot.professionalId)}
                    room={getRoomById(slot.roomId)}
                    activeSlotId={activeSlotId}
                    patientSlots={agendaSlots.filter(s => s.patientId === slot.patientId)}
                    onConfirm={quickConfirm}
                    onStart={quickStart}
                    onOpenRecord={s => navigate(`/prontuario/${s.patientId}`)}
                    onWhatsapp={quickWhatsapp}
                    onComplete={quickComplete}
                    onReschedule={quickReschedule}
                  />
                </div>
              )
            })
          )}
        </div>
      )}

      {/* ── Semana view ─────────────────────────────────────────────────── */}
      {view === 'semana' && (
        <div className="agenda-week-grid">
          {weekDates.map((date, i) => {
            const dateStr = date.toISOString().slice(0, 10)
            const isToday = dateStr === todayStr
            const slots = slotsForDay(dateStr)
            return (
              <div key={i}>
                <div className={`agenda-day-header ${isToday ? 'today' : ''}`}>
                  <div className="agenda-day-name">{DAYS[i]}</div>
                  <div className="agenda-day-num">{date.getDate()}</div>
                </div>
                {slots.map(slot => {
                  const p = patientMap[slot.patientId]
                  const srv = serviceMap[slot.serviceId]
                  const prof = getProfessionalById(slot.professionalId)
                  const room = getRoomById(slot.roomId)
                  const profColor = prof?.color || STATUS_COLOR[slot.status] || 'var(--border)'
                  const conflictType = conflictSlotIds[slot.id]
                  return (
                    <div key={slot.id} className="agenda-slot"
                      style={{ borderLeftColor: conflictType ? 'var(--warning)' : profColor }}
                      onClick={() => openEdit(slot)}>
                      <h4 style={{ color: STATUS_COLOR[slot.status] || 'var(--text)' }}>
                        {slot.time} · {p?.name?.split(' ')[0]}
                      </h4>
                      <p style={{ fontSize: 12, marginBottom: 2 }}>{srv?.name || '—'}</p>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
                        {prof && (
                          <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 999, background: prof.color + '20', color: prof.color, fontWeight: 600 }}>
                            {prof.name.split(' ')[0]}
                          </span>
                        )}
                        {!prof && slot.professional && (
                          <span style={{ fontSize: 10, color: 'var(--text-3)' }}>{slot.professional}</span>
                        )}
                        {room && (
                          <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 999, background: 'var(--primary-bg)', color: 'var(--primary)', fontWeight: 600 }}>
                            Sala {room.number}
                          </span>
                        )}
                        {conflictType && (
                          <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 999, background: 'var(--warning)', color: '#fff', fontWeight: 700 }}>
                            {conflictType === 'room' ? '⚠ Sala ocupada' : conflictType === 'prof' ? '⚠ Agenda dupla' : '⚠ Conflito'}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
                <button onClick={() => openAdd(dateStr)}
                  style={{ width: '100%', padding: 6, marginTop: 4, background: 'transparent', border: '1.5px dashed var(--border)', borderRadius: 7, color: 'var(--text-3)', fontSize: 12, cursor: 'pointer', transition: 'all 0.12s' }}
                  onMouseEnter={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.color = 'var(--primary)' }}
                  onMouseLeave={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.color = 'var(--text-3)' }}>
                  +
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Form modal ──────────────────────────────────────────────────── */}
      {modal === 'form' && (
        <Modal title={selected ? 'Ajustar Atendimento' : 'Novo Atendimento'} onClose={close}
          footer={
            <>
              {selected && <button className="btn btn-danger btn-sm" onClick={handleDelete}>Excluir</button>}
              <button className="btn btn-secondary" onClick={close}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSave}>{selected ? 'Salvar ajuste' : 'Agendar cuidado'}</button>
            </>
          }>
          <div className="form-group">
            <label className="form-label">Paciente *</label>
            <select className="form-control" value={form.patientId} onChange={e => setForm(f => ({ ...f, patientId: e.target.value }))}>
              <option value="">Selecione o paciente...</option>
              {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Serviço *</label>
            <select className="form-control" value={form.serviceId} onChange={e => {
              const srv = servicos.find(s => s.id === e.target.value)
              setForm(f => ({ ...f, serviceId: e.target.value, duration: srv?.duration || f.duration, professionalId: '' }))
            }}>
              <option value="">Selecione o serviço...</option>
              {servicos.map(s => <option key={s.id} value={s.id}>{s.name} — {s.duration}min — R${s.value}</option>)}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Data</label>
              <input className="form-control" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Horário</label>
              <select className="form-control" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))}>
                {HOURS.map(h => <option key={h}>{h}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Profissional</label>
              <select className="form-control" value={form.professionalId} onChange={e => setForm(f => ({ ...f, professionalId: e.target.value }))}>
                <option value="">Profissional não definido</option>
                {eligibleProfs.map(p => (
                  <option key={p.id} value={p.id}>{p.name}{p.role ? ` — ${p.role}` : ''}</option>
                ))}
                {/* show all others if there are active profs not in eligible list */}
                {activeProfs.filter(p => !eligibleProfs.find(e => e.id === p.id)).map(p => (
                  <option key={p.id} value={p.id}>{p.name} (outra especialidade)</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Sala</label>
              <select className="form-control" value={form.roomId} onChange={e => setForm(f => ({ ...f, roomId: e.target.value }))}>
                <option value="">Sala não definida</option>
                {activeRooms.map(r => <option key={r.id} value={r.id}>Sala {r.number} — {r.name}</option>)}
              </select>
            </div>
          </div>
          {(roomConflict || profConflict) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 4 }}>
              {roomConflict && (
                <div style={{ padding: '10px 14px', background: 'var(--warning-light)', borderRadius: 10, borderLeft: '3px solid var(--warning)' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--warning)', marginBottom: 3 }}>Conflito de sala</div>
                  <div style={{ fontSize: 13, color: 'var(--text-2)' }}>
                    Sala ocupada neste horário: <strong>{patientMap[roomConflict.patientId]?.name || 'Paciente'}</strong>
                    {(() => { const rp = getProfessionalById(roomConflict.professionalId); return rp ? ` · ${rp.name}` : roomConflict.professional ? ` · ${roomConflict.professional}` : '' })()}
                  </div>
                </div>
              )}
              {profConflict && (
                <div style={{ padding: '10px 14px', background: 'var(--warning-light)', borderRadius: 10, borderLeft: '3px solid var(--warning)' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--warning)', marginBottom: 3 }}>Conflito de agenda</div>
                  <div style={{ fontSize: 13, color: 'var(--text-2)' }}>
                    Profissional com atendimento neste horário: <strong>{patientMap[profConflict.patientId]?.name || 'Paciente'}</strong>
                    {getRoomById(profConflict.roomId) ? ` · Sala ${getRoomById(profConflict.roomId).number}` : ''}
                  </div>
                </div>
              )}
            </div>
          )}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Duração (min)</label>
              <input className="form-control" type="number" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-control" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                {STATUS_AGENDAMENTO.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Observações</label>
            <textarea className="form-control" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Observações para este agendamento..." />
          </div>
        </Modal>
      )}
    </div>
  )
}
