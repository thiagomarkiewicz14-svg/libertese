import { useState } from 'react'
import { useApp } from '../context/AppContext'

const DAYS_NAMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

export default function Presencas() {
  const { classes, students, saveAttendance, getAttendance } = useApp()
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10))
  const [presentIds, setPresentIds] = useState([])
  const [loaded, setLoaded] = useState(false)

  const cls = classes.find(c => c.id === selectedClass)

  function loadAttendance() {
    if (!selectedClass || !selectedDate) return
    const existing = getAttendance(selectedClass, selectedDate)
    setPresentIds(existing)
    setLoaded(true)
  }

  function toggleStudent(id) {
    setPresentIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  function handleSave() {
    if (!selectedClass || !selectedDate) return
    saveAttendance(selectedClass, selectedDate, presentIds)
  }

  function markAll() { setPresentIds(students.map(s => s.id)) }
  function clearAll() { setPresentIds([]) }

  const presentCount = presentIds.length
  const total = students.length

  return (
    <div className="page-body">
      {/* Selector */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 16, alignItems: 'flex-end' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Turma / Aula</label>
              <select
                className="form-control"
                value={selectedClass}
                onChange={e => { setSelectedClass(e.target.value); setLoaded(false) }}
              >
                <option value="">Selecione uma aula...</option>
                {classes.sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.time.localeCompare(b.time)).map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} — {DAYS_NAMES[c.dayOfWeek]} {c.time}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Data</label>
              <input
                className="form-control"
                type="date"
                value={selectedDate}
                onChange={e => { setSelectedDate(e.target.value); setLoaded(false) }}
              />
            </div>
            <button
              className="btn btn-primary"
              onClick={loadAttendance}
              disabled={!selectedClass || !selectedDate}
            >
              Carregar
            </button>
          </div>
        </div>
      </div>

      {!loaded && !selectedClass && (
        <div className="empty-state" style={{ marginTop: 40 }}>
          <div className="empty-icon" />
          <h3>Selecione uma turma e data</h3>
          <p>Escolha a aula e o dia para fazer a chamada das alunas.</p>
        </div>
      )}

      {loaded && cls && (
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">{cls.name}</h3>
              <p style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 4, fontFamily: 'Inter' }}>
                {new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                {' · '}{cls.instructor}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--primary)', fontFamily: 'Inter' }}>
                  {presentCount}/{total}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-3)' }}>presentes</div>
              </div>
            </div>
          </div>
          <div className="card-body">
            {/* Progress bar */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13, color: 'var(--text-2)' }}>
                <span>Frequência</span>
                <span>{total ? Math.round((presentCount / total) * 100) : 0}%</span>
              </div>
              <div style={{ height: 8, background: 'var(--surface-2)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', background: 'var(--success)',
                  width: `${total ? (presentCount / total) * 100 : 0}%`,
                  borderRadius: 4, transition: 'width 0.3s'
                }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                <button className="btn btn-sm btn-success" onClick={markAll}>Marcar todas</button>
                <button className="btn btn-sm btn-secondary" onClick={clearAll}>Limpar</button>
            </div>

            {students.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon" />
                <h3>Nenhuma aluna cadastrada</h3>
                <p>Cadastre alunas na seção Alunos primeiro.</p>
              </div>
            ) : (
              <div className="attendance-list">
                {students.map(s => {
                  const isPresent = presentIds.includes(s.id)
                  return (
                    <div
                      key={s.id}
                      className={`attendance-item ${isPresent ? 'present' : ''}`}
                        onClick={() => toggleStudent(s.id)}
                      >
                        <div className="attendance-check">
                          {isPresent && <span className="attendance-dot" aria-hidden="true" />}
                        </div>
                      <div className="avatar avatar-sm">
                        {s.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 500, fontSize: 14 }}>{s.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{s.plan}</div>
                      </div>
                      <span className={`badge badge-${s.status === 'Ativo' ? 'success' : 'danger'}`}>
                        {s.status}
                      </span>
                      {isPresent && (
                        <span style={{ fontSize: 13, color: 'var(--success)', fontWeight: 600 }}>Presente</span>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-primary" onClick={handleSave}>
                Salvar presenças
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
