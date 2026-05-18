export const CLINICAL_AREAS = [
  { key: 'cervical', label: 'Cervical', x: 50, y: 12 },
  { key: 'ombro', label: 'Ombro', x: 32, y: 25 },
  { key: 'punho', label: 'Punho', x: 20, y: 48 },
  { key: 'lombar', label: 'Lombar', x: 50, y: 45 },
  { key: 'quadril', label: 'Quadril', x: 50, y: 58 },
  { key: 'joelho', label: 'Joelho', x: 42, y: 76 },
  { key: 'tornozelo', label: 'Tornozelo', x: 58, y: 92 },
]

export const EXERCISE_LIBRARY = [
  { id: 'ex-breath', name: 'Respiração diafragmática', category: 'Mobilidade', duration: '5 min', level: 'Leve', video: 'Vídeo guiado', target: 'Controle de tensão e consciência corporal' },
  { id: 'ex-catcow', name: 'Cat-Cow terapêutico', category: 'Coluna', duration: '6 min', level: 'Leve', video: 'Vídeo demonstrativo', target: 'Mobilidade segmentar da coluna' },
  { id: 'ex-pelvic', name: 'Pelvic curl', category: 'Core', duration: '8 min', level: 'Moderado', video: 'Vídeo de progressão', target: 'Estabilidade lombopélvica' },
  { id: 'ex-swan', name: 'Swan modificado', category: 'Extensão', duration: '6 min', level: 'Moderado', video: 'Vídeo técnico', target: 'Extensores e controle torácico' },
  { id: 'ex-hip', name: 'Abertura de quadril', category: 'Quadril', duration: '7 min', level: 'Leve', video: 'Vídeo curto', target: 'Mobilidade de quadril e alívio lombar' },
]

export function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Number(value) || 0))
}

export function daysSince(dateStr) {
  if (!dateStr) return null
  return Math.floor((new Date() - new Date(dateStr + 'T12:00')) / 86400000)
}

export function formatDate(dateStr, options = { day: 'numeric', month: 'short', year: 'numeric' }) {
  if (!dateStr) return 'Sem data'
  return new Date(dateStr + 'T12:00').toLocaleDateString('pt-BR', options)
}

export function getCompletedSessions(slots, patientId) {
  return slots
    .filter(slot => slot.patientId === patientId && slot.status === 'Realizado')
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
}

export function getNextSession(slots, patientId) {
  const today = new Date().toISOString().slice(0, 10)
  return slots
    .filter(slot => slot.patientId === patientId && slot.date >= today && ['Agendado', 'Confirmado'].includes(slot.status))
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))[0]
}

export function getLatestSession(slots, patientId) {
  return [...getCompletedSessions(slots, patientId)].sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time))[0]
}

export function calculateClinicalProgress(patient, slots) {
  const completed = getCompletedSessions(slots, patient.id)
  const painSessions = completed.filter(s => s.dorAntes !== null && s.dorDepois !== null)
  const firstPain = painSessions[0]?.dorAntes ?? 6
  const latestPain = painSessions[painSessions.length - 1]?.dorDepois ?? Math.max(2, firstPain - completed.length)
  const painImprovement = clamp(firstPain - latestPain, -10, 10)
  const sessionFactor = Math.min(completed.length, 12)

  const painControl = clamp((10 - latestPain) * 10)
  const mobility = clamp(48 + sessionFactor * 4 + painImprovement * 5)
  const energy = clamp(54 + sessionFactor * 3 + painImprovement * 4 - latestPain)
  const stiffnessControl = clamp(44 + sessionFactor * 3.5 + painImprovement * 5)
  const overall = Math.round((painControl + mobility + energy + stiffnessControl) / 4)

  return {
    completedCount: completed.length,
    latestPain,
    firstPain,
    painImprovement,
    overall,
    trend: painImprovement >= 3 ? 'Evolução consistente' : painImprovement > 0 ? 'Evolução gradual' : 'Monitorar resposta',
    metrics: [
      { key: 'pain', label: 'Dor controlada', value: Math.round(painControl), detail: `Dor atual ${latestPain}/10` },
      { key: 'mobility', label: 'Mobilidade', value: Math.round(mobility), detail: mobility > 72 ? 'Amplitude em alta' : 'Ganho progressivo' },
      { key: 'energy', label: 'Energia', value: Math.round(energy), detail: energy > 70 ? 'Boa disposicao' : 'Acompanhar fadiga' },
      { key: 'stiffness', label: 'Rigidez controlada', value: Math.round(stiffnessControl), detail: stiffnessControl > 70 ? 'Baixa rigidez' : 'Foco em mobilidade' },
      { key: 'overall', label: 'Evolução geral', value: overall, detail: completed.length ? `${completed.length} sessões realizadas` : 'Sem sessões realizadas' },
    ],
  }
}

