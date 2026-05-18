import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import BeforeAfterBodyMap from '../components/reports/BeforeAfterBodyMap'
import { formatDate } from '../domain/clinical'

const EMPTY_BODY_MAP = { areas: {}, mobilityNotes: '', generalScore: 5 }
const EMPTY_REPORT = {
  responsibleProfessionalId: '',
  sessionSummary: '',
  patientFeedback: '',
  clinicalFindings: '',
  conductApplied: '',
  recommendations: '',
  homeCare: '',
  nextSessionFocus: '',
  beforeBodyMap: EMPTY_BODY_MAP,
  afterBodyMap: EMPTY_BODY_MAP,
  createdAt: '',
  updatedAt: '',
}

// ── Inline report document — used in preview card and print area ─────────────
function ReportDocument({ slot, patient, service, professional, room, report }) {
  const profName = professional?.name || slot?.professional || '—'
  const roomLabel = room ? `Sala ${room.number} — ${room.name}` : '—'

  const sections = [
    { key: 'sessionSummary', label: 'Resumo terapêutico' },
    { key: 'patientFeedback', label: 'Percepção do paciente' },
    { key: 'clinicalFindings', label: 'Achados clínicos' },
    { key: 'conductApplied', label: 'Conduta aplicada' },
    { key: 'recommendations', label: 'Recomendações clínicas' },
    { key: 'homeCare', label: 'Orientações para casa' },
    { key: 'nextSessionFocus', label: 'Próximo foco clínico' },
  ]

  return (
    <div style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}>
      {/* Report header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 24, paddingBottom: 20, borderBottom: '2px solid var(--primary)', flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <img src="/brand/libertese-logo.jpeg" alt="Liberte-se" style={{ height: 32, width: 'auto', objectFit: 'contain' }} />
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', letterSpacing: '0.07em', textTransform: 'uppercase', fontWeight: 600 }}>
            Relatório Pós-Sessão
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>{patient?.name}</div>
          <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 3 }}>
            {formatDate(slot?.date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · {slot?.time}
          </div>
        </div>
      </div>

      {/* Meta grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginBottom: 24 }}>
        {[
          ['Serviço', service?.name || '—'],
          ['Duração', slot?.duration ? `${slot.duration} min` : '—'],
          ['Profissional', profName],
          ['Sala', roomLabel],
          ['Status', slot?.status || '—'],
        ].map(([label, value]) => (
          <div key={label} style={{ padding: '10px 14px', background: 'var(--surface-2)', borderRadius: 10 }}>
            <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Report sections */}
      <div style={{ display: 'grid', gap: 14 }}>
        {sections.map(({ key, label }) => {
          const text = report[key]
          if (!text) return null
          return (
            <div key={key} style={{ padding: '14px 18px', background: 'var(--surface-2)', borderRadius: 12, borderLeft: '3px solid var(--primary)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--primary)', marginBottom: 6 }}>{label}</div>
              <div style={{ fontSize: 14, lineHeight: 1.65, color: 'var(--text)', whiteSpace: 'pre-wrap' }}>{text}</div>
            </div>
          )
        })}
      </div>

      {/* Body map summary */}
      {(report.beforeBodyMap || report.afterBodyMap) && (
        <div style={{ marginTop: 22 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-3)', marginBottom: 14 }}>
            Mapa corporal
          </div>
          <BeforeAfterBodyMap
            beforeMap={report.beforeBodyMap}
            afterMap={report.afterBodyMap}
            readOnly
          />
        </div>
      )}

      {/* Footer */}
      <div style={{ marginTop: 28, paddingTop: 16, borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-3)' }}>
        <span>Liberte-se — Pilates · Osteopatia · Movimento consciente</span>
        <span>Gerado em {new Date().toLocaleDateString('pt-BR')}</span>
      </div>
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function RelatorioPosSessao() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const {
    agendaSlots, patients, servicos, professionals, rooms,
    savePostSessionReport,
    getPatientById, getServicoById, getProfessionalById, getRoomById,
    showToast,
  } = useApp()

  const sessionIdFromUrl = searchParams.get('sessionId')

  const [selectedSlotId, setSelectedSlotId] = useState(sessionIdFromUrl || '')
  const [selectedPatientId, setSelectedPatientId] = useState('')
  const [report, setReport] = useState(EMPTY_REPORT)
  const [saved, setSaved] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  // Sync when URL param changes (e.g. navigating from Sessões to another session)
  useEffect(() => {
    if (sessionIdFromUrl && sessionIdFromUrl !== selectedSlotId) {
      setSelectedSlotId(sessionIdFromUrl)
    }
  }, [sessionIdFromUrl])

  const slot = agendaSlots.find(s => s.id === selectedSlotId) || null
  const patient = slot ? getPatientById(slot.patientId) : null
  const service = slot ? getServicoById(slot.serviceId) : null
  const room = slot ? getRoomById(slot.roomId) : null
  const professional = slot
    ? (getProfessionalById(report.responsibleProfessionalId || slot.professionalId) || null)
    : null

  const patientSlots = selectedPatientId
    ? agendaSlots
        .filter(s => s.status === 'Realizado' && s.patientId === selectedPatientId)
        .sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time))
    : []

  useEffect(() => {
    if (!slot) {
      setReport(EMPTY_REPORT)
      setSaved(false)
      return
    }
    setSelectedPatientId(slot.patientId)
    if (slot.postSessionReport) {
      setReport({ ...EMPTY_REPORT, ...slot.postSessionReport })
      setSaved(true)
    } else {
      setReport({
        ...EMPTY_REPORT,
        responsibleProfessionalId: slot.professionalId || '',
        sessionSummary: slot.evolucao || '',
        recommendations: slot.recomendacoes || '',
        homeCare: slot.exercicios || '',
      })
      setSaved(false)
    }
  }, [selectedSlotId])

  function set(key, value) {
    setReport(r => ({ ...r, [key]: value }))
    setSaved(false)
  }

  function handleSave() {
    if (!slot) return
    savePostSessionReport(slot.id, report)
    setSaved(true)
  }

  function handlePrint() {
    window.print()
  }

  async function handleWhatsApp() {
    if (!slot || !patient) return
    const profName = professional?.name || slot.professional || 'Equipe Liberte-se'
    const parts = [
      `*Relatório Pós-Sessão — Liberte-se*`,
      ``,
      `Olá, ${patient.name.split(' ')[0]}! Segue o resumo da sua sessão de hoje.`,
      ``,
      `*Sessão:* ${service?.name || 'Atendimento'} — ${formatDate(slot.date)} às ${slot.time}`,
      `*Profissional:* ${profName}`,
    ]
    if (report.sessionSummary) parts.push(``, `*Resumo:*`, report.sessionSummary)
    if (report.recommendations) parts.push(``, `*Recomendações:*`, report.recommendations)
    if (report.homeCare) parts.push(``, `*Orientações para casa:*`, report.homeCare)
    if (report.nextSessionFocus) parts.push(``, `*Próxima sessão — foco:*`, report.nextSessionFocus)
    parts.push(``, `Com carinho, equipe Liberte-se ✨`)

    const text = parts.join('\n')
    try {
      await navigator.clipboard.writeText(text)
      showToast('Texto copiado! Cole no WhatsApp.', 'success')
    } catch {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
    }
  }

  const hasContent = !!(report.sessionSummary || report.conductApplied || report.recommendations || report.homeCare)

  return (
    <div className="page-body">

      {/* Toolbar */}
      <div className="page-toolbar no-print">
        <div>
          <div className="section-kicker">Documentação clínica</div>
          <h2 className="page-title">Relatório pós-sessão</h2>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {slot && (
            <button className="btn btn-ghost btn-sm" onClick={() => setShowPreview(v => !v)}>
              {showPreview ? 'Ocultar prévia' : 'Ver prévia do documento'}
            </button>
          )}
          {slot && (
            <button className="btn btn-primary" onClick={handleSave}>
              {saved ? '✓ Salvo' : 'Salvar relatório'}
            </button>
          )}
        </div>
      </div>

      {/* Session selector (only when no URL param) */}
      {!sessionIdFromUrl && (
        <div className="card no-print" style={{ marginBottom: 18 }}>
          <div className="card-header">
            <h3 className="card-title">Selecionar sessão</h3>
            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Sessões com ✓ já possuem relatório</span>
          </div>
          <div className="card-body">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Paciente</label>
                <select className="form-control" value={selectedPatientId}
                  onChange={e => { setSelectedPatientId(e.target.value); setSelectedSlotId('') }}>
                  <option value="">Selecione o paciente...</option>
                  {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Sessão realizada</label>
                <select className="form-control" value={selectedSlotId}
                  onChange={e => setSelectedSlotId(e.target.value)}
                  disabled={!selectedPatientId}>
                  <option value="">Selecione a sessão...</option>
                  {patientSlots.map(s => {
                    const srv = getServicoById(s.serviceId)
                    return (
                      <option key={s.id} value={s.id}>
                        {formatDate(s.date)} · {s.time} · {srv?.name || 'Serviço'}{s.postSessionReport ? ' ✓' : ''}
                      </option>
                    )
                  })}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {!slot && (
        <div className="empty-state no-print" style={{ marginTop: 40 }}>
          <div className="empty-icon" />
          <h3>Nenhuma sessão selecionada</h3>
          <p>Selecione uma sessão realizada para criar ou editar o relatório pós-sessão.</p>
          <button className="btn btn-secondary btn-sm" style={{ marginTop: 14 }} onClick={() => navigate('/sessoes')}>
            Ver histórico de sessões
          </button>
        </div>
      )}

      {slot && (
        <>
          {/* Session info card */}
          <div className="card no-print" style={{ marginBottom: 16 }}>
            <div style={{ padding: '18px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
              <div>
                <div className="section-kicker">{service?.name || 'Atendimento'}</div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600, margin: '4px 0' }}>
                  {patient?.name}
                </h3>
                <div style={{ fontSize: 13, color: 'var(--text-3)' }}>
                  {formatDate(slot.date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · {slot.time}
                  {slot.duration ? ` · ${slot.duration} min` : ''}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {(() => {
                  const p = getProfessionalById(slot.professionalId)
                  return p ? (
                    <div style={{ padding: '8px 14px', background: p.color + '15', borderRadius: 10, border: `1px solid ${p.color}30` }}>
                      <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Profissional</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: p.color }}>{p.name}</div>
                    </div>
                  ) : null
                })()}
                {room && (
                  <div style={{ padding: '8px 14px', background: 'var(--surface-2)', borderRadius: 10, border: '1px solid var(--border-light)' }}>
                    <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Sala</div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>Sala {room.number}</div>
                  </div>
                )}
                {slot.postSessionReport && (
                  <div style={{ padding: '8px 14px', background: '#e8f5ee', borderRadius: 10, border: '1px solid #2A6E4740' }}>
                    <div style={{ fontSize: 10, color: 'var(--success)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Relatório</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--success)' }}>Registrado</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Therapeutic report form */}
          <div className="card no-print" style={{ marginBottom: 16 }}>
            <div className="card-header">
              <h3 className="card-title">Registro terapêutico</h3>
              <select
                className="form-control"
                value={report.responsibleProfessionalId}
                onChange={e => set('responsibleProfessionalId', e.target.value)}
                style={{ maxWidth: 240 }}>
                <option value="">Responsável pelo relatório...</option>
                {professionals.filter(p => p.active).map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="card-body">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Resumo terapêutico</label>
                  <textarea className="form-control" rows={3}
                    value={report.sessionSummary}
                    onChange={e => set('sessionSummary', e.target.value)}
                    placeholder="Como foi a sessão — contexto, objetivo, resposta geral..." />
                </div>
                <div className="form-group">
                  <label className="form-label">Percepção do paciente</label>
                  <textarea className="form-control" rows={3}
                    value={report.patientFeedback}
                    onChange={e => set('patientFeedback', e.target.value)}
                    placeholder="O que o paciente relatou antes, durante e após a sessão..." />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Achados clínicos</label>
                  <textarea className="form-control" rows={3}
                    value={report.clinicalFindings}
                    onChange={e => set('clinicalFindings', e.target.value)}
                    placeholder="Tensão, restrição de mobilidade, compensações observadas..." />
                </div>
                <div className="form-group">
                  <label className="form-label">Conduta aplicada</label>
                  <textarea className="form-control" rows={3}
                    value={report.conductApplied}
                    onChange={e => set('conductApplied', e.target.value)}
                    placeholder="Técnicas utilizadas, aparelhos, protocolo seguido..." />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Recomendações clínicas</label>
                  <textarea className="form-control" rows={3}
                    value={report.recommendations}
                    onChange={e => set('recommendations', e.target.value)}
                    placeholder="Cuidados pós-sessão, restrições, observações..." />
                </div>
                <div className="form-group">
                  <label className="form-label">Orientações para casa</label>
                  <textarea className="form-control" rows={3}
                    value={report.homeCare}
                    onChange={e => set('homeCare', e.target.value)}
                    placeholder="Exercícios, aplicações, hábitos, ajustes de rotina..." />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Próximo foco clínico</label>
                <textarea className="form-control" rows={2}
                  value={report.nextSessionFocus}
                  onChange={e => set('nextSessionFocus', e.target.value)}
                  placeholder="O que será trabalhado na próxima sessão..." />
              </div>
            </div>
          </div>

          {/* Body maps */}
          <div className="card no-print" style={{ marginBottom: 16 }}>
            <div className="card-header">
              <h3 className="card-title">Mapa corporal — Antes e Depois</h3>
              <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
                Selecione uma região para ajustar a intensidade
              </span>
            </div>
            <div className="card-body">
              <BeforeAfterBodyMap
                beforeMap={report.beforeBodyMap}
                afterMap={report.afterBodyMap}
                onBeforeChange={v => set('beforeBodyMap', v)}
                onAfterChange={v => set('afterBodyMap', v)}
              />
            </div>
          </div>

          {/* Preview card */}
          {(showPreview || hasContent) && (
            <div className="card no-print" style={{ marginBottom: 16 }}>
              <div className="card-header">
                <h3 className="card-title">Prévia do documento</h3>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-secondary btn-sm" onClick={handleWhatsApp}>
                    Compartilhar WhatsApp
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={handlePrint}>
                    Imprimir / Salvar PDF
                  </button>
                </div>
              </div>
              <div className="card-body">
                <div style={{ padding: '24px 28px', background: '#fffcff', borderRadius: 14, border: '1px solid var(--border-light)' }}>
                  <ReportDocument
                    slot={slot}
                    patient={patient}
                    service={service}
                    professional={professional}
                    room={room}
                    report={report}
                  />
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Print-only area — hidden on screen, full page on print */}
      <div className="report-print-area">
        {slot && patient && (
          <div style={{ padding: '32px 40px', background: '#fff', minHeight: '100vh' }}>
            <ReportDocument
              slot={slot}
              patient={patient}
              service={service}
              professional={professional}
              room={room}
              report={report}
            />
          </div>
        )}
      </div>
    </div>
  )
}
