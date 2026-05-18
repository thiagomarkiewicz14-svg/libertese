import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { whatsapp } from '../services/whatsapp'
import { TAGS_PACIENTE } from '../domain/constants'
import ClinicalIntelligence from '../components/dashboard/ClinicalIntelligence'

const COLUMNS = [
  { key: 'Ativo', label: 'Ativos', color: 'var(--success)', bg: 'var(--success-light)' },
  { key: 'Em Tratamento', label: 'Em cuidado', color: 'var(--info)', bg: 'var(--info-light)' },
  { key: 'Aguardando Retorno', label: 'Retorno pendente', color: 'var(--warning)', bg: 'var(--warning-light)' },
  { key: 'Inativo', label: 'Inativos', color: 'var(--text-3)', bg: 'var(--surface-3)' },
]

function daysSince(dateStr) {
  if (!dateStr) return null
  return Math.floor((new Date() - new Date(dateStr + 'T12:00')) / 86400000)
}

function PatientCard({ patient, servicos, agendaSlots, onStatusChange, onWhatsapp, onViewProntuario }) {
  const lastSlot = agendaSlots.filter(s => s.patientId === patient.id && s.status === 'Realizado').sort((a, b) => b.date.localeCompare(a.date))[0]
  const nextSlot = agendaSlots.filter(s => s.patientId === patient.id && ['Agendado', 'Confirmado'].includes(s.status) && s.date >= new Date().toISOString().slice(0, 10)).sort((a, b) => a.date.localeCompare(b.date))[0]
  const noShows = agendaSlots.filter(s => s.patientId === patient.id && s.status === 'Falta').length
  const days = lastSlot ? daysSince(lastSlot.date) : null
  const initials = patient.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
  const srv = servicos.find(s => s.id === patient.primaryService)

  return (
    <div className="crm-card">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <div className="avatar avatar-sm">{initials}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{patient.name}</div>
          {srv && <div style={{ fontSize: 11, color: srv.color, fontWeight: 500 }}>{srv.name}</div>}
        </div>
      </div>

      {(patient.tags || []).length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
          {patient.tags.map(t => <span key={t} className="tag-pill">{t}</span>)}
        </div>
      )}

      <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginBottom: 8 }}>
        {days !== null ? (
          <span style={{ color: days > 30 ? 'var(--danger)' : days > 14 ? 'var(--warning)' : 'var(--text-3)' }}>
            Última sessão: {days === 0 ? 'hoje' : `${days}d atrás`}
          </span>
        ) : <span>Sem sessões</span>}
        {nextSlot && <span> · Próxima: {new Date(nextSlot.date + 'T12:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}</span>}
        {noShows > 0 && <span style={{ color: 'var(--danger)' }}> · {noShows} falta{noShows > 1 ? 's' : ''}</span>}
      </div>

      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
        <button className="btn btn-xs btn-secondary" onClick={() => onViewProntuario(patient.id)}>Jornada clínica</button>
        <button className="btn btn-xs btn-whatsapp" onClick={() => onWhatsapp(patient, lastSlot)}>Mensagem pronta</button>
        <select style={{ fontSize: 11, padding: '3px 6px', border: '1px solid var(--border)', borderRadius: 5, background: 'var(--surface)', color: 'var(--text-2)', cursor: 'pointer' }}
          value={patient.status} onChange={e => onStatusChange(patient.id, e.target.value)}>
          <option value="Ativo">Ativo</option>
          <option value="Em Tratamento">Em Tratamento</option>
          <option value="Aguardando Retorno">Ag. Retorno</option>
          <option value="Inativo">Inativo</option>
        </select>
      </div>
    </div>
  )
}

export default function CRM() {
  const { patients, agendaSlots, servicos, updatePatient, showToast } = useApp()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  const filteredPatients = !search.trim() ? patients : patients.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || (p.tags || []).some(t => t.toLowerCase().includes(search.toLowerCase())))

  function handleStatusChange(id, status) {
    updatePatient(id, { status })
  }

  function handleWhatsapp(patient, lastSlot) {
    if (patient.status === 'Aguardando Retorno' || patient.status === 'Inativo') {
      const days = lastSlot ? daysSince(lastSlot.date) : null
      whatsapp.sendReturnReminder(patient, days || 30)
    } else {
      showToast(`Mensagem preparada para ${patient.name}`, 'success')
    }
  }

  function daysSince(dateStr) {
    if (!dateStr) return null
    return Math.floor((new Date() - new Date(dateStr + 'T12:00')) / 86400000)
  }

  return (
    <div className="page-body">
      <div className="page-toolbar" style={{ marginBottom: 8 }}>
        <div>
          <div className="section-kicker">Relacionamento clínico</div>
          <h2 className="page-title">Jornadas em acompanhamento</h2>
        </div>
      </div>
      <div className="page-toolbar" style={{ marginBottom: 20 }}>
        <div className="toolbar-left">
          <div className="search-bar" style={{ maxWidth: 300 }}>
            <span className="search-icon" />
            <input placeholder="Buscar paciente, tag ou oportunidade..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-3)' }}>
          {patients.length} jornadas · {patients.filter(p => p.status === 'Ativo' || p.status === 'Em Tratamento').length} em cuidado ativo
        </div>
      </div>

      <ClinicalIntelligence
        patients={patients}
        slots={agendaSlots}
        onOpenPatient={id => navigate(`/prontuario/${id}`)}
      />

      <div className="crm-board">
        {COLUMNS.map(col => {
          const colPatients = filteredPatients.filter(p => p.status === col.key)
          return (
            <div key={col.key} className="crm-column">
              <div className="crm-col-header" style={{ color: col.color }}>
                <span>{col.label}</span>
                <span className="crm-col-count" style={{ background: col.bg, color: col.color }}>{colPatients.length}</span>
              </div>
              {colPatients.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 8px', fontSize: 12, color: 'var(--text-3)' }}>
                  Sem pacientes nesta etapa
                </div>
              ) : (
                colPatients.map(p => (
                  <PatientCard key={p.id} patient={p} servicos={servicos} agendaSlots={agendaSlots}
                    onStatusChange={handleStatusChange}
                    onWhatsapp={handleWhatsapp}
                    onViewProntuario={id => navigate(`/prontuario/${id}`)} />
                ))
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
