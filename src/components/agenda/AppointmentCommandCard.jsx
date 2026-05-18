import { useState } from 'react'
import { getOperationalLabel, getOperationalState, calculateClinicalProgress, getCompletedSessions } from '../../domain/clinical'

function initials(name = '') {
  return name.split(' ').map(part => part[0]).slice(0, 2).join('').toUpperCase()
}

export default function AppointmentCommandCard({
  slot,
  patient,
  service,
  activeSlotId,
  onConfirm,
  onStart,
  onOpenRecord,
  onWhatsapp,
  onComplete,
  onReschedule,
  patientSlots = [],
}) {
  const [expanded, setExpanded] = useState(false)
  const [rescheduleOpen, setRescheduleOpen] = useState(false)
  const [nextDate, setNextDate] = useState(slot.date)
  const [nextTime, setNextTime] = useState(slot.time)
  const state = getOperationalState(slot, activeSlotId)
  const stateClass = state.replace(/\s+/g, '-')
  const clinicalHistory = patientSlots.length ? patientSlots : [slot]
  const progress = patient ? calculateClinicalProgress(patient, clinicalHistory) : null
  const patientSessions = patient ? getCompletedSessions(clinicalHistory, patient.id).length : 0
  const isCurrent = ['agora', 'em andamento'].includes(state)

  function handleReschedule() {
    onReschedule(slot, { date: nextDate, time: nextTime, status: 'Agendado' })
    setRescheduleOpen(false)
  }

  return (
    <article className={`appointment-command-card appointment-${stateClass} ${isCurrent ? 'appointment-current' : ''} ${expanded ? 'expanded' : ''}`}>
      <button type="button" className="appointment-main" onClick={() => setExpanded(v => !v)}>
        <div className="appointment-time-block">
          <span>{slot.time}</span>
          <small>{getOperationalLabel(state)}</small>
        </div>
        <div className="appointment-avatar">{initials(patient?.name || 'Paciente')}</div>
        <div className="appointment-copy">
          <div className="appointment-title-row">
            <strong>{patient?.name || 'Paciente'}</strong>
            <span className="badge badge-muted">{slot.status}</span>
          </div>
          <p>{service?.name || 'Serviço'} · {slot.duration}min · {slot.professional}</p>
          <div className="appointment-meta-row">
            <span>Plano: {patientSessions ? `${patientSessions}/10 sessões` : 'avaliação inicial'}</span>
            <span>{progress?.trend || 'Jornada inicial'}</span>
            <span>Evolução {progress?.overall || 0}%</span>
          </div>
          <div className="appointment-therapist-note">
            {slot.notes || patient?.notes || 'Leitura rápida: acolher, revisar resposta da última sessão e registrar evolução.'}
          </div>
        </div>
        <div className="drag-feel" aria-hidden="true">
          <span />
          <span />
        </div>
      </button>

      <div className="appointment-actions">
        {slot.status === 'Agendado' && <button className="btn btn-xs btn-secondary" onClick={() => onConfirm(slot)}>Confirmar presença</button>}
        {slot.status !== 'Realizado' && <button className="btn btn-xs btn-primary" onClick={() => onStart(slot)}>Iniciar cuidado</button>}
        <button className="btn btn-xs btn-secondary" onClick={() => onOpenRecord(slot)}>Ver jornada clínica</button>
        <button className="btn btn-xs btn-whatsapp" onClick={() => onWhatsapp(slot)}>Mensagem pronta</button>
        {slot.status !== 'Realizado' && <button className="btn btn-xs btn-secondary" onClick={() => setRescheduleOpen(v => !v)}>Reagendar</button>}
        {slot.status !== 'Realizado' && <button className="btn btn-xs btn-secondary" onClick={() => onComplete(slot)}>Concluir evolução</button>}
      </div>

      {(expanded || rescheduleOpen) && (
        <div className="appointment-expanded">
          <div>
            <span className="section-kicker">Leitura rápida do terapeuta</span>
            <p>{patient?.notes || 'Paciente sem observações críticas registradas. Confirmar percepção de dor, energia e mobilidade antes da sessão.'}</p>
          </div>
          {rescheduleOpen && (
            <div className="inline-reschedule">
              <input className="form-control" type="date" value={nextDate} onChange={e => setNextDate(e.target.value)} />
              <input className="form-control" type="time" value={nextTime} onChange={e => setNextTime(e.target.value)} />
              <button className="btn btn-sm btn-primary" onClick={handleReschedule}>Aplicar</button>
            </div>
          )}
        </div>
      )}
    </article>
  )
}
