import { useState } from 'react'
import { useApp } from '../context/AppContext'
import Modal from '../components/Modal'

const EMPTY_FORM = {
  name: '', email: '', phone: '', plan: 'Mensal',
  status: 'Ativo', joinDate: new Date().toISOString().slice(0, 10), notes: ''
}

const PLANS = ['Mensal', 'Trimestral', 'Anual']

export default function Alunos() {
  const { students, addStudent, updateStudent, deleteStudent } = useApp()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('Todos')
  const [modal, setModal] = useState(null) // null | 'add' | 'edit' | 'delete'
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)

  const filtered = students.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      s.phone.includes(search)
    const matchFilter = filter === 'Todos' || s.status === filter || s.plan === filter
    return matchSearch && matchFilter
  })

  function openAdd() {
    setForm(EMPTY_FORM)
    setModal('add')
  }

  function openEdit(s) {
    setSelected(s)
    setForm({ name: s.name, email: s.email, phone: s.phone, plan: s.plan, status: s.status, joinDate: s.joinDate, notes: s.notes || '' })
    setModal('edit')
  }

  function openDelete(s) {
    setSelected(s)
    setModal('delete')
  }

  function closeModal() {
    setModal(null)
    setSelected(null)
  }

  function handleSave() {
    if (!form.name.trim()) return
    if (modal === 'add') addStudent(form)
    else if (modal === 'edit') updateStudent(selected.id, form)
    closeModal()
  }

  function handleDelete() {
    deleteStudent(selected.id)
    closeModal()
  }

  const planBadge = { Mensal: 'badge-purple', Trimestral: 'badge-info', Anual: 'badge-success' }

  return (
    <div className="page-body">
      <div className="page-toolbar">
        <div className="page-toolbar-left">
          <div className="search-bar" style={{ maxWidth: 340, flex: 1 }}>
            <span className="search-icon" />
            <input
              placeholder="Buscar por nome, e-mail ou telefone..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            className="form-control"
            style={{ width: 'auto' }}
            value={filter}
            onChange={e => setFilter(e.target.value)}
          >
            <option value="Todos">Todos</option>
            <option value="Ativo">Ativas</option>
            <option value="Inativo">Inativas</option>
            <option value="Mensal">Mensal</option>
            <option value="Trimestral">Trimestral</option>
            <option value="Anual">Anual</option>
          </select>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          + Nova Aluna
        </button>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            {filtered.length} {filtered.length === 1 ? 'aluna' : 'alunas'}
          </h3>
        </div>
        <div className="table-container">
          {filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon" />
              <h3>Nenhuma aluna encontrada</h3>
              <p>Tente outro filtro ou cadastre uma nova aluna.</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Contato</th>
                  <th>Plano</th>
                  <th>Status</th>
                  <th>Ingresso</th>
                  <th>Obs.</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => (
                  <tr key={s.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="avatar">
                          {s.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{s.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{s.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-2)' }}>{s.phone}</td>
                    <td>
                      <span className={`badge ${planBadge[s.plan] || 'badge-purple'}`}>{s.plan}</span>
                    </td>
                    <td>
                      <span className={`badge badge-${s.status === 'Ativo' ? 'success' : 'danger'}`}>
                        {s.status}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-2)' }}>
                      {new Date(s.joinDate + 'T12:00:00').toLocaleDateString('pt-BR')}
                    </td>
                    <td style={{ color: 'var(--text-2)', fontSize: 13, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.notes || '—'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn-icon btn" title="Editar" onClick={() => openEdit(s)}>Editar</button>
                        <button className="btn-icon btn" title="Excluir" onClick={() => openDelete(s)}>Excluir</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {(modal === 'add' || modal === 'edit') && (
        <Modal
          title={modal === 'add' ? 'Nova Aluna' : 'Editar Aluna'}
          onClose={closeModal}
          footer={
            <>
              <button className="btn btn-secondary" onClick={closeModal}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSave}>
                {modal === 'add' ? 'Cadastrar' : 'Salvar'}
              </button>
            </>
          }
        >
          <div className="form-row">
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Nome completo *</label>
              <input className="form-control" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Nome da aluna" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">E-mail</label>
              <input className="form-control" type="email" value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="aluna@email.com" />
            </div>
            <div className="form-group">
              <label className="form-label">Telefone</label>
              <input className="form-control" value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="(11) 99999-9999" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Plano</label>
              <select className="form-control" value={form.plan}
                onChange={e => setForm(f => ({ ...f, plan: e.target.value }))}>
                {PLANS.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-control" value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                <option>Ativo</option>
                <option>Inativo</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Data de ingresso</label>
            <input className="form-control" type="date" value={form.joinDate}
              onChange={e => setForm(f => ({ ...f, joinDate: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Observações</label>
            <textarea className="form-control" rows={3} value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Lesões, restrições, observações gerais..." />
          </div>
        </Modal>
      )}

      {/* Delete Modal */}
      {modal === 'delete' && selected && (
        <Modal
          title="Remover Aluna"
          onClose={closeModal}
          footer={
            <>
              <button className="btn btn-secondary" onClick={closeModal}>Cancelar</button>
              <button className="btn btn-danger" onClick={handleDelete}>Remover</button>
            </>
          }
        >
          <p style={{ fontSize: 15, color: 'var(--text-2)' }}>
            Tem certeza que deseja remover <strong style={{ color: 'var(--text)' }}>{selected.name}</strong>?
            Esta ação não pode ser desfeita.
          </p>
        </Modal>
      )}
    </div>
  )
}