export function buildClinicalTimeline({ patient, slots, prontuario, servicos }) {
  if (!patient) return []
  const serviceMap = Object.fromEntries(servicos.map(s => [s.id, s]))

  const sessions = slots
    .filter(s => s.patientId === patient.id)
    .map(s => ({
      id: `session-${s.id}`,
      type: s.status === 'Realizado' ? 'Sessão realizada' : 'Agendamento',
      date: s.date,
      time: s.time,
      title: s.status === 'Realizado' ? serviceMap[s.serviceId]?.name || 'Sessão' : `Retorno ${s.status.toLowerCase()}`,
      professional: s.professional,
      status: s.status,
      summary: s.evolucao || s.notes || s.relatorioParaPaciente || 'Atendimento registrado na jornada do paciente.',
      meta: s.dorAntes !== null && s.dorDepois !== null ? `Dor ${s.dorAntes} -> ${s.dorDepois}` : `${s.duration} min`,
      tone: s.status === 'Realizado' ? 'success' : s.status === 'Falta' ? 'danger' : 'info',
    }))

  const evolutions = (prontuario?.evolucoes || []).map(ev => ({
    id: `evolution-${ev.id}`,
    type: 'Evolução clínica',
    date: ev.date,
    title: 'Registro de evolução',
    professional: ev.professional,
    status: 'Clinico',
    summary: ev.text,
    meta: 'Prontuario',
    tone: 'gold',
  }))

  const onboarding = patient.joinDate ? [{
    id: `join-${patient.id}`,
    type: 'Inicio da jornada',
    date: patient.joinDate,
    title: 'Cadastro e acolhimento',
    professional: patient.origin || 'Clínica',
    status: patient.status,
    summary: patient.notes || 'Paciente iniciado na jornada de cuidado.',
    meta: patient.primaryService ? 'Serviço principal definido' : 'Triagem inicial',
    tone: 'muted',
  }] : []

  return [...sessions, ...evolutions, ...onboarding]
    .sort((a, b) => b.date.localeCompare(a.date) || (b.time || '').localeCompare(a.time || ''))
}

export function getDefaultBodyMap(patient) {
  const seed = patient?.id?.charCodeAt(1) || 2
  return {
    cervical: { intensity: seed % 3 === 0 ? 5 : 2, note: patient?.notes?.toLowerCase().includes('cervical') ? 'Tensao cervical recorrente.' : '' },
    ombro: { intensity: 2, note: '' },
    lombar: { intensity: patient?.notes?.toLowerCase().includes('lombar') || patient?.notes?.toLowerCase().includes('l4') ? 6 : 3, note: patient?.notes?.toLowerCase().includes('l4') ? 'Cuidado com flexao e carga.' : '' },
    quadril: { intensity: 2, note: '' },
    joelho: { intensity: patient?.notes?.toLowerCase().includes('joelho') ? 5 : 1, note: patient?.notes?.toLowerCase().includes('joelho') ? 'Monitorar resposta pós-sessão.' : '' },
    punho: { intensity: 0, note: '' },
    tornozelo: { intensity: 1, note: '' },
  }
}

export function getPatientRisk(patient, slots) {
  const latest = getLatestSession(slots, patient.id)
  const next = getNextSession(slots, patient.id)
  const inactiveDays = latest ? daysSince(latest.date) : null
  const noShows = slots.filter(s => s.patientId === patient.id && s.status === 'Falta').length
  const recentPain = latest?.dorDepois ?? latest?.dorAntes ?? null
  let score = 18
  if (!next) score += 18
  if (inactiveDays > 21) score += 20
  if (inactiveDays > 45) score += 18
  if (noShows > 0) score += noShows * 10
  if (recentPain >= 6) score += 16
  if (patient.status === 'Inativo') score += 22
  if (patient.status === 'Aguardando Retorno') score += 18

  const value = clamp(score)
  return {
    value,
    level: value >= 70 ? 'Alto' : value >= 45 ? 'Moderado' : 'Baixo',
    reason: value >= 70
      ? 'Risco de abandono elevado. Recomenda-se contato humano breve.'
      : value >= 45
        ? 'Acompanhar aderência e próximo retorno.'
        : 'Jornada dentro do esperado.',
  }
}

