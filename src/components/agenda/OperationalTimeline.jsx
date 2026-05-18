import { getOperationalLabel, getOperationalState } from '../../domain/clinical'

export default function OperationalTimeline({ slots, activeSlotId }) {
  const now = new Date()
  const next = slots.find(slot => ['agora', 'proximo'].includes(getOperationalState(slot, activeSlotId, now)))
  const completed = slots.filter(slot => slot.status === 'Realizado').length
  const delayed = slots.filter(slot => getOperationalState(slot, activeSlotId, now) === 'atrasado').length
  const active = slots.find(slot => getOperationalState(slot, activeSlotId, now) === 'em andamento')
  const headline = active
    ? 'Sessão em andamento'
    : next
      ? `Próximo às ${next.time}`
      : delayed
        ? `${delayed} atendimento${delayed === 1 ? '' : 's'} atrasado${delayed === 1 ? '' : 's'}`
        : 'Agenda sob controle'
  const subcopy = active
    ? getOperationalLabel('em andamento')
    : next
      ? 'Equipe preparada para o próximo cuidado.'
      : delayed
        ? 'Priorize triagem, confirmação e conclusão das sessões do dia.'
        : 'Nenhum atendimento pendente para agora.'

  const states = [
    { key: 'agora', label: active ? 'Em andamento' : next ? 'Próximo atendimento' : 'Operação tranquila', value: active?.time || next?.time || 'Livre' },
    { key: 'finalizado', label: 'Finalizados', value: completed },
    { key: 'atrasado', label: 'Atrasados', value: delayed },
    { key: 'proximo', label: 'Na agenda', value: slots.filter(s => ['Agendado', 'Confirmado'].includes(s.status)).length },
  ]

  return (
    <section className="operational-timeline">
      <div className="operational-now">
        <span className="live-dot" />
        <div>
          <div className="section-kicker">Linha operacional</div>
          <h3>{headline}</h3>
          <p>{subcopy}</p>
        </div>
      </div>

      <div className="operational-steps">
        {states.map(item => (
          <div key={item.key} className={`operational-step op-${item.key}`}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
        ))}
      </div>
    </section>
  )
}
