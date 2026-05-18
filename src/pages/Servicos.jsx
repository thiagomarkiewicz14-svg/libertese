import { useState } from 'react'
import { useApp } from '../context/AppContext'
import Modal from '../components/Modal'

const COLORS = ['#2D7A5F', '#1E3A5F', '#7A4F8A', '#C47A3A', '#A83228', '#1A5C8A', '#2A6E47', '#8A5A1E']

const EMPTY = { name: '', color: '#2D7A5F', duration: 60, value: 150, description: '', category: '' }

function currency(v) { return `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` }

export default function Servicos() {
  const { servicos, agendaSlots, addServico, updateServico, deleteServico } = useApp()
  const [modal, setModal] = useState(null)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(EMPTY)

  function openAdd() { setForm({ ...EMPTY }); setSelected(null); setModal('form') }
  function openEdit(s) { setSelected(s); setForm({ name: s.name, color: s.color, duration: s.duration, value: s.value, description: s.description || '', category: s.category || '' }); setModal('form') }
  function close() { setModal(null); setSelected(null) }

  function handleSave() {
    if (!form.name.trim()) return
    const data = { ...form, duration: Number(form.duration), value: Number(form.value) }
    if (selected) updateServico(selected.id, data)
    else addServico(data)
    close()
  }

  function sessionCount(serviceId) {
    return agendaSlots.filter(s => s.serviceId === serviceId && s.status === 'Realizado').length
  }

  return (
    <div className="page-body">
      <div className="page-toolbar">
        <div style={{ fontSize: 14, color: 'var(--text-2)' }}>
          {servicos.length} serviços cadastrados
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Novo Serviço</button>
      </div>

      {servicos.length === 0 ? (
        <div className="empty-state" style={{ marginTop: 60 }}>
          <div className="empty-icon" />
          <h3>Nenhum serviço cadastrado</h3>
          <p>Cadastre os serviços oferecidos pela clínica.</p>
        </div>
      ) : (
        <div className="servicos-grid">
          {servicos.map(srv => {
            const count = sessionCount(srv.id)
            return (
              <div key={srv.id} className="servico-card">
                <div className="servico-banner" style={{ background: srv.color }} />
                <div className="servico-body">
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div>
                      {srv.category && <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: srv.color, marginBottom: 5 }}>{srv.category}</div>}
                      <h3 style={{ fontSize: 17, color: 'var(--text)' }}>{srv.name}</h3>
                      <span className="badge badge-success" style={{ marginTop: 10 }}>Ativo</span>
                    </div>
                    <div className="service-mark" style={{ color: srv.color }}>{srv.name.slice(0, 2).toUpperCase()}</div>
                  </div>

                  {srv.description && (
                    <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6, marginBottom: 16 }}>{srv.description}</p>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
                    {[
                      ['Duração', `${srv.duration}min`],
                      ['Valor', currency(srv.value)],
                      ['Sessões', `${count} realizada${count !== 1 ? 's' : ''}`],
                    ].map(([label, val]) => (
                      <div key={label} style={{ textAlign: 'center', padding: '8px', background: 'var(--surface-2)', borderRadius: 8 }}>
                        <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 3 }}>{label}</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{val}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-sm btn-secondary" style={{ flex: 1 }} onClick={() => openEdit(srv)}>Editar</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => { if (window.confirm(`Excluir "${srv.name}"?`)) deleteServico(srv.id) }}>Remover</button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {modal === 'form' && (
        <Modal title={selected ? 'Editar Serviço' : 'Novo Serviço'} onClose={close}
          footer={<><button className="btn btn-secondary" onClick={close}>Cancelar</button><button className="btn btn-primary" onClick={handleSave}>{selected ? 'Salvar' : 'Criar'}</button></>}>
          <div className="form-group">
            <label className="form-label">Nome do serviço *</label>
            <input className="form-control" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Pilates Reformer" />
          </div>
          <div className="form-group">
            <label className="form-label">Descrição</label>
            <textarea className="form-control" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Descreva o serviço..." />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Categoria</label>
              <input className="form-control" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="Ex: Reabilitação" />
            </div>
            <div className="form-group">
              <label className="form-label">Duração (min)</label>
              <input className="form-control" type="number" min={15} value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Valor (R$)</label>
            <input className="form-control" type="number" min={0} step={10} value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Cor de identificação</label>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {COLORS.map(c => (
                <button key={c} type="button" onClick={() => setForm(f => ({ ...f, color: c }))}
                  style={{ width: 32, height: 32, borderRadius: '50%', background: c, border: 'none', cursor: 'pointer', outline: form.color === c ? '3px solid var(--text)' : '3px solid transparent', outlineOffset: 2, transition: 'outline 0.12s' }} />
              ))}
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