export function getSessionConsistency(slots, patientId) {
  const completed = getCompletedSessions(slots, patientId)
  const recent = completed.slice(-8)
  if (recent.length < 2) return { value: recent.length ? 42 : 18, label: 'Historico inicial', detail: 'Ainda sem recorrencia suficiente.' }

  const gaps = recent.slice(1).map((session, index) => {
    const previous = recent[index]
    return Math.max(1, Math.round((new Date(session.date + 'T12:00') - new Date(previous.date + 'T12:00')) / 86400000))
  })
  const averageGap = gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length
  const value = clamp(100 - averageGap * 6 + recent.length * 5)

  return {
    value: Math.round(value),
    label: value >= 72 ? 'Consistencia forte' : value >= 48 ? 'Consistencia em construcao' : 'Baixa frequencia',
    detail: `Intervalo médio de ${Math.round(averageGap)} dias entre sessões recentes.`,
  }
}

export function getPatientNarrative(patient, slots, prontuario) {
  const completed = getCompletedSessions(slots, patient.id)
  const latest = getLatestSession(slots, patient.id)
  const next = getNextSession(slots, patient.id)
  const progress = calculateClinicalProgress(patient, slots)
  const consistency = getSessionConsistency(slots, patient.id)
  const risk = getPatientRisk(patient, slots)

  const recurring = [
    prontuario?.queixaPrincipal,
    prontuario?.restricoes,
    patient.notes,
    latest?.notasInternas,
  ].filter(Boolean).join(' ').toLowerCase()

  const recurringObservations = [
    recurring.includes('lombar') || recurring.includes('l4') ? 'Padrao lombar recorrente' : null,
    recurring.includes('cervical') ? 'Tensao cervical recorrente' : null,
    recurring.includes('joelho') ? 'Monitorar joelho e carga funcional' : null,
    recurring.includes('ansiosa') || recurring.includes('ansiedade') ? 'Acolhimento emocional ajuda aderencia' : null,
  ].filter(Boolean)

  const improvements = [
    progress.painImprovement > 0 ? `Dor reduziu ${progress.painImprovement} ponto${progress.painImprovement === 1 ? '' : 's'}` : null,
    completed.length >= 3 ? `${completed.length} sessões concluídas` : null,
    progress.overall >= 70 ? 'Evolução geral acima do esperado' : null,
    latest?.evolucao ? latest.evolucao : null,
  ].filter(Boolean)

  const attention = [
    risk.value >= 55 ? risk.reason : null,
    !next ? 'Sem retorno futuro marcado' : null,
    latest?.dorDepois >= 5 ? 'Dor residual ainda relevante' : null,
    prontuario?.restricoes ? `Restricao: ${prontuario.restricoes}` : null,
  ].filter(Boolean)

  return {
    completed,
    latest,
    next,
    progress,
    consistency,
    risk,
    recurringObservations: recurringObservations.length ? recurringObservations : ['Sem padrao recorrente critico identificado'],
    improvements: improvements.length ? improvements : ['Evolução aguardando novos registros clínicos'],
    attention: attention.length ? attention : ['Sem pontos criticos no momento'],
    headline: progress.overall >= 72
      ? 'Paciente evoluindo bem'
      : risk.value >= 60
        ? 'Paciente pede acompanhamento próximo'
        : 'Jornada em acompanhamento',
  }
}

export function getOperationalState(slot, activeSlotId, now = new Date()) {
  if (slot.status === 'Realizado') return 'finalizado'
  if (slot.status === 'Falta' || slot.status === 'Cancelado') return 'finalizado'
  if (slot.id === activeSlotId) return 'em andamento'

  const today = now.toISOString().slice(0, 10)
  if (slot.date !== today) return 'programado'

  const [hour, minute] = slot.time.split(':').map(Number)
  const start = new Date(now)
  start.setHours(hour, minute, 0, 0)
  const end = new Date(start.getTime() + Number(slot.duration || 60) * 60000)

  if (now >= start && now <= end) return 'agora'
  if (now > end) return 'atrasado'
  return 'proximo'
}

