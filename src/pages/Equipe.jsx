import { useState } from 'react'
import { useApp } from '../context/AppContext'
import Modal from '../components/Modal'
import { PROF_COLORS } from '../domain/constants'

const EMPTY_PROF = { name: '', role: '', serviceIds: [], phone: '', email: '', color: '#7b5cff', active: true, notes: '' }
const EMPTY_ROOM = { name: '', number: '', active: true, notes: '' }

function initials(name = '') {
  return name.split(' ').filter(Boolean).map(p => p[0]).join('').slice(0, 2).toUpperCase() || '?'
}

export default function Equipe() {
  const {
    professionals, rooms, servicos,
    addProfessional, updateProfessional, deleteProfessional,
    addRoom, updateRoom, deleteRoom,
  } = useApp()

  const [modal, setModal] = useState(null) // 'prof' | 'room'
  const [selectedProf, setSelectedProf] = useState(null)
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [profForm, setProfForm] = useState(EMPTY_PROF)
  const [roomForm, setRoomForm] = useState(EMPTY_ROOM)

  // ── Professionals ──────────────────────────────────────────────────────────
  function openAddProf() { setProfForm({ ...EMPTY_PROF }); setSelectedProf(null); setModal('prof') }
  function openEditProf(p) {
    setSelectedProf(p)
    setProfForm({ name: p.name, role: p.role, serviceIds: p.serviceIds || [], phone: p.phone || '', email: p.email || '', color: p.color, active: p.active, notes: p.notes || '' })
    setModal('prof')
  }
  function handleSaveProf() {
    if (!profForm.name.trim()) return
    if (selectedProf) updateProfessional(selectedProf.id, profForm)
    else addProfessional(profForm)
    setModal(null)
  }
  function toggleProfActive(p) {
    updateProfessional(p.id, { active: !p.active })
  }

  // ── Rooms ──────────────────────────────────────────────────────────────────
  function openAddRoom() { setRoomForm({ ...EMPTY_ROOM }); setSelectedRoom(null); setModal('room') }
  function openEditRoom(r) {
    setSelectedRoom(r)
    setRoomForm({ name: r.name, number: r.number, active: r.active, notes: r.notes || '' })
    setModal('room')
  }
  function handleSaveRoom() {
    if (!roomForm.name.trim()) return
    if (selectedRoom) updateRoom(selectedRoom.id, roomForm)
    else addRoom(roomForm)
    setModal(null)
  }
  function toggleRoomActive(r) {
    updateRoom(r.id, { active: !r.active })
  }

  function toggleService(svcId) {
    setProfForm(f => ({
      ...f,
      serviceIds: f.serviceIds.includes(svcId)
        ? f.serviceIds.filter(id => id !== svcId)
        : [...f.serviceIds, svcId],
    }))
  }

  const activeProfs = professionals.filter(p => p.active).length
  const activeRooms = rooms.filter(r => r.active).length

  return (
    <div className="page-body">

      {/* ── Equipe clínica ────────────────────────────────────────────────── */}
      <div className="page-toolbar" style={{ marginBottom: 8 }}>
        <div>
          <div className="section-kicker">Gestão da equipe</div>
          <h2 className="page-title">Equipe clínica</h2>
        </div>
        <button className="btn btn-primary" onClick={openAddProf}>+ Novo profissional</button>
      </div>
      <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 24 }}>
        {activeProfs} profissional{activeProfs !== 1 ? 'is' : ''} ativo{activeProfs !== 1 ? 's' : ''}
        {professionals.length > activeProfs && ` · ${professionals.length - activeProfs} inativo${professionals.length - activeProfs !== 1 ? 's' : ''}`}
      </div>

      {professionals.length === 0 ? (
        <div className="empty-state" style={{ marginBottom: 48 }}>
          <div className="empty-icon" />
          <h3>Nenhum profissional cadastrado</h3>
          <p>Cadastre os profissionais que atuam na clínica para vincular à agenda.</p>
        </div>
      ) : (
        <div className="servicos-grid" style={{ marginBottom: 48 }}>
          {professionals.map(prof => {
            const services = (prof.serviceIds || []).map(id => servicos.find(s => s.id === id)).filter(Boolean)
            return (
              <div key={prof.id} className="servico-card" style={{ opacity: prof.active ? 1 : 0.6 }}>
                <div className="servico-banner" style={{ background: prof.color }} />
                <div className="servico-body">
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: prof.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                          {initials(prof.name)}
                        </div>
                        <div>
                          <h3 style={{ fontSize: 16, color: 'var(--text)', lineHeight: 1.2 }}>{prof.name}</h3>
                          {prof.role && <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{prof.role}</div>}
                        </div>
                      </div>
                    </div>
                    <span className={`badge badge-${prof.active ? 'success' : 'muted'}`}>
                      {prof.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>

                  {services.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
                      {services.map(s => (
                        <span key={s.id} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 12, background: s.color + '18', color: s.color, fontWeight: 600 }}>{s.name}</span>
                      ))}
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 14 }}>
                    {prof.phone && (
                      <div style={{ fontSize: 12, color: 'var(--text-2)' }}>
                        <span style={{ color: 'var(--text-3)', fontSize: 10, display: 'block', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }}>Telefone</span>
                        {prof.phone}
                      </div>
                    )}
                    {prof.email && (
                      <div style={{ fontSize: 12, color: 'var(--text-2)' }}>
                        <span style={{ color: 'var(--text-3)', fontSize: 10, display: 'block', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }}>E-mail</span>
                        {prof.email}
                      </div>
                    )}
                  </div>

                  {prof.notes && (
                    <p style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.5, marginBottom: 12, fontStyle: 'italic' }}>{prof.notes}</p>
                  )}

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-sm btn-secondary" style={{ flex: 1 }} onClick={() => openEditProf(prof)}>Editar</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => toggleProfActive(prof)}>
                      {prof.active ? 'Inativar' : 'Reativar'}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Salas do estúdio ──────────────────────────────────────────────── */}
      <div className="page-toolbar" style={{ marginBottom: 8 }}>
        <div>
          <div className="section-kicker">Infraestrutura</div>
          <h2 className="page-title" style={{ fontSize: 'clamp(20px, 2.5vw, 30px)' }}>Salas do estúdio</h2>
        </div>
        <button className="btn btn-primary" onClick={openAddRoom}>+ Nova sala</button>
      </div>
      <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 24 }}>
        {activeRooms} sala{activeRooms !== 1 ? 's' : ''} ativa{activeRooms !== 1 ? 's' : ''}
      </div>

      {rooms.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon" />
          <h3>Nenhuma sala cadastrada</h3>
          <p>Cadastre as salas do estúdio para organizar a agenda.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
          {rooms.map(room => (
            <div key={room.id} className="card" style={{ opacity: room.active ? 1 : 0.6 }}>
              <div className="card-body" style={{ padding: '18px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--primary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: 'var(--primary)' }}>
                      {room.number}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 15 }}>{room.name}</div>
                      <span className={`badge badge-${room.active ? 'success' : 'muted'}`} style={{ fontSize: 10, marginTop: 2 }}>
                        {room.active ? 'Ativa' : 'Inativa'}
                      </span>
                    </div>
                  </div>
                </div>
                {room.notes && <p style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.5, marginBottom: 12 }}>{room.notes}</p>}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-sm btn-secondary" style={{ flex: 1 }} onClick={() => openEditRoom(room)}>Editar</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => toggleRoomActive(room)}>
                    {room.active ? 'Inativar' : 'Reativar'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Modal: profissional ───────────────────────────────────────────── */}
      {modal === 'prof' && (
        <Modal
          title={selectedProf ? 'Editar profissional' : 'Novo profissional'}
          onClose={() => setModal(null)}
          footer={
            <>
              {selectedProf && (
                <button className="btn btn-danger btn-sm" onClick={() => { if (window.confirm(`Remover ${selectedProf.name}?`)) { deleteProfessional(selectedProf.id); setModal(null) } }}>Remover</button>
              )}
              <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSaveProf}>{selectedProf ? 'Salvar' : 'Cadastrar'}</button>
            </>
          }
        >
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Nome *</label>
              <input className="form-control" value={profForm.name} onChange={e => setProfForm(f => ({ ...f, name: e.target.value }))} placeholder="Nome completo" />
            </div>
            <div className="form-group">
              <label className="form-label">Função / especialidade</label>
              <input className="form-control" value={profForm.role} onChange={e => setProfForm(f => ({ ...f, role: e.target.value }))} placeholder="Ex: Fisioterapeuta · Pilates" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Serviços que realiza</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {servicos.map(s => {
                const checked = profForm.serviceIds.includes(s.id)
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggleService(s.id)}
                    style={{
                      padding: '5px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.12s',
                      background: checked ? s.color : 'transparent',
                      color: checked ? '#fff' : s.color,
                      border: `1.5px solid ${s.color}`,
                    }}
                  >
                    {s.name}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Telefone</label>
              <input className="form-control" value={profForm.phone} onChange={e => setProfForm(f => ({ ...f, phone: e.target.value }))} placeholder="(11) 9xxxx-xxxx" />
            </div>
            <div className="form-group">
              <label className="form-label">E-mail</label>
              <input className="form-control" type="email" value={profForm.email} onChange={e => setProfForm(f => ({ ...f, email: e.target.value }))} placeholder="profissional@email.com" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Cor na agenda</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              {PROF_COLORS.map(c => (
                <button key={c} type="button" onClick={() => setProfForm(f => ({ ...f, color: c }))}
                  style={{ width: 28, height: 28, borderRadius: '50%', background: c, border: 'none', cursor: 'pointer', outline: profForm.color === c ? '3px solid var(--text)' : '3px solid transparent', outlineOffset: 2, transition: 'outline 0.1s' }} />
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Observações internas</label>
            <textarea className="form-control" rows={2} value={profForm.notes} onChange={e => setProfForm(f => ({ ...f, notes: e.target.value }))} placeholder="Notas sobre disponibilidade, especialidades, etc." />
          </div>

          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
              <input type="checkbox" checked={profForm.active} onChange={e => setProfForm(f => ({ ...f, active: e.target.checked }))} />
              Profissional ativo
            </label>
          </div>
        </Modal>
      )}

      {/* ── Modal: sala ──────────────────────────────────────────────────── */}
      {modal === 'room' && (
        <Modal
          title={selectedRoom ? 'Editar sala' : 'Nova sala'}
          onClose={() => setModal(null)}
          footer={
            <>
              {selectedRoom && (
                <button className="btn btn-danger btn-sm" onClick={() => { if (window.confirm(`Remover ${selectedRoom.name}?`)) { deleteRoom(selectedRoom.id); setModal(null) } }}>Remover</button>
              )}
              <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSaveRoom}>{selectedRoom ? 'Salvar' : 'Cadastrar'}</button>
            </>
          }
        >
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Número da sala *</label>
              <input className="form-control" value={roomForm.number} onChange={e => setRoomForm(f => ({ ...f, number: e.target.value }))} placeholder="Ex: 1" style={{ maxWidth: 100 }} />
            </div>
            <div className="form-group">
              <label className="form-label">Nome / apelido *</label>
              <input className="form-control" value={roomForm.name} onChange={e => setRoomForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Sala Pilates" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Observações</label>
            <textarea className="form-control" rows={2} value={roomForm.notes} onChange={e => setRoomForm(f => ({ ...f, notes: e.target.value }))} placeholder="Equipamentos, capacidade, uso..." />
          </div>
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
              <input type="checkbox" checked={roomForm.active} onChange={e => setRoomForm(f => ({ ...f, active: e.target.checked }))} />
              Sala ativa
            </label>
          </div>
        </Modal>
      )}
    </div>
  )
}
