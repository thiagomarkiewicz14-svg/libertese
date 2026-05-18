import { formatDate } from '../../domain/clinical'

function ReportSection({ title, children }) {
  return (
    <section className="report-section">
      <div className="report-section-title">{title}</div>
      <div>{children || <em>Nao preenchido</em>}</div>
    </section>
  )
}

export default function PremiumReportPreview({ patient, slot, service }) {
  if (!slot || !patient) return null

  return (
    <article className="premium-report">
      <header className="report-hero">
        <div>
          <div className="section-kicker">Relatorio premium pos-consulta</div>
          <h2>{patient.name}</h2>
          <p>{service?.name || 'Atendimento clinico'} - {formatDate(slot.date)} - {slot.professional}</p>
        </div>
        <div className="report-stamp">
          <strong>{slot.dorAntes !== null ? `${slot.dorAntes} -> ${slot.dorDepois ?? '-'}` : '--'}</strong>
          <span>Dor</span>
        </div>
      </header>

      <div className="report-summary-grid">
        <div>
          <span>Sessao</span>
          <strong>{slot.duration} min</strong>
        </div>
        <div>
          <span>Retorno</span>
          <strong>{slot.retorno ? formatDate(slot.retorno, { day: 'numeric', month: 'short' }) : 'A combinar'}</strong>
        </div>
        <div>
          <span>Status</span>
          <strong>{slot.status}</strong>
        </div>
      </div>

      <ReportSection title="Resumo clinico">{slot.evolucao || slot.relatorioParaPaciente}</ReportSection>
      <ReportSection title="Exercicios e orientacoes">
        {slot.exercicios && <pre>{slot.exercicios}</pre>}
      </ReportSection>
      <ReportSection title="Recomendacoes">{slot.recomendacoes}</ReportSection>
      <ReportSection title="Proximos passos">
        {slot.retorno ? `Retorno recomendado em ${formatDate(slot.retorno)}.` : 'Definir retorno conforme resposta do paciente.'}
      </ReportSection>
    </article>
  )
}