export function getOperationalLabel(state) {
  return {
    agora: 'Agora',
    proximo: 'Próximo',
    'em andamento': 'Em andamento',
    finalizado: 'Finalizado',
    atrasado: 'Atrasado',
    programado: 'Programado',
  }[state] || 'Programado'
}

export function generateClinicalInsights({ patients, slots }) {
  const ranked = patients.map(patient => ({ patient, risk: getPatientRisk(patient, slots) })).sort((a, b) => b.risk.value - a.risk.value)
  const positive = patients
    .map(patient => ({ patient, progress: calculateClinicalProgress(patient, slots) }))
    .filter(x => x.progress.painImprovement >= 3)
    .sort((a, b) => b.progress.painImprovement - a.progress.painImprovement)

  const recurrentPain = patients
    .map(patient => ({ patient, latest: getLatestSession(slots, patient.id) }))
    .filter(x => (x.latest?.dorDepois ?? 0) >= 5)

  const noReturn = patients.filter(patient => {
    const latest = getLatestSession(slots, patient.id)
    return latest && !getNextSession(slots, patient.id) && daysSince(latest.date) > 14
  })

  return [
    ranked[0] && {
      title: 'Risco de abandono',
      text: `${ranked[0].patient.name} aparece com risco ${ranked[0].risk.level.toLowerCase()} por aderencia/retorno.`,
      detail: ranked[0].risk.reason,
      tone: ranked[0].risk.level === 'Alto' ? 'danger' : 'warning',
    },
    positive[0] && {
      title: 'Evolução positiva',
      text: `${positive[0].patient.name} reduziu ${positive[0].progress.painImprovement} pontos de dor nas sessões registradas.`,
      detail: 'Bom momento para reforcar progresso e continuidade do plano.',
      tone: 'success',
    },
    recurrentPain[0] && {
      title: 'Recorrencia de dor',
      text: `${recurrentPain[0].patient.name} ainda relata dor relevante após a sessão.`,
      detail: 'Revisar mapa corporal, carga e recomendacoes domiciliares.',
      tone: 'warning',
    },
    noReturn[0] && {
      title: 'Sem retorno marcado',
      text: `${noReturn.length} paciente${noReturn.length > 1 ? 's' : ''} sem retorno apos atendimento recente.`,
      detail: 'Automacao de lembrete pode recuperar continuidade do cuidado.',
      tone: 'info',
    },
  ].filter(Boolean)
}

export function generateAutomations({ patients, slots }) {
  const today = new Date()
  return patients.flatMap(patient => {
    const latest = getLatestSession(slots, patient.id)
    const next = getNextSession(slots, patient.id)
    const completed = getCompletedSessions(slots, patient.id)
    const inactiveDays = latest ? daysSince(latest.date) : null
    const tasks = []

    if (latest && !next && inactiveDays > 14) {
      tasks.push({ id: `return-${patient.id}`, type: 'Retorno pendente', patient, priority: inactiveDays > 30 ? 'Alta' : 'Media', detail: `Última sessão há ${inactiveDays} dias` })
    }

    if (completed.length > 0 && completed.length % 10 >= 8) {
      tasks.push({ id: `package-${patient.id}`, type: 'Fim de pacote', patient, priority: 'Media', detail: `${10 - (completed.length % 10)} sessões estimadas restantes` })
    }

    if (patient.birthDate) {
      const birth = new Date(patient.birthDate + 'T12:00')
      const nextBirth = new Date(today.getFullYear(), birth.getMonth(), birth.getDate())
      if (nextBirth < today) nextBirth.setFullYear(today.getFullYear() + 1)
      const days = Math.ceil((nextBirth - today) / 86400000)
      if (days <= 30) tasks.push({ id: `birth-${patient.id}`, type: 'Aniversario', patient, priority: 'Baixa', detail: `Em ${days} dias` })
    }

    if (inactiveDays > 45 || patient.status === 'Inativo') {
      tasks.push({ id: `inactive-${patient.id}`, type: 'Paciente inativo', patient, priority: 'Alta', detail: inactiveDays ? `Sem sessão há ${inactiveDays} dias` : 'Sem sessão recente' })
    }

    return tasks
  })
}
