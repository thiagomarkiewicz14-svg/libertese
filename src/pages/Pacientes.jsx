import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import Modal from '../components/Modal'
import { STATUS_PACIENTE, STATUS_PACIENTE_COLOR, TAGS_PACIENTE, ORIGENS } from '../domain/constants'

const EMPTY = {
  name: '', email: '', phone: '', birthDate: '', gender: 'F',
  status: 'Ativo', tags: [], origin: '', joinDate: new Date().toISOString().slice(0, 10),
  notes: '', primaryService: '', planId: '',
}

function Initials({ name }) {
  const parts = name.trim().split(' ')
  return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase()
}

function StatusBadge({ status }) {
  const map = { 'Ativo': 'badge-success', 'Em Tratamento': 'badge-info', 'Aguardando Retorno': 'badge-warning', 'Inativo': 'badge-muted' }
  return <span className={`badge ${map[status] || 'badge-muted'}`}>{status}</span>
}

export default function Pacientes() {
  const { patients, servicos, plans, agendaSlots, addPatient, updatePatient, deletePatient } = useApp()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('Todos')
  const [modal, setModal] = useState(null)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(EMPTY)

  const filtered = patients.filter(p => {
    const q = search.toLowerCase()
    const matchQ = !q || p.name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q) || p.phone.includes(q)
    const matchS = filterStatus === 'Todos' || p.status === filterStatus
    return matchQ && matchS
  })

  function openAdd() { setForm({ ...EMPTY }); setSelected(null); setModal('form') }
  function openEdit(p) { setSelected(p); setForm({ name: p.name, email: p.email, phone: p.phone, birthDate: p.birthDate || '', gender: p.gender || 'F', status: p.status, tags: p.tags || [], origin: p.origin || '', joinDate: p.joinDate, notes: p.notes || '', primaryService: p.primaryService || '', planId: p.planId || '' }); setModal('form') }
  function openDelete(p) { setSelected(p); setModal('delete') }
  function close() { setModal(null); setSelected(null) }

  function handleSave() {
    if (!form.name.trim()) return
    if (selected) updatePatient(selected.id, form)
    else addPatient(form)
    close()
  }

  function toggleTag(tag) {
    setForm(f => ({ ...f, tags: f.tags.includes(tag) ? f.tags.filter(t => t !== tag) : [...f.tags, tag] }))
  }

  const serviceMap = Object.fromEntries(servicos.map(s => [s.id, s]))

  function nextSlotFor(patientId) {
    const today = new Date().toISOString().slice(0, 10)
    return agendaSlots
      .filter(s => s.patientId === patientId && s.date >= today && ['Agendado', 'Confirmado'].includes(s.status))
      .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))[0]
  }

  return (
    <div className="page-body">
      <div className="page-toolbar">
        <div className="toolbar-left">
          <div className="search-bar" style={{ maxWidth: 320, flex: 1 }}>
            <span className="search-icon" />
            <input placeholder="Buscar paciente..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="form-control" style={{ width: 'auto' }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="Todos">Todos os status</option>
            {STATUS_PACIENTE.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="toolbar-right">
          <button className="btn btn-primary" onClick={openAdd}>Registrar paciente</button>
        </div>
      </div>

      {/* Summary row */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        {STATUS_PACIENTE.map(s => {
          const count = patients.filter(p => p.status === s).length
          const colors = { 'Ativo': 'success', 'Em Tratamento': 'info', 'Aguardando Retorno': 'warning', 'Inativo': 'muted' }
          return (
            <button key={s} onClick={() => setFilterStatus(filterStatus === s ? 'Todos' : s)}
              style={{ padding: '6px 14px', borderRadius: 20, border: `1.5px solid var(--border)`, background: filterStatus === s ? 'var(--primary)' : 'var(--surface)', color: filterStatus === s ? '#fff' : 'var(--text-2)', fontSize: 12, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s' }}>
              {s} <span style={{ marginLeft: 4, opacity: 0.7 }}>{count}</span>
            </button>
          )
        })}
      </div>

      <section className="patient-directory-shell">
        <div className="patient-directory-head">
          <div>
            <div className="section-kicker">Jornadas clínicas</div>
            <h3>Pacientes acompanhados</h3>
            <p>{filtered.length} de {patients.length} pacientes com contexto de cuidado, retorno e vínculo.</p>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state"><div className="empty-icon" /><h3>Nenhum paciente encontrado</h3><p>Ajuste o filtro ou registre uma nova jornada clínica.</p></div>
        ) : (
          <div className="patient-catalog-grid">
            {filtered.map(p => {
              const next = nextSlotFor(p.id)
              const service = p.primaryService ? serviceMap[p.primaryService] : null
              const completed = agendaSlots.filter(s => s.patientId === p.id && s.status === 'Realizado').length
              return (
                <article key={p.id} className="patient-directory-card">
                  <div className="patient-card-top">
                    <div className="avatar"><Initials name={p.name} /></div>
                    <div>
                      <strong>{p.name}</strong>
                      <span>{p.email || p.phone}</span>
                    </div>
                    <StatusBadge status={p.status} />
                  </div>

                  <div className="patient-clinical-strip">
                    <div>
                      <span>Serviço principal</span>
                      <strong style={{ color: service?.color || 'var(--olive-700)' }}>{service?.name || 'A definir'}</strong>
                    </div>
                    <div>
                      <span>Sessões</span>
                      <strong>{completed}</strong>
                    </div>
                    <div>
                      <span>Próximo cuidado</span>
                      <strong>{next ? `${new Date(next.date + 'T12:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })} · ${next.time}` : 'Sem retorno'}</strong>
                    </div>
                  </div>

                  <div className="patient-tag-row">
                    {(p.tags || []).length
                      ? p.tags.map(t => <span key={t} className="tag-pill">{t}</span>)
                      : <span className="tag-pill">Jornada em construção</span>}
                  </div>

                  <p className="patient-card-note">{p.notes || 'Sem observações críticas registradas. Atualize o prontuário para enriquecer a jornada.'}</p>

                  <div className="patient-card-actions">
                    <button className="btn btn-xs btn-primary" onClick={() => navigate(`/prontuario/${p.id}`)}>Ver jornada clínica</button>
                    <button className="btn btn-ghost btn-xs" onClick={() => navigate(`/area-paciente?patient=${p.id}`)}>Portal premium</button>
                    <button className="btn btn-ghost btn-xs" onClick={() => openEdit(p)}>Ajustar cadastro</button>
                    <button className="btn btn-ghost btn-xs" onClick={() => openDelete(p)}>Remover</button>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>

      {/* Form modal */}
      {modal === 'form' && (
        <Modal title={selected ? 'Ajustar Paciente' : 'Nova Jornada Clínica'} onClose={close}
          footer={<><button className="btn btn-secondary" onClick={close}>Cancelar</button><button className="btn btn-primary" onClick={handleSave}>{selected ? 'Salvar jornada' : 'Registrar jornada'}</button></>}>
          <div className="form-group" style={{ gridColumn: '1/-1' }}>
            <label className="form-label">Nome completo *</label>
            <input className="form-control" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nome do paciente" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">E-mail</label>
              <input className="form-control" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@exemplo.com" />
            </div>
            <div className="form-group">
              <label className="form-label">Telefone / WhatsApp</label>
              <input className="form-control" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="(11) 99999-9999" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Data de nascimento</label>
              <input className="form-control" type="date" value={form.birthDate} onChange={e => setForm(f => ({ ...f, birthDate: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Gênero</label>
              <select className="form-control" value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}>
                <option value="F">Feminino</option><option value="M">Masculino</option><option value="O">Outro</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Serviço principal</label>
              <select className="form-control" value={form.primaryService} onChange={e => setForm(f => ({ ...f, primaryService: e.target.value }))}>
                <option value="">Selecione...</option>
                {servicos.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-control" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                {STATUS_PACIENTE.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Protocolo terapêutico vinculado</label>
            <select className="form-control" value={form.planId} onChange={e => setForm(f => ({ ...f, planId: e.target.value }))}>
              <option value="">Sem protocolo vinculado</option>
              {plans.map(pl => <option key={pl.id} value={pl.id}>{pl.name} · {pl.level} · {pl.sessions} sessões</option>)}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Origem</label>
              <select className="form-control" value={form.origin} onChange={e => setForm(f => ({ ...f, origin: e.target.value }))}>
                <option value="">Selecione...</option>
                {ORIGENS.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Data de ingresso</label>
              <input className="form-control" type="date" value={form.joinDate} onChange={e => setForm(f => ({ ...f, joinDate: e.target.value }))} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Tags</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {TAGS_PACIENTE.map(tag => (
                <button key={tag} type="button" onClick={() => toggleTag(tag)}
                  style={{ padding: '4px 10px', borderRadius: 14, border: '1.5px solid', cursor: 'pointer', fontSize: 12, fontWeight: 500, transition: 'all 0.12s', background: form.tags.includes(tag) ? 'var(--gold)' : 'var(--surface)', borderColor: form.tags.includes(tag) ? 'var(--gold)' : 'var(--border)', color: form.tags.includes(tag) ? '#fff' : 'var(--text-2)' }}>
                  {tag}
                </button>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Observações clínicas</label>
            <textarea className="form-control" rows={3} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Lesões, restrições, observações importantes..." />
          </div>
        </Modal>
      )}

      {modal === 'delete' && selected && (
        <Modal title="Remover Paciente" onClose={close}
          footer={<><button className="btn btn-secondary" onClick={close}>Cancelar</button><button className="btn btn-danger" onClick={() => { deletePatient(selected.id); close() }}>Confirmar remoção</button></>}>
          <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.7 }}>
            Tem certeza que deseja remover <strong style={{ color: 'var(--text)' }}>{selected?.name}</strong>?<br />
            <span style={{ fontSize: 12, color: 'var(--danger)' }}>Esta ação removerá o cadastro mas não apagará o prontuário.</span>
          </p>
        </Modal>
      )}
    </div>
  )
}
