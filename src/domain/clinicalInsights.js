import {
  clamp,
  daysSince,
  getCompletedSessions,
  getNextSession,
  getLatestSession,
  calculateClinicalProgress,
  getSessionConsistency,
} from './clinical'

function computeAverageGap(completed) {
  if (completed.length < 2) return null
  const sorted = [...completed].sort((a, b) => a.date.localeCompare(b.date))
  const gaps = sorted.slice(1).map((s, i) =>
    Math.max(1, Math.round((new Date(s.date + 'T12:00') - new Date(sorted[i].date + 'T12:00')) / 86400000))
  )
  return gaps.reduce((sum, g) => sum + g, 0) / gaps.length
}

function countInRange(completed, fromDays, toDays) {
  return completed.filter(s => {
    const d = daysSince(s.date)
    return d !== null && d >= fromDays && d <= toDays
  }).length
}

const SEVERITY_ORDER = { high: 0, medium: 1, low: 2 }

export function getClinicalEngagementScore(patientId, { patients = [], sessions = [], evaluations = {} }) {
  const patient = patients.find(p => p.id === patientId)
  if (!patient) return { score: 0, label: 'Jornada interrompida', classification: 'interrupted', patientId }

  const completed = getCompletedSessions(sessions, patientId)
  const slots = sessions.filter(s => s.patientId === patientId)
  const noShows = slots.filter(s => s.status === 'Falta' || s.status === 'Cancelado').length
  const latest = getLatestSession(sessions, patientId)
  const next = getNextSession(sessions, patientId)
  const inactiveDays = latest ? daysSince(latest.date) : null
  const progress = calculateClinicalProgress(patient, sessions)

  let score = 50

  if (completed.length >= 2) {
    const consistency = getSessionConsistency(sessions, patientId)
    score += Math.round(consistency.value * 0.25)
  }

  if (next) score += 15

  if (inactiveDays === null) {
    score -= 25
  } else if (inactiveDays > 90) {
    score -= 30
  } else if (inactiveDays > 45) {
    score -= 20
  } else if (inactiveDays > 21) {
    score -= 10
  }

  score -= Math.min(noShows * 8, 24)

  if (progress.painImprovement > 0) score += 10

  if (patient.status === 'Inativo') score -= 20
  else if (patient.status === 'Aguardando Retorno') score -= 10
  else if (patient.status === 'Ativo' || patient.status === 'Em Tratamento') score += 5

  score = clamp(score, 0, 100)

  const label =
    score >= 80 ? 'Estável' :
    score >= 60 ? 'Acompanhar' :
    score >= 40 ? 'Em atenção' :
    'Jornada interrompida'

  const classification =
    score >= 80 ? 'stable' :
    score >= 60 ? 'monitor' :
    score >= 40 ? 'attention' :
    'interrupted'

  return {
    score,
    label,
    classification,
    patientId,
    inactiveDays,
    hasNextSession: !!next,
    completedCount: completed.length,
  }
}

