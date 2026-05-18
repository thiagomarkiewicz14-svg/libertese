import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import Modal from '../components/Modal'
import { whatsapp } from '../services/whatsapp'
import { PROFISSIONAIS } from '../domain/constants'
import PremiumReportPreview from '../components/reports/PremiumReportPreview'

function PainScale({ value, onChange }) {
  return (
    <div className="pain-scale">
      {[0,1,2,3,4,5,6,7,8,9,10].map(n => (
        <button key={n} type="button" className={`pain-btn ${value === n ? `active-${n}` : ''}`} onClick={() => onChange(n)}>{n}</button>
      ))}
    </div>
  )
}

function SessionCard({ slot, patient, servico, onEdit, onReport, onOpenReport }) {
  const dorDiff = slot.dorAntes !== null && slot.dorDepois !== null ? slot.dorAntes - slot.dorDepois : null

  return (
    <div className="session-card">
      <div className="session-card-row">
        <div className="session-card-main">
          <div className="session-card-icon" style={{ background: servico?.color + '20', color: servico?.color || 'var(--primary)' }} />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontWeight: 700, fontSize: 14 }}>{patient?.name || 'Paciente'}</span>
              {servico && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 12, background: servico.color + '18', color: servico.color, fontWeight: 600 }}>{servico.name}</span>}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
              {new Date(slot.date + 'T12:00').toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })} · {slot.time} · {slot.professional}
            </div>
            {slot.evolucao && <p style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 8, lineHeight: 1.6 }}>{slot.evolucao.slice(0, 120)}{slot.evolucao.length > 120 ? '...' : ''}</p>}
            {slot.relatorioParaPaciente && (
              <div className="session-report-note">
                Relatório pós-consulta preparado para o paciente.
              </div>
            )}
          </div>
        </div>
        <div className="session-card-actions">
          {dorDiff !== null && (
            <div style={{ textAlign: 'center', padding: '6px 12px', background: dorDiff > 0 ? 'var(--success-light)' : 'var(--surface-2)', borderRadius: 8 }}>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 2 }}>Dor</div>
              <div style={{ fontWeight: 700, fontSize: 14, color: dorDiff > 0 ? 'var(--success)' : 'var(--text-2)' }}>
                {slot.dorAntes} → {slot.dorDepois}
                {dorDiff > 0 && <span style={{ fontSize: 11, marginLeft: 4 }}>↓{dorDiff}</span>}
              </div>
            </div>
          )}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button className="btn btn-xs btn-secondary" onClick={() => onEdit(slot)}>Registrar evolução</button>
            <button
              className="btn btn-xs btn-primary"
              onClick={() => onOpenReport(slot.id)}
              title={slot.postSessionReport ? 'Ver relatório pós-sessão' : 'Criar relatório pós-sessão'}>
              {slot.postSessionReport ? 'Ver relatório ✓' : 'Relatório pós-sessão'}
            </button>
            <button className="btn btn-xs btn-whatsapp" onClick={() => onReport(slot, patient)}>Enviar WhatsApp</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Sessoes() {
  const { agendaSlots, patients, servicos, saveSessionNotes, getPatientById, getServicoById, showToast } = useApp()
  const navigate = useNavigate()
  const [filter, setFilter] = useState('todos')
  const [searchPatient, setSearchPatient] = useState('')
  const [editModal, setEditModal] = useState(null)
  const [reportModal, setReportModal] = useState(null)
  const [notes, setNotes] = useState({})

  const completed = agendaSlots
    .filter(s => s.status === 'Realizado')
    .sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time))

  const availableServiceIds = [...new Set(completed.map(s => s.serviceId))]
  const dynamicFilters = [
    { key: 'todos', label: 'Todos' },
    ...servicos
      .filter(srv => availableServiceIds.includes(srv.id))
      .map(srv => ({ key: srv.id, label: srv.name })),
  ]

  const filterByService = filter === 'todos' ? completed : completed.filter(s => s.serviceId === filter)

  const filtered = !searchPatient.trim() ? filterByService : filterByService.filter(s => {
    const p = getPatientById(s.patientId)
    return p?.name.toLowerCase().includes(searchPatient.toLowerCase())
  })

  function openEdit(slot) {
    setNotes({ notasInternas: slot.notasInternas || '', relatorioParaPaciente: slot.relatorioParaPaciente || '', dorAntes: slot.dorAntes ?? null, dorDepois: slot.dorDepois ?? null, evolucao: slot.evolucao || '', exercicios: slot.exercicios || '', recomendacoes: slot.recomendacoes || '', retorno: slot.retorno || '' })
    setEditModal(slot)
  }

  function handleSaveNotes() {
    saveSessionNotes(editModal.id, notes)
    setEditModal(null)
  }

  function openReport(slot, patient) {
    setReportModal({ slot, patient })
  }

  function handleSendWhatsapp() {
    if (!reportModal) return
    const { slot, patient } = reportModal
    whatsapp.sendSessionReport(patient, { evolucao: slot.evolucao, recomendacoes: slot.recomendacoes, exercicios: slot.exercicios, retorno: slot.retorno })
  }

  function handleMockPdf() {
    showToast('Prévia de PDF preparada para esta sessão.', 'success')
  }

  return (
    <div className="page-body">
      <div className="page-toolbar" style={{ marginBottom: 8 }}>
        <div>
          <div className="section-kicker">Evolução clínica</div>
          <h2 className="page-title">Histórico de sessões</h2>
        </div>
      </div>

      <div className="page-toolbar">
        <div className="toolbar-left">
          <div className="search-bar" style={{ maxWidth: 260, flex: 1 }}>
            <span className="search-icon" />
            <input placeholder="Filtrar por paciente..." value={searchPatient} onChange={e => setSearchPatient(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: 4, background: 'var(--surface-2)', padding: 3, borderRadius: 8, border: '1px solid var(--border)', flexWrap: 'wrap' }}>
            {dynamicFilters.map(f => (
              <button key={f.key} onClick={() => setFilter(f.key)}
                style={{ padding: '5px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 500, transition: 'all 0.12s', background: filter === f.key ? 'var(--surface)' : 'transparent', color: filter === f.key ? 'var(--primary)' : 'var(--text-2)', boxShadow: filter === f.key ? 'var(--shadow-sm)' : 'none' }}>
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-3)' }}>{filtered.length} {filtered.length !== 1 ? 'evoluções' : 'evolução'} registrada{filtered.length !== 1 ? 's' : ''}</div>
      </div>

      <div className="section-kicker" style={{ marginBottom: 14 }}>Histórico clínico de evoluções</div>

      {filtered.length === 0 ? (
        <div className="empty-state" style={{ marginTop: 60 }}>
          <div className="empty-icon" />
          <h3>Nenhuma sessão encontrada</h3>
          <p>Sessões realizadas aparecerão aqui com todas as notas clínicas.</p>
        </div>
      ) : (
        filtered.map(slot => {
          const patient = getPatientById(slot.patientId)
          const servico = getServicoById(slot.serviceId)
          return <SessionCard key={slot.id} slot={slot} patient={patient} servico={servico} onEdit={openEdit} onReport={(s, p) => openReport(s, p)} onOpenReport={id => navigate(`/relatorio-pos-sessao?sessionId=${id}`)} />
        })
      )}

      {/* Notes modal */}
      {editModal && (
        <Modal title="Registrar evolução da sessão" onClose={() => setEditModal(null)} className="modal-lg"
          footer={<><button className="btn btn-secondary" onClick={() => setEditModal(null)}>Cancelar</button><button className="btn btn-primary" onClick={handleSaveNotes}>Salvar evolução</button></>}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 6 }}>
              {getPatientById(editModal.patientId)?.name} · {new Date(editModal.date + 'T12:00').toLocaleDateString('pt-BR')} · {editModal.time}
            </div>
          </div>

          <div className="form-row" style={{ marginBottom: 16 }}>
            <div>
              <div className="form-label" style={{ marginBottom: 6 }}>Dor antes — {notes.dorAntes ?? '—'}/10</div>
              <PainScale value={notes.dorAntes} onChange={v => setNotes(n => ({ ...n, dorAntes: v }))} />
            </div>
            <div>
              <div className="form-label" style={{ marginBottom: 6 }}>Dor depois — {notes.dorDepois ?? '—'}/10</div>
              <PainScale value={notes.dorDepois} onChange={v => setNotes(n => ({ ...n, dorDepois: v }))} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Notas internas (não enviadas ao paciente)</label>
            <textarea className="form-control" rows={3} value={notes.notasInternas}
              onChange={e => setNotes(n => ({ ...n, notasInternas: e.target.value }))}
              placeholder="Observações técnicas para uso interno da clínica..." />
          </div>

          <div className="form-group">
            <label className="form-label">Resumo premium compartilhável</label>
            <textarea className="form-control" rows={3} value={notes.relatorioParaPaciente}
              onChange={e => setNotes(n => ({ ...n, relatorioParaPaciente: e.target.value }))}
              placeholder="Mensagem humana e acolhedora para o relatório do paciente..." />
          </div>

          <div className="form-group">
            <label className="form-label">Evolução clínica</label>
            <textarea className="form-control" rows={3} value={notes.evolucao}
              onChange={e => setNotes(n => ({ ...n, evolucao: e.target.value }))}
              placeholder="Descrição da evolução do paciente nesta sessão..." />
          </div>

          <div className="form-group">
            <label className="form-label">Exercícios para casa (enviados ao paciente)</label>
            <textarea className="form-control" rows={3} value={notes.exercicios}
              onChange={e => setNotes(n => ({ ...n, exercicios: e.target.value }))}
              placeholder="Ex: Cat-Cow 3x10 pela manhã, Respiração diafragmática 5min..." />
          </div>

          <div className="form-group">
            <label className="form-label">Recomendações (enviadas ao paciente)</label>
            <textarea className="form-control" rows={2} value={notes.recomendacoes}
              onChange={e => setNotes(n => ({ ...n, recomendacoes: e.target.value }))}
              placeholder="Cuidados, restrições, orientações pós-sessão..." />
          </div>

          <div className="form-group">
            <label className="form-label">Data de retorno recomendada</label>
            <input className="form-control" type="date" value={notes.retorno}
              onChange={e => setNotes(n => ({ ...n, retorno: e.target.value }))} />
          </div>
        </Modal>
      )}

      {/* Report modal */}
      {reportModal && (
        <Modal title="Gerar relatório da sessão" onClose={() => setReportModal(null)} className="modal-xl"
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setReportModal(null)}>Fechar</button>
              <button className="btn btn-secondary" onClick={() => window.print()}>Imprimir</button>
              <button className="btn btn-secondary" onClick={handleMockPdf}>Exportar PDF</button>
              <button className="btn btn-whatsapp" onClick={handleSendWhatsapp}>
                Enviar via WhatsApp
              </button>
            </>
          }>
          <PremiumReportPreview
            patient={reportModal.patient}
            slot={reportModal.slot}
            service={getServicoById(reportModal.slot.serviceId)}
          />

          <div style={{ padding: '10px 14px', background: 'var(--warning-light)', borderRadius: 8, fontSize: 12, color: 'var(--warning)' }}>
            A mensagem será preparada para envio pelo WhatsApp, preservando revisão humana antes do contato com o paciente.
          </div>
        </Modal>
      )}
    </div>
  )
}
