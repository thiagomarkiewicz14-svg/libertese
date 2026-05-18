import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import PatientPortal from '../components/patient/PatientPortal'

export default function AreaPaciente() {
  const { patients, agendaSlots, plans } = useApp()
  const [searchParams] = useSearchParams()
  const initialId = searchParams.get('patient') || patients[0]?.id || ''
  const [selectedId, setSelectedId] = useState(initialId)
  const patient = patients.find(p => p.id === selectedId)

  return (
    <div className="page-body">
      <div className="page-toolbar">
        <div>
          <div className="section-kicker">Portal do paciente</div>
          <h2 className="page-title">Acompanhamento e evolução</h2>
        </div>
        <select className="form-control" style={{ width: 280 }} value={selectedId} onChange={e => setSelectedId(e.target.value)}>
          <option value="" disabled>Selecionar paciente…</option>
          {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      <PatientPortal patient={patient} slots={agendaSlots} plans={plans} />
    </div>
  )
}
