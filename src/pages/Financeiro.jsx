import { useState } from 'react'
import { useApp } from '../context/AppContext'
import Modal from '../components/Modal'
import { FORMAS_PAGAMENTO, STATUS_FINANCEIRO, CATEGORIAS_DESPESA } from '../domain/constants'

const EMPTY = { type: 'Entrada', category: '', description: '', value: '', date: new Date().toISOString().slice(0, 10), paymentMethod: 'Pix', status: 'Pago', patientId: null }

function currency(v) { return `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` }

export default function Financeiro() {
  const { financeiro, patients, addTransacao, updateTransacao, deleteTransacao, servicos } = useApp()
  const [tab, setTab] = useState('resumo')
  const [filter, setFilter] = useState('todos')
  const [modal, setModal] = useState(null)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(EMPTY)

  const now = new Date()
  const thisMonth = now.toISOString().slice(0, 7)
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 7)

  const thisMonthData = financeiro.filter(t => t.date.startsWith(thisMonth))
  const lastMonthData = financeiro.filter(t => t.date.startsWith(lastMonth))

  const sumBy = (data, type, status) => data.filter(t => t.type === type && (!status || t.status === status)).reduce((s, t) => s + Number(t.value), 0)

  const receita = sumBy(thisMonthData, 'Entrada', 'Pago')
  const despesas = sumBy(thisMonthData, 'Saída', 'Pago')
  const lucro = receita - despesas
  const pendentes = sumBy(thisMonthData, 'Entrada', 'Pendente')

  const lastReceita = sumBy(lastMonthData, 'Entrada', 'Pago')
  const growth = lastReceita > 0 ? ((receita - lastReceita) / lastReceita * 100) : null

  const filtered = financeiro.filter(t => {
    if (filter === 'entradas') return t.type === 'Entrada'
    if (filter === 'saidas') return t.type === 'Saída'
    if (filter === 'pendentes') return t.status === 'Pendente'
    return true
  }).sort((a, b) => b.date.localeCompare(a.date))

  function openAdd() { setForm({ ...EMPTY }); setSelected(null); setModal('form') }
  function openEdit(t) { setSelected(t); setForm({ type: t.type, category: t.category, description: t.description, value: t.value, date: t.date, paymentMethod: t.paymentMethod, status: t.status, patientId: t.patientId }); setModal('form') }
  function close() { setModal(null); setSelected(null) }

  function handleSave() {
    if (!form.description.trim() || !form.value) return
    const data = { ...form, value: Number(form.value) }
    if (selected) updateTransacao(selected.id, data)
    else addTransacao(data)
    close()
  }

  const patientMap = Object.fromEntries(patients.map(p => [p.id, p]))

  const byCategory = {}
  thisMonthData.filter(t => t.type === 'Entrada' && t.status === 'Pago').forEach(t => {
    byCategory[t.category] = (byCategory[t.category] || 0) + Number(t.value)
  })

  return (
    <div className="page-body">
      {/* KPI cards */}
      <div className="fin-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Receita do mês', value: currency(receita), icon: '↑', iconColor: 'var(--success)', iconBg: 'var(--success-light)', delta: growth !== null ? `${growth >= 0 ? '+' : ''}${growth.toFixed(1)}% vs mês anterior` : null, deltaUp: growth >= 0 },
          { label: 'Despesas do mês', value: currency(despesas), icon: '↓', iconColor: 'var(--danger)', iconBg: 'var(--danger-light)', delta: null },
          { label: 'Lucro líquido', value: currency(lucro), icon: '≡', iconColor: lucro >= 0 ? 'var(--success)' : 'var(--danger)', iconBg: lucro >= 0 ? 'var(--success-light)' : 'var(--danger-light)', delta: null },
          { label: 'A receber', value: currency(pendentes), icon: '⏱', iconColor: 'var(--warning)', iconBg: 'var(--warning-light)', delta: null },
        ].map(card => (
          <div key={card.label} className="card" style={{ padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: card.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: card.iconColor, fontWeight: 700, flexShrink: 0 }}>{card.icon}</div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 3 }}>{card.label}</div>
                <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'Inter', color: 'var(--text)' }}>{card.value}</div>
                {card.delta && <div style={{ fontSize: 11, marginTop: 2, color: card.deltaUp ? 'var(--success)' : 'var(--danger)', fontWeight: 500 }}>{card.delta}</div>}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="finance-layout" style={{ gap: 20 }}>
        {/* Transactions list */}
        <div>
          <div className="page-toolbar" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 4, background: 'var(--surface-2)', padding: 3, borderRadius: 8, border: '1px solid var(--border)' }}>
              {[['todos', 'Todos'], ['entradas', 'Entradas'], ['saidas', 'Saídas'], ['pendentes', 'Pendentes']].map(([k, l]) => (
                <button key={k} onClick={() => setFilter(k)}
                  style={{ padding: '5px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 500, transition: 'all 0.12s', background: filter === k ? 'var(--surface)' : 'transparent', color: filter === k ? 'var(--primary)' : 'var(--text-2)', boxShadow: filter === k ? 'var(--shadow-sm)' : 'none' }}>
                  {l}
                </button>
              ))}
            </div>
            <button className="btn btn-primary btn-sm" onClick={openAdd}>+ Lançamento</button>
          </div>

          <div className="card">
            <div className="table-container">
              {filtered.length === 0 ? (
                <div className="empty-state"><div className="empty-icon" /><h3>Sem lançamentos</h3></div>
              ) : (
                <table>
                  <thead><tr><th>Data</th><th>Descrição</th><th>Categoria</th><th>Forma</th><th>Status</th><th>Valor</th><th></th></tr></thead>
                  <tbody>
                    {filtered.map(t => (
                      <tr key={t.id}>
                        <td style={{ fontSize: 12.5, color: 'var(--text-3)' }}>{new Date(t.date + 'T12:00').toLocaleDateString('pt-BR')}</td>
                        <td>
                          <div style={{ fontWeight: 500, fontSize: 13.5 }}>{t.description}</div>
                          {t.patientId && patientMap[t.patientId] && <div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{patientMap[t.patientId].name}</div>}
                        </td>
                        <td><span className="badge badge-muted" style={{ fontSize: 11 }}>{t.category || '—'}</span></td>
                        <td style={{ fontSize: 12.5, color: 'var(--text-3)' }}>{t.paymentMethod}</td>
                        <td>
                          <span className={`badge ${t.status === 'Pago' ? 'badge-success' : t.status === 'Pendente' ? 'badge-warning' : 'badge-muted'}`}>{t.status}</span>
                        </td>
                        <td style={{ fontWeight: 700, fontSize: 14, color: t.type === 'Entrada' ? 'var(--success)' : 'var(--danger)' }}>
                          {t.type === 'Entrada' ? '+' : '-'}{currency(t.value)}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button className="btn btn-ghost btn-xs" onClick={() => openEdit(t)}>Editar</button>
                            <button className="btn btn-ghost btn-xs" onClick={() => { deleteTransacao(t.id) }}>Remover</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar — breakdown */}
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-header"><h3 className="card-title" style={{ fontSize: 13 }}>Receita por serviço</h3></div>
            <div className="card-body" style={{ padding: 16 }}>
              {Object.entries(byCategory).sort((a, b) => b[1] - a[1]).map(([cat, val]) => {
                const pct = receita > 0 ? (val / receita * 100) : 0
                const srv = servicos.find(s => s.name === cat)
                return (
                  <div key={cat} style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 13 }}>
                      <span style={{ fontWeight: 500 }}>{cat}</span>
                      <span style={{ color: 'var(--text-2)' }}>{currency(val)}</span>
                    </div>
                    <div style={{ height: 6, background: 'var(--surface-2)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: srv?.color || 'var(--primary)', borderRadius: 3, transition: 'width 0.5s' }} />
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{pct.toFixed(0)}% da receita</div>
                  </div>
                )
              })}
              {Object.keys(byCategory).length === 0 && <p style={{ fontSize: 13, color: 'var(--text-3)', textAlign: 'center' }}>Sem receitas neste mês</p>}
            </div>
          </div>

          <div className="card">
            <div className="card-header"><h3 className="card-title" style={{ fontSize: 13 }}>Resumo do mês</h3></div>
            <div className="card-body" style={{ padding: 16 }}>
              {[
                ['Receita bruta', currency(receita), 'var(--success)'],
                ['Despesas', currency(despesas), 'var(--danger)'],
                ['Lucro', currency(lucro), lucro >= 0 ? 'var(--success)' : 'var(--danger)'],
                ['Pendentes', currency(pendentes), 'var(--warning)'],
              ].map(([label, val, color]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid var(--border-light)', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-2)' }}>{label}</span>
                  <span style={{ fontWeight: 700, color }}>{val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {modal === 'form' && (
        <Modal title={selected ? 'Editar Lançamento' : 'Novo Lançamento'} onClose={close}
          footer={<><button className="btn btn-secondary" onClick={close}>Cancelar</button><button className="btn btn-primary" onClick={handleSave}>{selected ? 'Salvar' : 'Registrar'}</button></>}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Tipo</label>
              <select className="form-control" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                <option>Entrada</option><option>Saída</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-control" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                {STATUS_FINANCEIRO.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Descrição *</label>
            <input className="form-control" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Ex: Sessão de Pilates — Ana Clara" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Categoria</label>
              <select className="form-control" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                <option value="">Selecione...</option>
                {form.type === 'Entrada' ? servicos.map(s => <option key={s.id} value={s.name}>{s.name}</option>) : CATEGORIAS_DESPESA.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Valor (R$)</label>
              <input className="form-control" type="number" min="0" step="0.01" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} placeholder="0,00" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Data</label>
              <input className="form-control" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Forma de pagamento</label>
              <select className="form-control" value={form.paymentMethod} onChange={e => setForm(f => ({ ...f, paymentMethod: e.target.value }))}>
                {FORMAS_PAGAMENTO.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
          </div>
          {form.type === 'Entrada' && (
            <div className="form-group">
              <label className="form-label">Paciente (opcional)</label>
              <select className="form-control" value={form.patientId || ''} onChange={e => setForm(f => ({ ...f, patientId: e.target.value || null }))}>
                <option value="">Nenhum / geral</option>
                {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          )}
        </Modal>
      )}
    </div>
  )
}