export function generateClinicalRelationshipInsights({
  patients = [],
  sessions = [],
  appointments,
  attendances,
  evaluations = {},
  plans = [],
}) {
  const slots = sessions.length ? sessions : (appointments || attendances || [])
  const today = new Date().toISOString().slice(0, 10)
  const insights = []

  for (const patient of patients) {
    const patientSlots = slots.filter(s => s.patientId === patient.id)
    const completed = getCompletedSessions(slots, patient.id)
    const latest = getLatestSession(slots, patient.id)
    const next = getNextSession(slots, patient.id)
    const inactiveDays = latest ? daysSince(latest.date) : null
    const noShows = patientSlots.filter(s => s.status === 'Falta' || s.status === 'Cancelado').length
    const prontuario = evaluations?.[patient.id]

    // A) RETURN_OVERDUE — sessão com retorno definido que já passou sem novo agendamento
    const slotsWithPastReturn = completed.filter(s => s.retorno && s.retorno < today)
    if (slotsWithPastReturn.length > 0 && !next) {
      const last = slotsWithPastReturn.sort((a, b) => b.retorno.localeCompare(a.retorno))[0]
      const daysOverdue = daysSince(last.retorno)
      insights.push({
        id: `return-overdue-${patient.id}`,
        type: 'RETURN_OVERDUE',
        patientId: patient.id,
        patientName: patient.name,
        title: 'Retorno pendente',
        description: `Paciente está há ${daysOverdue} dia${daysOverdue === 1 ? '' : 's'} sem retorno após recomendação clínica.`,
        severity: daysOverdue > 21 ? 'high' : daysOverdue > 10 ? 'medium' : 'low',
        category: 'retention',
        suggestedAction: 'Entrar em contato para retomar o acompanhamento',
        daysSinceLastSession: inactiveDays,
        daysOverdue,
        metadata: { retorno: last.retorno },
      })
      continue
    }

    // B) NO_FOLLOW_UP_AFTER_SESSION — sessão recente sem próximo passo
    if (latest && !next && inactiveDays !== null && inactiveDays > 7 && inactiveDays <= 30) {
      insights.push({
        id: `no-followup-${patient.id}`,
        type: 'NO_FOLLOW_UP_AFTER_SESSION',
        patientId: patient.id,
        patientName: patient.name,
        title: 'Jornada sem próximo passo',
        description: 'Jornada clínica sem próximo passo definido após sessão recente.',
        severity: 'medium',
        category: 'retention',
        suggestedAction: 'Agendar próxima sessão ou confirmar continuidade do cuidado',
        daysSinceLastSession: inactiveDays,
        metadata: { lastSession: latest.date },
      })
      continue
    }

    // C) ABANDONMENT_RISK — intervalo atual muito acima do padrão
    if (completed.length >= 3 && inactiveDays !== null && inactiveDays > 14 && !next) {
      const avgGap = computeAverageGap(completed.slice(0, -1))
      if (avgGap !== null && inactiveDays > avgGap * 1.8 && inactiveDays > 21) {
        insights.push({
          id: `abandonment-risk-${patient.id}`,
          type: 'ABANDONMENT_RISK',
          patientId: patient.id,
          patientName: patient.name,
          title: 'Risco de afastamento',
          description: `Intervalo atual de ${inactiveDays} dias está acima do padrão recente de ${Math.round(avgGap)} dias entre sessões.`,
          severity: inactiveDays > avgGap * 3 ? 'high' : 'medium',
          category: 'retention',
          suggestedAction: 'Reforçar contato e verificar barreiras ao retorno',
          daysSinceLastSession: inactiveDays,
          metadata: { averageGap: Math.round(avgGap) },
        })
        continue
      }
    }

    // D) ATTENDANCE_DROP — frequência em queda nas últimas semanas
    if (completed.length >= 4) {
      const recent = countInRange(completed, 0, 28)
      const previous = countInRange(completed, 29, 56)
      if (previous > 0 && recent < previous * 0.6) {
        insights.push({
          id: `attendance-drop-${patient.id}`,
          type: 'ATTENDANCE_DROP',
          patientId: patient.id,
          patientName: patient.name,
          title: 'Frequência em queda',
          description: `Frequência reduziu nas últimas semanas — ${recent} sessão${recent !== 1 ? 'ões' : ''} recentes frente a ${previous} no período anterior.`,
          severity: recent === 0 ? 'high' : 'medium',
          category: 'attendance',
          suggestedAction: 'Investigar o que pode estar dificultando a continuidade do cuidado',
          daysSinceLastSession: inactiveDays,
          metadata: { recentCount: recent, previousCount: previous },
        })
        continue
      }
    }

    // E) RECURRING_ABSENCE — faltas ou cancelamentos recorrentes
    if (noShows >= 2) {
      const recentAbsences = patientSlots.filter(
        s => (s.status === 'Falta' || s.status === 'Cancelado') && daysSince(s.date) <= 60
      )
      if (recentAbsences.length >= 2) {
        insights.push({
          id: `recurring-absence-${patient.id}`,
          type: 'RECURRING_ABSENCE',
          patientId: patient.id,
          patientName: patient.name,
          title: 'Ausências recorrentes',
          description: `Paciente apresenta ${recentAbsences.length} falta${recentAbsences.length !== 1 ? 's' : ''} ou cancelamento${recentAbsences.length !== 1 ? 's' : ''} nos últimos 60 dias.`,
          severity: recentAbsences.length >= 3 ? 'high' : 'medium',
          category: 'attendance',
          suggestedAction: 'Conversar sobre barreiras ao comparecimento e avaliar ajuste de horários',
          daysSinceLastSession: inactiveDays,
          metadata: { absenceCount: recentAbsences.length },
        })
        continue
      }
    }

    // F) REACTIVATION_OPPORTUNITY — boa adesão anterior, inativo há tempo
    if (completed.length >= 3 && inactiveDays !== null && inactiveDays >= 45 && inactiveDays <= 180 && !next) {
      const progress = calculateClinicalProgress(patient, slots)
      if (progress.painImprovement >= 0 && progress.overall >= 40) {
        insights.push({
          id: `reactivation-${patient.id}`,
          type: 'REACTIVATION_OPPORTUNITY',
          patientId: patient.id,
          patientName: patient.name,
          title: 'Oportunidade de reativação',
          description: `Paciente com boa resposta clínica e ${inactiveDays} dias sem sessão — momento oportuno para retomar o acompanhamento.`,
          severity: inactiveDays > 90 ? 'high' : 'medium',
          category: 'retention',
          suggestedAction: 'Retomar contato e apresentar proposta de continuidade do cuidado',
          daysSinceLastSession: inactiveDays,
          metadata: { overallProgress: progress.overall },
        })
        continue
      }
    }

    // G) EVALUATION_OUTDATED — sem reavaliação clínica recente
    if (completed.length >= 2) {
      const evolucoes = (prontuario?.evolucoes || []).slice()
      evolucoes.sort((a, b) => b.date.localeCompare(a.date))
      const lastEv = evolucoes[0]
      const daysSinceEval = lastEv ? daysSince(lastEv.date) : null
      if (daysSinceEval === null || daysSinceEval > 60) {
        insights.push({
          id: `evaluation-outdated-${patient.id}`,
          type: 'EVALUATION_OUTDATED',
          patientId: patient.id,
          patientName: patient.name,
          title: 'Reavaliação pendente',
          description: daysSinceEval === null
            ? 'Paciente sem reavaliação clínica registrada no prontuário.'
            : `Última reavaliação foi há ${daysSinceEval} dias — atualizar o registro clínico.`,
          severity: daysSinceEval === null || daysSinceEval > 90 ? 'medium' : 'low',
          category: 'clinical',
          suggestedAction: 'Realizar reavaliação clínica e registrar evolução no prontuário',
          daysSinceLastSession: inactiveDays,
          metadata: { daysSinceEvaluation: daysSinceEval },
        })
        continue
      }
    }

    // H) PACKAGE_OPPORTUNITY — muitas sessões avulsas em curto período
    if (completed.length >= 4) {
      const recent60 = completed.filter(s => daysSince(s.date) <= 60)
      if (recent60.length >= 4 && !next?.planId) {
        insights.push({
          id: `package-opportunity-${patient.id}`,
          type: 'PACKAGE_OPPORTUNITY',
          patientId: patient.id,
          patientName: patient.name,
          title: 'Candidata a pacote',
          description: `Paciente realizou ${recent60.length} sessões nos últimos 60 dias — pode se beneficiar de plano recorrente ou pacote de continuidade.`,
          severity: 'low',
          category: 'commercial',
          suggestedAction: 'Apresentar opções de pacote ou plano de acompanhamento',
          daysSinceLastSession: inactiveDays,
          metadata: { recentSessionCount: recent60.length },
        })
      }
    }
  }

  return insights.sort((a, b) => (SEVERITY_ORDER[a.severity] ?? 3) - (SEVERITY_ORDER[b.severity] ?? 3))
}
