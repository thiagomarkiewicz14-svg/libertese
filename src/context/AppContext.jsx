import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { registerToastHandler } from '../services/toast'
import { SERVICOS_DEFAULT } from '../domain/constants'
import { getDefaultBodyMap } from '../domain/clinical'

const AppContext = createContext(null)

// ─── Mock data ──────────────────────────────────────────────────────────────

const TODAY = new Date().toISOString().slice(0, 10)
const d = (offset) => {
  const dt = new Date()
  dt.setDate(dt.getDate() + offset)
  return dt.toISOString().slice(0, 10)
}

const INITIAL_PATIENTS = [
  { id: 'p1', name: 'Ana Clara Souza', email: 'ana.clara.souza@gmail.com', phone: '(11) 98765-4321', birthDate: '1990-03-15', gender: 'F', status: 'Ativo', tags: ['VIP'], origin: 'Indicação de paciente', joinDate: '2025-01-15', notes: 'Paciente assídua. Prefere horários matutinos. Lombalgia postural por home office. Ótima evolução clínica — EVA inicial 5/10, atual 1/10.', lastSession: d(-7), nextSession: TODAY, primaryService: 'sv1' },
  { id: 'p2', name: 'Beatriz Lima', email: 'beatriz.lima@icloud.com', phone: '(11) 91234-5678', birthDate: '1985-07-22', gender: 'F', status: 'Em Tratamento', tags: ['Crônico'], origin: 'Busca orgânica (Google)', joinDate: '2024-11-01', notes: 'Hérnia discal L4-L5 com protrusão moderada. Radiculopatia ciática esquerda. Encaminhada por neurocirurgião para tratamento conservador.', lastSession: d(-3), nextSession: d(2), primaryService: 'sv2' },
  { id: 'p3', name: 'Carla Mendes', email: 'carla.mendes@gmail.com', phone: '(11) 97890-1234', birthDate: '1978-11-08', gender: 'F', status: 'Em Tratamento', tags: ['Pós-operatório', 'VIP'], origin: 'Encaminhamento médico', joinDate: '2024-06-20', notes: 'Pós-op de reconstrução de LCA joelho direito. Evolução excelente — fase 2 iniciada. Atleta de tênis amadora, meta de retorno ao esporte.', lastSession: d(-1), nextSession: d(3), primaryService: 'sv1' },
  { id: 'p4', name: 'Daniela Rocha', email: 'daniela.rocha@hotmail.com', phone: '(11) 93456-7890', birthDate: '1995-05-30', gender: 'F', status: 'Aguardando Retorno', tags: ['Retorno pendente'], origin: 'Instagram', joinDate: '2025-03-10', notes: 'Dentista. Tensão cervical bilateral por postura profissional. Cefaleia tensional associada. Retorno pendente há 45 dias — contato em aberto.', lastSession: d(-45), nextSession: null, primaryService: 'sv3' },
  { id: 'p5', name: 'Eduarda Costa', email: 'edu.costa.pilates@gmail.com', phone: '(11) 99876-5432', birthDate: '1988-09-14', gender: 'F', status: 'Ativo', tags: ['Performance'], origin: 'Indicação de paciente', joinDate: '2024-09-05', notes: 'Personal trainer e corredora amadora. Nível avançado. Foco em performance e prevenção. Histórico de tendinite patelar direita resolvida (2023).', lastSession: d(-5), nextSession: d(2), primaryService: 'sv4' },
  { id: 'p6', name: 'Fernanda Gomes', email: 'fer.gomes@outlook.com', phone: '(11) 96543-2109', birthDate: '2000-01-20', gender: 'F', status: 'Ativo', tags: ['Paciente novo'], origin: 'Instagram', joinDate: '2026-04-01', notes: 'Bailarina clássica. Hipermobilidade generalizada (Beighton 7/9). Foco em estabilização articular. Cuidado: não estimular mobilidade — já em excesso.', lastSession: d(-10), nextSession: TODAY, primaryService: 'sv3' },
  { id: 'p7', name: 'Giovana Reis', email: 'giovana.reis@gmail.com', phone: '(11) 94321-0987', birthDate: '1982-12-03', gender: 'F', status: 'Inativo', tags: [], origin: 'Facebook', joinDate: '2024-03-15', notes: 'Gonartrose leve bilateral (Kellgren 1-2). Parou o tratamento após 3ª sessão sem aviso. Três tentativas de recontato sem resposta.', lastSession: d(-90), nextSession: null, primaryService: 'sv2' },
  { id: 'p8', name: 'Helena Santos', email: 'helena.santos@gmail.com', phone: '(11) 92109-8765', birthDate: '1975-06-17', gender: 'F', status: 'Em Tratamento', tags: ['VIP', 'Crônico'], origin: 'Encaminhamento médico', joinDate: '2023-08-10', notes: 'Fibromialgia (ACR 2010, 18 tender points). Hipotireoidismo controlado. Melhor resposta terapêutica com pilates 2x/semana. Paciente modelo.', lastSession: d(-2), nextSession: TODAY, primaryService: 'sv1' },
  { id: 'p9', name: 'Ricardo Ferreira', email: 'ricardo.ferreira@gmail.com', phone: '(11) 97654-3210', birthDate: '1979-08-22', gender: 'M', status: 'Em Tratamento', tags: ['VIP', 'Encaminhamento médico'], origin: 'Encaminhamento médico', joinDate: '2026-04-15', notes: 'CEO. Hérnia cervical C5-C6 com radiculopatia em membro superior direito. Encaminhado pelo Dr. Alexandre Gomes (neurocirurgião) para tratamento conservador. EVA 6/10 cervical inicial.', lastSession: d(-4), nextSession: d(1), primaryService: 'sv2' },
  { id: 'p10', name: 'Isabela Nakamura', email: 'isabela.nakamura@gmail.com', phone: '(11) 95432-1098', birthDate: '1992-11-30', gender: 'F', status: 'Ativo', tags: ['Pós-maternidade'], origin: 'Instagram', joinDate: '2026-04-22', notes: 'Pós-parto vaginal (bebê 7 meses). Diastase abdominal grau 2 (~3 cm). Liberada por ginecologista para pilates solo. Dor lombar pós-gestacional.', lastSession: d(-3), nextSession: d(1), primaryService: 'sv1' },
]

const INITIAL_AGENDA = [
  // Hoje
  { id: 'ag1', patientId: 'p1', serviceId: 'sv1', date: TODAY, time: '08:00', duration: 60, professional: 'Dra. Marina', professionalId: 'prof1', roomId: 'room1', status: 'Confirmado', notes: '', notasInternas: '', relatorioParaPaciente: '', dorAntes: null, dorDepois: null, evolucao: '', exercicios: '', recomendacoes: '', retorno: '' },
  { id: 'ag2', patientId: 'p8', serviceId: 'sv1', date: TODAY, time: '09:00', duration: 60, professional: 'Dra. Marina', professionalId: 'prof1', roomId: 'room1', status: 'Confirmado', notes: 'Fibromialgia — adaptar intensidade conforme estado do dia', notasInternas: '', relatorioParaPaciente: '', dorAntes: null, dorDepois: null, evolucao: '', exercicios: '', recomendacoes: '', retorno: '' },
  { id: 'ag3', patientId: 'p6', serviceId: 'sv3', date: TODAY, time: '10:30', duration: 60, professional: 'Dra. Fernanda', professionalId: 'prof3', roomId: 'room3', status: 'Agendado', notes: 'Foco: estabilização — hipermobilidade', notasInternas: '', relatorioParaPaciente: '', dorAntes: null, dorDepois: null, evolucao: '', exercicios: '', recomendacoes: '', retorno: '' },
  { id: 'ag4', patientId: 'p2', serviceId: 'sv2', date: TODAY, time: '14:00', duration: 50, professional: 'Dra. Juliana', professionalId: 'prof2', roomId: 'room2', status: 'Agendado', notes: 'Avaliação mensal L4-L5', notasInternas: '', relatorioParaPaciente: '', dorAntes: null, dorDepois: null, evolucao: '', exercicios: '', recomendacoes: '', retorno: '' },
  { id: 'ag5', patientId: 'p5', serviceId: 'sv4', date: TODAY, time: '16:00', duration: 30, professional: 'Dra. Fernanda', professionalId: 'prof3', roomId: 'room3', status: 'Agendado', notes: '', notasInternas: '', relatorioParaPaciente: '', dorAntes: null, dorDepois: null, evolucao: '', exercicios: '', recomendacoes: '', retorno: '' },
  // Amanhã (d+1)
  { id: 'ag6', patientId: 'p3', serviceId: 'sv1', date: d(1), time: '08:30', duration: 60, professional: 'Dra. Marina', professionalId: 'prof1', roomId: 'room1', status: 'Confirmado', notes: 'Fase 2 pós-op — protocolo de força', notasInternas: '', relatorioParaPaciente: '', dorAntes: null, dorDepois: null, evolucao: '', exercicios: '', recomendacoes: '', retorno: '' },
  { id: 'ag16', patientId: 'p9', serviceId: 'sv2', date: d(1), time: '11:00', duration: 50, professional: 'Dra. Juliana', professionalId: 'prof2', roomId: 'room2', status: 'Confirmado', notes: 'Osteopatia cervical — hérnia C5-C6', notasInternas: '', relatorioParaPaciente: '', dorAntes: null, dorDepois: null, evolucao: '', exercicios: '', recomendacoes: '', retorno: '' },
  { id: 'ag17', patientId: 'p10', serviceId: 'sv1', date: d(1), time: '14:30', duration: 60, professional: 'Dra. Marina', professionalId: 'prof1', roomId: 'room1', status: 'Agendado', notes: 'Pilates pós-maternidade — diastase grau 2', notasInternas: '', relatorioParaPaciente: '', dorAntes: null, dorDepois: null, evolucao: '', exercicios: '', recomendacoes: '', retorno: '' },
  // d+2
  { id: 'ag7', patientId: 'p1', serviceId: 'sv1', date: d(2), time: '08:00', duration: 60, professional: 'Dra. Marina', professionalId: 'prof1', roomId: 'room1', status: 'Agendado', notes: '', notasInternas: '', relatorioParaPaciente: '', dorAntes: null, dorDepois: null, evolucao: '', exercicios: '', recomendacoes: '', retorno: '' },
  { id: 'ag8', patientId: 'p2', serviceId: 'sv2', date: d(2), time: '10:00', duration: 50, professional: 'Dra. Juliana', professionalId: 'prof2', roomId: 'room2', status: 'Agendado', notes: '', notasInternas: '', relatorioParaPaciente: '', dorAntes: null, dorDepois: null, evolucao: '', exercicios: '', recomendacoes: '', retorno: '' },
  { id: 'ag19', patientId: 'p10', serviceId: 'sv1', date: d(2), time: '09:30', duration: 60, professional: 'Dra. Marina', professionalId: 'prof1', roomId: 'room1', status: 'Agendado', notes: '', notasInternas: '', relatorioParaPaciente: '', dorAntes: null, dorDepois: null, evolucao: '', exercicios: '', recomendacoes: '', retorno: '' },
  // d+3
  { id: 'ag9', patientId: 'p4', serviceId: 'sv3', date: d(3), time: '09:00', duration: 60, professional: 'Dra. Fernanda', professionalId: 'prof3', roomId: 'room3', status: 'Agendado', notes: 'Retorno após pausa de 45 dias', notasInternas: '', relatorioParaPaciente: '', dorAntes: null, dorDepois: null, evolucao: '', exercicios: '', recomendacoes: '', retorno: '' },
  { id: 'ag18', patientId: 'p9', serviceId: 'sv2', date: d(3), time: '11:00', duration: 50, professional: 'Dra. Juliana', professionalId: 'prof2', roomId: 'room2', status: 'Agendado', notes: '', notasInternas: '', relatorioParaPaciente: '', dorAntes: null, dorDepois: null, evolucao: '', exercicios: '', recomendacoes: '', retorno: '' },
  // d+4
  { id: 'ag20', patientId: 'p8', serviceId: 'sv1', date: d(4), time: '09:00', duration: 60, professional: 'Dra. Marina', professionalId: 'prof1', roomId: 'room1', status: 'Agendado', notes: '', notasInternas: '', relatorioParaPaciente: '', dorAntes: null, dorDepois: null, evolucao: '', exercicios: '', recomendacoes: '', retorno: '' },
  // Sessões passadas — recentes
  { id: 'ag10', patientId: 'p1', serviceId: 'sv1', date: d(-7), time: '08:00', duration: 60, professional: 'Dra. Marina', professionalId: 'prof1', roomId: 'room1', status: 'Realizado', notes: '', notasInternas: 'Boa evolução na flexibilidade. Aumentei carga no reformer. Paciente muito engajada.', relatorioParaPaciente: 'Sessão muito produtiva! Continue com os exercícios em casa.', dorAntes: 4, dorDepois: 1, evolucao: 'Melhora significativa na amplitude de movimento da coluna lombar. Paciente relatou menos dor ao acordar durante a semana.', exercicios: 'Cat-Cow 3x10\nPelvic Curl 3x8\nSingle Leg Stretch 2x10', recomendacoes: 'Aplicar calor local por 15min antes de dormir. Evitar flexão excessiva do tronco.', retorno: d(7),
    postSessionReport: {
      responsibleProfessionalId: 'prof1',
      sessionSummary: 'Sessão de pilates no reformer com foco em estabilização lombo-pélvica. Paciente chegou com dor 4/10 e relatou melhora progressiva ao longo da sessão. Carga aumentada no footwork — boa tolerância.',
      patientFeedback: 'Paciente refere que dormiu bem nos dias anteriores e sente a lombar mais "leve". Relatou leve fadiga muscular após a sessão — esperado nesta fase de progressão.',
      clinicalFindings: 'Amplitude de flexão lombar melhorada em relação à avaliação inicial. Encurtamento de isquiotibiais ainda presente bilateralmente. Ativação do transverso do abdome mais eficiente e coordenada.',
      conductApplied: 'Reformer: footwork (mola amarela), pelvic curl e short spine (3x8). Solo: single leg stretch 2x10, cat-cow com ênfase respiratória. Progressão de spring verde para amarelo no footwork.',
      recommendations: 'Aplicar calor local (15 min) antes de dormir. Evitar ficar sentada por mais de 45 minutos sem pausa ativa.',
      homeCare: 'Cat-Cow 2x ao dia — manhã e noite (3 séries de 10 repetições). Respiração diafragmática antes de dormir (5 minutos).',
      nextSessionFocus: 'Introduzir rollup preparatório. Progredir para spring verde no footwork. Avaliar hundred com pernas a 60°.',
      beforeBodyMap: { areas: { lombar: { intensity: 4, note: 'Dor ao movimento' }, cervical: { intensity: 2, note: 'Tensão leve' } }, mobilityNotes: 'Flexão lombar 60% — limitada por dor. Cervical livre.', generalScore: 4 },
      afterBodyMap: { areas: { lombar: { intensity: 1, note: 'Alívio pós-sessão' }, cervical: { intensity: 0, note: '' } }, mobilityNotes: 'Melhora significativa pós-mobilização. Amplitude lombar normalizada.', generalScore: 1 },
      createdAt: d(-7) + 'T10:30:00.000Z', updatedAt: d(-7) + 'T10:30:00.000Z',
    }
  },
  { id: 'ag11', patientId: 'p8', serviceId: 'sv1', date: d(-2), time: '09:00', duration: 60, professional: 'Dra. Marina', professionalId: 'prof1', roomId: 'room1', status: 'Realizado', notes: '', notasInternas: 'Paciente relata EVA 3/10 hoje — dia bom. Aumentei ligeiramente o volume.', relatorioParaPaciente: 'Ótimo empenho hoje! Vejo melhora consistente na sua resistência.', dorAntes: 5, dorDepois: 2, evolucao: 'Redução da dor generalizada. Tolerou bem os exercícios de baixo impacto. Volume aumentado sem efeito adverso.', exercicios: 'Respiração diafragmática 5min\nSwan modificado 3x5\nLeg Circle suave 2x6\nSide-lying kicks 2x8', recomendacoes: 'Manter hidratação. Banho quente pós-sessão. Amitriptilina conforme prescrito.', retorno: TODAY },
  { id: 'ag12', patientId: 'p3', serviceId: 'sv1', date: d(-1), time: '08:30', duration: 60, professional: 'Dra. Marina', professionalId: 'prof1', roomId: 'room1', status: 'Realizado', notes: '', notasInternas: 'Evolução pós-op excelente — iniciando fase 2 com carga progressiva.', relatorioParaPaciente: 'Parabéns pela dedicação! Sua recuperação está avançando muito acima do esperado.', dorAntes: 3, dorDepois: 0, evolucao: 'Força de quadríceps 4+/5. Deambulação sem dor. ADM completa. Iniciando fase 2 do protocolo pós-op com carga progressiva.', exercicios: 'Agachamento funcional 3x15\nLeg Press leve 3x12 (20kg)\nBicicleta ergométrica 10min\nProprioceptivo em disco 3x30s', recomendacoes: 'Gelo no joelho após exercícios por 20 minutos. Evitar corrida e impacto por 2 semanas.', retorno: d(3),
    postSessionReport: {
      responsibleProfessionalId: 'prof1',
      sessionSummary: 'Sessão de reabilitação pós-op de LCA — fase 2 iniciada com sucesso. Excelente resposta clínica. Paciente sem queixas de dor em repouso e com ótima motivação.',
      patientFeedback: 'Paciente relata que conseguiu subir escadas sem dor pela primeira vez desde a cirurgia. Muito emocionada e motivada com a evolução.',
      clinicalFindings: 'Força de quadríceps 4+/5 no membro operado. Sem edema articular palpável. ADM completa para flexão e extensão. Marcha normalizada sem compensações.',
      conductApplied: 'Agachamento funcional bilateral com biofeedback (3x15). Leg press bilateral 3x12 a 20kg. Bicicleta ergométrica 10 min. Exercícios proprioceptivos em disco de equilíbrio (3x30s cada lado).',
      recommendations: 'Gelo no joelho por 20 minutos após qualquer atividade física. Evitar corrida, pulos e impacto por mais 2 semanas.',
      homeCare: 'Mini agachamento 3x15 com apoio na parede. Elevação de perna estendida 3x15. Step-up em degrau baixo (30cm) 3x12.',
      nextSessionFocus: 'Iniciar treino proprioceptivo unipodal. Progressão de carga no leg press para 30kg. Avaliar step-up em degrau médio.',
      beforeBodyMap: { areas: { joelho: { intensity: 3, note: 'Leve dor ao esforço' }, quadril: { intensity: 1, note: 'Compensação discreta' } }, mobilityNotes: 'ADM joelho 0-120°. Pequena limitação na flexão terminal.', generalScore: 3 },
      afterBodyMap: { areas: { joelho: { intensity: 0, note: '' }, quadril: { intensity: 0, note: '' } }, mobilityNotes: 'Sem dor ao final da sessão. Excelente resposta ao protocolo de fase 2.', generalScore: 0 },
      createdAt: d(-1) + 'T09:30:00.000Z', updatedAt: d(-1) + 'T09:30:00.000Z',
    }
  },
  { id: 'ag13', patientId: 'p2', serviceId: 'sv2', date: d(-3), time: '14:00', duration: 50, professional: 'Dra. Juliana', professionalId: 'prof2', roomId: 'room2', status: 'Realizado', notes: '', notasInternas: 'Manipulação HVLA L4-L5 + mobilização sacral. Boa resposta.', relatorioParaPaciente: 'A manipulação foi bem-sucedida. Sentirá alívio progressivo nas próximas 24-48h.', dorAntes: 7, dorDepois: 3, evolucao: 'Tração lombar com excelente resposta. Redução de 4 pontos na EVA pós-sessão. Mobilização sacral sem intercorrências.', exercicios: 'Alongamento isquiotibiais 3x30s\nMcKenzie extensão 3x10\nBracing abdominal 3x10s', recomendacoes: 'Repouso relativo por 24h. Evitar sentar por longos períodos. Almofada lombar na cadeira.', retorno: d(2) },
  { id: 'ag21', patientId: 'p1', serviceId: 'sv1', date: d(-14), time: '08:00', duration: 60, professional: 'Dra. Marina', professionalId: 'prof1', roomId: 'room1', status: 'Realizado', notes: '', notasInternas: 'Progressão para spring verde. Introduzido hundred com pernas a 60°.', relatorioParaPaciente: 'Ótima sessão! Você está evoluindo muito bem.', dorAntes: 5, dorDepois: 2, evolucao: 'Hundred introduzido com boa coordenação. Spring progredido. EVA 5→2.', exercicios: 'Hundred 2x50\nFootwork spring verde\nSingle Leg Stretch 3x10', recomendacoes: 'Postura ao sentar — usar apoio lombar.', retorno: d(-7) },
  { id: 'ag22', patientId: 'p2', serviceId: 'sv2', date: d(-17), time: '14:00', duration: 50, professional: 'Dra. Juliana', professionalId: 'prof2', roomId: 'room2', status: 'Realizado', notes: '', notasInternas: 'Tração manual + mobilização passiva. EVA melhorou de 6 para 4.', relatorioParaPaciente: 'Boa sessão. Continue com os alongamentos em casa.', dorAntes: 6, dorDepois: 4, evolucao: 'Melhora gradual da radiculopatia. Parestesia diminuindo. Força 4+/5 em MMII esquerdo.', exercicios: 'McKenzie extensão 3x10\nAlongamento piriforme 3x30s', recomendacoes: 'Almofada lombar. Não carregar peso acima de 5kg.', retorno: d(-3) },
  { id: 'ag23', patientId: 'p8', serviceId: 'sv1', date: d(-9), time: '09:00', duration: 60, professional: 'Dra. Marina', professionalId: 'prof1', roomId: 'room1', status: 'Realizado', notes: '', notasInternas: 'Dia difícil — EVA 6/10 ao chegar. Adaptei protocolo para baixo impacto.', relatorioParaPaciente: 'Você foi muito corajosa hoje! Cada sessão conta.', dorAntes: 6, dorDepois: 3, evolucao: 'Dia de exacerbação. Protocolo adaptado. Mesmo assim houve redução de 3 pontos na EVA.', exercicios: 'Respiração diafragmática 10min\nGato-vaca suave 2x8\nRelaxamento guiado', recomendacoes: 'Banho quente. Priorizar sono. Duloxetina conforme prescrito.', retorno: d(-2) },
  { id: 'ag24', patientId: 'p9', serviceId: 'sv2', date: d(-4), time: '11:00', duration: 50, professional: 'Dra. Juliana', professionalId: 'prof2', roomId: 'room2', status: 'Realizado', notes: '', notasInternas: 'Primeira sessão. Avaliação + mobilização suave C5-C6. Inibição suboccipital.', relatorioParaPaciente: 'Primeira sessão realizada com sucesso. O alívio tende a aumentar nas próximas 48h.', dorAntes: 6, dorDepois: 4, evolucao: 'Avaliação inicial completa. Mobilização cervical suave C5-C6 com boa tolerância. Inibição suboccipital com redução imediata da tensão.', exercicios: 'Retração cervical gentil 3x10\nElevação de ombros com respiração 3x5', recomendacoes: 'Ajustar monitor ao nível dos olhos. Pausa de 5 min a cada 1h de trabalho.', retorno: d(1) },
  { id: 'ag25', patientId: 'p10', serviceId: 'sv1', date: d(-3), time: '14:30', duration: 60, professional: 'Dra. Marina', professionalId: 'prof1', roomId: 'room1', status: 'Realizado', notes: '', notasInternas: 'Avaliação inicial. Diastase 3cm. Protocolo pós-parto iniciado com ativação básica.', relatorioParaPaciente: 'Bem-vinda ao estúdio! Primeira sessão concluída com sucesso. Você está no caminho certo.', dorAntes: 4, dorDepois: 2, evolucao: 'Avaliação pós-parto completa. Diastase 3cm na linha alba. Transverso com ativação fraca mas coordenada. Protocolo iniciado com exercícios respiratórios e ativação suave.', exercicios: 'Respiração 360° 3x10\nContração transverso (imprint) 3x10\nBridge preparatório 3x8', recomendacoes: 'Levantar da cama sempre de lado. Evitar esforço abdominal ao carregar bebê.', retorno: d(1) },
  { id: 'ag14', patientId: 'p7', serviceId: 'sv2', date: d(-90), time: '11:00', duration: 50, professional: 'Dra. Juliana', professionalId: 'prof2', roomId: 'room2', status: 'Falta', notes: 'Não compareceu e não avisou. Tentativa de contato sem retorno.', notasInternas: '', relatorioParaPaciente: '', dorAntes: null, dorDepois: null, evolucao: '', exercicios: '', recomendacoes: '', retorno: '' },
  { id: 'ag15', patientId: 'p5', serviceId: 'sv4', date: d(-5), time: '16:00', duration: 30, professional: 'Dra. Fernanda', professionalId: 'prof3', roomId: 'room3', status: 'Realizado', notes: '', notasInternas: 'Laserterapia preventiva joelho direito. Dose 4J/cm². Excelente resposta.', relatorioParaPaciente: 'Laserterapia aplicada com sucesso. Continue usando a joelheira nos treinos de corrida.', dorAntes: 3, dorDepois: 0, evolucao: 'Boa resposta ao laser. Redução de edema residual visível. Paciente sem dor ao final.', exercicios: '', recomendacoes: 'Não expor a região ao sol por 24h. Usar joelheira nos treinos.', retorno: d(5) },
]

const INITIAL_FINANCEIRO = [
  // Maio/2026 — corrente
  { id: 'fin1', type: 'Entrada', category: 'Pilates', description: 'Sessão — Ana Clara Souza', value: 150, date: d(-7), paymentMethod: 'Pix', status: 'Pago', patientId: 'p1' },
  { id: 'fin2', type: 'Entrada', category: 'Osteopatia', description: 'Sessão — Beatriz Lima', value: 280, date: d(-3), paymentMethod: 'Cartão de Crédito', status: 'Pago', patientId: 'p2' },
  { id: 'fin3', type: 'Entrada', category: 'Pilates', description: 'Sessão — Carla Mendes', value: 150, date: d(-1), paymentMethod: 'Pix', status: 'Pago', patientId: 'p3' },
  { id: 'fin4', type: 'Entrada', category: 'Laserterapia', description: 'Sessão — Eduarda Costa', value: 130, date: d(-5), paymentMethod: 'Dinheiro', status: 'Pago', patientId: 'p5' },
  { id: 'fin5', type: 'Entrada', category: 'Pilates', description: 'Sessão — Helena Santos', value: 150, date: d(-2), paymentMethod: 'Pix', status: 'Pago', patientId: 'p8' },
  { id: 'fin6', type: 'Entrada', category: 'Terapia Manual', description: 'Sessão — Fernanda Gomes (pendente)', value: 180, date: TODAY, paymentMethod: 'Pix', status: 'Pendente', patientId: 'p6' },
  { id: 'fin7', type: 'Saída', category: 'Aluguel', description: 'Aluguel da sala — Maio/2026', value: 2800, date: d(-15), paymentMethod: 'Transferência', status: 'Pago', patientId: null },
  { id: 'fin8', type: 'Saída', category: 'Materiais clínicos', description: 'Insumos de massagem e consumíveis', value: 380, date: d(-10), paymentMethod: 'Cartão de Débito', status: 'Pago', patientId: null },
  { id: 'fin9', type: 'Saída', category: 'Marketing', description: 'Impulsionamento Instagram — Maio', value: 200, date: d(-8), paymentMethod: 'Cartão de Crédito', status: 'Pago', patientId: null },
  { id: 'fin10', type: 'Saída', category: 'Software', description: 'Assinatura sistema de gestão', value: 89, date: d(-6), paymentMethod: 'Cartão de Crédito', status: 'Pago', patientId: null },
  { id: 'fin11', type: 'Entrada', category: 'Osteopatia', description: 'Sessão — Ricardo Ferreira', value: 280, date: d(-4), paymentMethod: 'Pix', status: 'Pago', patientId: 'p9' },
  { id: 'fin12', type: 'Entrada', category: 'Pilates', description: 'Sessão — Isabela Nakamura', value: 150, date: d(-3), paymentMethod: 'Pix', status: 'Pago', patientId: 'p10' },
  { id: 'fin13', type: 'Entrada', category: 'Pilates', description: 'Sessão — Ana Clara Souza', value: 150, date: d(-14), paymentMethod: 'Pix', status: 'Pago', patientId: 'p1' },
  // Abril/2026
  { id: 'fin14', type: 'Entrada', category: 'Pilates', description: 'Pacote 10 sessões — Helena Santos', value: 1350, date: d(-20), paymentMethod: 'Pix', status: 'Pago', patientId: 'p8' },
  { id: 'fin15', type: 'Entrada', category: 'Osteopatia', description: 'Sessão — Beatriz Lima', value: 280, date: d(-25), paymentMethod: 'Pix', status: 'Pago', patientId: 'p2' },
  { id: 'fin16', type: 'Entrada', category: 'Pilates', description: 'Sessão — Ana Clara Souza', value: 150, date: d(-28), paymentMethod: 'Pix', status: 'Pago', patientId: 'p1' },
  { id: 'fin17', type: 'Entrada', category: 'Pilates', description: 'Pacote 10 sessões — Carla Mendes', value: 1350, date: d(-30), paymentMethod: 'Cartão de Crédito', status: 'Pago', patientId: 'p3' },
  { id: 'fin18', type: 'Saída', category: 'Aluguel', description: 'Aluguel da sala — Abril/2026', value: 2800, date: d(-48), paymentMethod: 'Transferência', status: 'Pago', patientId: null },
  { id: 'fin19', type: 'Saída', category: 'Materiais clínicos', description: 'Reposição de materiais — Abril', value: 320, date: d(-35), paymentMethod: 'Cartão de Débito', status: 'Pago', patientId: null },
  // Março/2026
  { id: 'fin20', type: 'Entrada', category: 'Pilates', description: 'Sessão — Helena Santos', value: 150, date: d(-50), paymentMethod: 'Pix', status: 'Pago', patientId: 'p8' },
  { id: 'fin21', type: 'Entrada', category: 'Osteopatia', description: 'Sessão — Beatriz Lima', value: 280, date: d(-55), paymentMethod: 'Cartão de Crédito', status: 'Pago', patientId: 'p2' },
  { id: 'fin22', type: 'Entrada', category: 'Pilates', description: 'Sessão — Ana Clara Souza', value: 150, date: d(-58), paymentMethod: 'Pix', status: 'Pago', patientId: 'p1' },
  { id: 'fin23', type: 'Entrada', category: 'Laserterapia', description: 'Sessão — Eduarda Costa', value: 130, date: d(-52), paymentMethod: 'Dinheiro', status: 'Pago', patientId: 'p5' },
  { id: 'fin24', type: 'Saída', category: 'Aluguel', description: 'Aluguel da sala — Março/2026', value: 2800, date: d(-60), paymentMethod: 'Transferência', status: 'Pago', patientId: null },
  { id: 'fin25', type: 'Saída', category: 'Marketing', description: 'Impulsionamento Instagram — Março', value: 200, date: d(-55), paymentMethod: 'Cartão de Crédito', status: 'Pago', patientId: null },
  // Fevereiro/2026
  { id: 'fin26', type: 'Entrada', category: 'Pilates', description: 'Pacote 5 sessões — Carla Mendes', value: 675, date: d(-82), paymentMethod: 'Pix', status: 'Pago', patientId: 'p3' },
  { id: 'fin27', type: 'Entrada', category: 'Osteopatia', description: 'Sessão — Beatriz Lima', value: 280, date: d(-85), paymentMethod: 'Cartão de Crédito', status: 'Pago', patientId: 'p2' },
  { id: 'fin28', type: 'Entrada', category: 'Pilates', description: 'Sessão — Ana Clara Souza', value: 150, date: d(-88), paymentMethod: 'Pix', status: 'Pago', patientId: 'p1' },
  { id: 'fin29', type: 'Entrada', category: 'Pilates', description: 'Sessão — Helena Santos', value: 150, date: d(-80), paymentMethod: 'Pix', status: 'Pago', patientId: 'p8' },
  { id: 'fin30', type: 'Saída', category: 'Aluguel', description: 'Aluguel da sala — Fevereiro/2026', value: 2800, date: d(-90), paymentMethod: 'Transferência', status: 'Pago', patientId: null },
  // Janeiro/2026
  { id: 'fin31', type: 'Entrada', category: 'Pilates', description: 'Pacote 10 sessões — Ana Clara Souza', value: 1350, date: d(-118), paymentMethod: 'Pix', status: 'Pago', patientId: 'p1' },
  { id: 'fin32', type: 'Entrada', category: 'Osteopatia', description: 'Sessão — Beatriz Lima', value: 280, date: d(-115), paymentMethod: 'Cartão de Crédito', status: 'Pago', patientId: 'p2' },
  { id: 'fin33', type: 'Entrada', category: 'Pilates', description: 'Sessão — Helena Santos', value: 150, date: d(-113), paymentMethod: 'Pix', status: 'Pago', patientId: 'p8' },
  { id: 'fin34', type: 'Saída', category: 'Aluguel', description: 'Aluguel da sala — Janeiro/2026', value: 2800, date: d(-120), paymentMethod: 'Transferência', status: 'Pago', patientId: null },
  { id: 'fin35', type: 'Saída', category: 'Materiais clínicos', description: 'Reposição de materiais — Janeiro', value: 450, date: d(-112), paymentMethod: 'Cartão de Débito', status: 'Pago', patientId: null },
  // Dezembro/2025
  { id: 'fin36', type: 'Entrada', category: 'Pilates', description: 'Pacote 10 sessões — Helena Santos', value: 1350, date: d(-148), paymentMethod: 'Pix', status: 'Pago', patientId: 'p8' },
  { id: 'fin37', type: 'Entrada', category: 'Pilates', description: 'Sessão — Carla Mendes', value: 150, date: d(-145), paymentMethod: 'Pix', status: 'Pago', patientId: 'p3' },
  { id: 'fin38', type: 'Entrada', category: 'Pilates', description: 'Sessão — Ana Clara Souza', value: 150, date: d(-143), paymentMethod: 'Pix', status: 'Pago', patientId: 'p1' },
  { id: 'fin39', type: 'Saída', category: 'Aluguel', description: 'Aluguel da sala — Dezembro/2025', value: 2800, date: d(-146), paymentMethod: 'Transferência', status: 'Pago', patientId: null },
  { id: 'fin40', type: 'Saída', category: 'Materiais clínicos', description: 'Insumos e consumíveis — Dezembro', value: 420, date: d(-142), paymentMethod: 'Cartão de Débito', status: 'Pago', patientId: null },
]

const INITIAL_PRONTUARIOS = {
  p1: { patientId: 'p1', anamnese: 'Sem comorbidades. Pratica atividade física 3x/semana. Trabalha em home office (8-10h/dia sentada). Sem medicações contínuas.', queixaPrincipal: 'Dor lombar postural leve ao final do dia de trabalho. EVA inicial 5/10, atual 1/10.', historico: 'Episódios de lombalgia há 3 anos associados à sedentarismo laboral. RX de coluna sem alterações estruturais (2023). Fisioterapia convencional em 2023 — melhora parcial. Iniciou pilates em Jan/2025.', restricoes: 'Sem restrições formais. Evitar hiperextensão extrema por precaução.', objetivos: 'Eliminar dor lombar, melhorar postura e fortalecer core profundo.', evolucoes: [{ id: 'ev1', date: d(-120), text: 'Avaliação inicial. EVA 5/10 lombar. Encurtamento de isquiotibiais. Core fraco. Iniciando protocolo lombalgia solo.', professional: 'Dra. Marina' }, { id: 'ev2', date: d(-60), text: 'EVA 3/10. Progressão para reformer. Hundred e footwork introduzidos com boa resposta.', professional: 'Dra. Marina' }, { id: 'ev3', date: d(-14), text: 'EVA 2/10. Hundred progredido para pernas a 60°. Spring verde no footwork. Excelente evolução.', professional: 'Dra. Marina' }, { id: 'ev4', date: d(-7), text: 'EVA 1/10. Paciente refere "não sinto mais dor no trabalho". Mantendo protocolo com progressão.', professional: 'Dra. Marina' }] },
  p2: { patientId: 'p2', anamnese: 'Hérnia discal L4-L5 com protrusão moderada confirmada por RNM (Jan/2024). Dor irradiada para MMII esquerdo. Sedentarismo. IMC 28. Sem medicações regulares.', queixaPrincipal: 'Dor lombar com irradiação para perna esquerda (ciática). EVA 7/10 no início do tratamento.', historico: 'Diagnóstico de hérnia discal L4-L5 com compressão radicular L5 esquerda. Encaminhada por neurocirurgião Dr. Paulo Henrique (Neuro SP) para tratamento conservador antes de qualquer decisão cirúrgica.', restricoes: 'Proibida flexão de tronco com carga. Evitar rotação extrema de coluna. Sem impacto.', objetivos: 'Reduzir dor, descomprimir disco, recuperar função, evitar cirurgia.', evolucoes: [{ id: 'ev1', date: d(-120), text: 'Avaliação inicial osteopatia. EVA 7/10. Força 4/5 MMII esq. Parestesia até o pé. Protocolo descompressivo iniciado.', professional: 'Dra. Juliana' }, { id: 'ev2', date: d(-60), text: 'EVA 5/10. Melhora significativa da irradiação. Parestesia apenas até o joelho. Continuando.', professional: 'Dra. Juliana' }, { id: 'ev3', date: d(-17), text: 'EVA 4/10. Força 4+/5 bilateral. Manipulação HVLA bem tolerada. Progressão para fortalecimento.', professional: 'Dra. Juliana' }, { id: 'ev4', date: d(-3), text: 'EVA 3/10. Excelente resposta. Força 5/5 bilateral. Parestesia ausente. Iniciando fortalecimento ativo.', professional: 'Dra. Juliana' }] },
  p3: { patientId: 'p3', anamnese: 'Pós-operatório de reconstrução de LCA joelho direito (cirurgia em ' + d(-60) + '). Enxerto do tendão patelar. Sem intercorrências pós-op. Medicação: dipirona sob demanda.', queixaPrincipal: 'Recuperação funcional pós-cirúrgica. Dor 3/10 ao esforço. Edema residual inicial.', historico: 'Lesão de LCA durante partida de tênis amador. Cirurgia artroscópica com enxerto do tendão patelar realizada pelo Dr. Marcos Vieira (Ortopedia). Liberada para reabilitação 3 semanas após o ato cirúrgico.', restricoes: 'Fase 2 em andamento. Sem corrida ou impacto por mais 2 semanas. Progredir carga gradualmente.', objetivos: 'Recuperação funcional completa, retorno ao tênis em 5-6 meses.', evolucoes: [{ id: 'ev1', date: d(-45), text: 'Início da fase 1. Mobilização passiva, isométricos de quadríceps. Edema importante. ADM 0-90°.', professional: 'Dra. Marina' }, { id: 'ev2', date: d(-30), text: 'Fase 1b. Edema reduzido. ADM 0-110°. SLR com boa força. Iniciando cadeia cinética fechada.', professional: 'Dra. Marina' }, { id: 'ev3', date: d(-1), text: 'Fase 2 iniciada. ADM completa. Força 4+/5. Deambulação sem auxílio e sem dor. Excelente evolução.', professional: 'Dra. Marina' }] },
  p4: { patientId: 'p4', anamnese: 'Dentista, trabalha 8h/dia em postura cervical fletida sobre pacientes. Sem comorbidades. Uso esporádico de dipirona para cefaleia tensional (2-3x/semana).', queixaPrincipal: 'Dor cervical bilateral com irradiação para ombros. Cefaleia tensional recorrente. EVA 5/10.', historico: 'Piora gradual dos sintomas nos últimos 8 meses, coincidindo com mudança de consultório com mesa mais alta. Sem exames de imagem recentes. Nunca realizou fisioterapia.', restricoes: 'Sem restrições formais. Atenção a movimentos de rotação cervical extrema.', objetivos: 'Eliminar cefaleia tensional, liberar musculatura cervical e de ombros, orientação postural.', evolucoes: [{ id: 'ev1', date: d(-45), text: 'Avaliação inicial. EVA 5/10 cervical. Encurtamento trapézio superior bilateral +++. Iniciando terapia manual + pilates.', professional: 'Dra. Fernanda' }, { id: 'ev2', date: d(-30), text: 'Melhora parcial. EVA 3/10. Cefaleia reduzida para 1x/semana. Paciente relatou retorno espontâneo — fazer contato ativo.', professional: 'Dra. Fernanda' }] },
  p5: { patientId: 'p5', anamnese: 'Personal trainer e corredora amadora (meias maratonas). Sem comorbidades. Suplementação: proteína isolada e magnésio quelato. Sem medicações.', queixaPrincipal: 'Manutenção de performance atlética e prevenção de lesões recorrentes.', historico: 'Pratica corrida competitiva há 10 anos. Episódio de tendinite patelar direita em 2023, tratada com fisioterapia e laser — resolvida. Sem cirurgias. Iniciou pilates em Set/2024 como treinamento complementar.', restricoes: 'Evitar sessões de alto impacto no mesmo dia de treino de corrida longa.', objetivos: 'Fortalecimento de core, mobilidade de quadril, prevenção de novas tendinites.', evolucoes: [{ id: 'ev1', date: d(-240), text: 'Avaliação inicial. Força muscular excelente. Mobilidade de quadril limitada bilateralmente. Iniciando protocolo avançado.', professional: 'Dra. Fernanda' }, { id: 'ev2', date: d(-120), text: 'Progressão para nível avançado. Teaser, Side Kick e Boomerang introduzidos com sucesso. Quadril com mobilidade melhorada.', professional: 'Dra. Fernanda' }, { id: 'ev3', date: d(-5), text: 'Laserterapia preventiva joelho direito (4J/cm²). Sem sintomas ativos. Sessão de manutenção. Performance mantida.', professional: 'Dra. Fernanda' }] },
  p6: { patientId: 'p6', anamnese: 'Bailarina clássica desde os 5 anos. Parou de dançar há 2 anos por lesões recorrentes de tornozelo. Hipermobilidade generalizada (Beighton 7/9). Sem medicações.', queixaPrincipal: 'Dor lombar e instabilidade articular generalizada. Histórico de entorses repetidos de tornozelo.', historico: 'Formação em ballet clássico de alto nível. Hipermobilidade identificada na avaliação inicial — contexto clínico oposto ao usual: foco total em estabilização. Sem cirurgias.', restricoes: 'Contraindicado estimular mobilidade articular. Foco em ativação de estabilizadores profundos. Evitar hiperextensão de joelhos e cotovelos.', objetivos: 'Estabilização articular, fortalecimento de estabilizadores, redução de dor lombar.', evolucoes: [{ id: 'ev1', date: d(-10), text: 'Avaliação inicial. Hipermobilidade grau severo. Instabilidade lombo-pélvica. Iniciando ativação básica com foco em padrões de estabilização.', professional: 'Dra. Fernanda' }] },
  p7: { patientId: 'p7', anamnese: 'Professora de ensino fundamental, 43 anos. Artrose inicial de joelho bilateral (Kellgren-Lawrence Grau 1-2 em RX). IMC 26. Sem medicações contínuas.', queixaPrincipal: 'Dor nos joelhos ao subir/descer escadas e após longos períodos sentada. Crepitação palpável.', historico: 'Diagnóstico de gonartrose leve em 2023. Tentativa prévia de fisioterapia convencional abandonada por incompatibilidade de horário. Iniciou pilates em Mar/2024 mas abandonou após 3 sessões.', restricoes: 'Sem exercícios de impacto. Foco em fortalecimento de quadríceps e glúteo médio.', objetivos: 'Controle da dor, fortalecimento peri-articular, retardo na progressão da artrose.', evolucoes: [{ id: 'ev1', date: d(-180), text: 'Avaliação inicial. Força quadríceps 3/5 bilateral. Crepitação bilateral. Iniciando protocolo artrose com fortalecimento em cadeia cinética fechada.', professional: 'Dra. Juliana' }, { id: 'ev2', date: d(-90), text: 'Última evolução registrada. Paciente faltou à sessão sem aviso e não retornou contatos. Protocolo em aberto.', professional: 'Dra. Juliana' }] },
  p8: { patientId: 'p8', anamnese: 'Fibromialgia diagnosticada em 2020 (critérios ACR 2010 — 18 tender points ativos). Hipotireoidismo controlado. Medicação: Duloxetina 60mg, Levotiroxina 50mcg, Amitriptilina 25mg (noturno).', queixaPrincipal: 'Dor muscular difusa, fadiga crônica e distúrbio do sono. EVA 6-8/10 em crises.', historico: 'Fibromialgia com diagnóstico tardio (6 anos de sofrimento antes do diagnóstico). Diversas abordagens farmacológicas com resposta parcial. Pilates iniciado em Ago/2023 como terapia adjuvante — melhor resposta de todas as intervenções até hoje.', restricoes: 'Evitar sessões de alta intensidade. Adaptar sempre ao estado do dia — pergunta EVA ao início de cada sessão.', objetivos: 'Manutenção da funcionalidade, redução da dor global, melhora do sono e qualidade de vida.', evolucoes: [{ id: 'ev1', date: d(-365), text: 'Avaliação inicial. EVA 7/10 difusa. Sono muito fragmentado. Protocolo de baixa intensidade iniciado.', professional: 'Dra. Marina' }, { id: 'ev2', date: d(-180), text: 'Melhora progressiva. EVA 5/10. Sono melhorado. Reumatologista reduziu Amitriptilina para 25mg.', professional: 'Dra. Marina' }, { id: 'ev3', date: d(-30), text: 'Fase de manutenção consolidada. EVA 3-4/10. Paciente declarou: "vivo melhor desde que comecei aqui". 2x/semana mantidas.', professional: 'Dra. Marina' }, { id: 'ev4', date: d(-2), text: 'Dia bom — EVA 3/10. Pequeno aumento de carga bem tolerado. Resistência notavelmente melhorada.', professional: 'Dra. Marina' }] },
  p9: { patientId: 'p9', anamnese: 'CEO, sedentarismo importante. Hérnia cervical C5-C6 com compressão radicular confirmada por RNM (Mar/2026). HAS leve controlada (Losartana 50mg). Sem outras medicações.', queixaPrincipal: 'Dor cervical EVA 6/10 com parestesia (formigamento) em braço e mão direita. Piora ao final do dia.', historico: 'Encaminhado pelo Dr. Alexandre Gomes (neurocirurgião — InVita Neurologia) para tratamento conservador com avaliação cirúrgica em 90 dias. Trabalha 12-14h/dia à frente de computadores.', restricoes: 'Sem carga axial cervical. Evitar flexão cervical extrema. Sem impacto. Monitorar sintomas neurológicos a cada sessão.', objetivos: 'Descompressão radicular, controle da dor, conscientização postural, evitar cirurgia.', evolucoes: [{ id: 'ev1', date: d(-4), text: 'Primeira sessão osteopatia cervical. Avaliação completa. Mobilização suave C5-C6 + inibição suboccipital. EVA 6→4. Paciente surpreendido com o alívio imediato. Muito motivado.', professional: 'Dra. Juliana' }] },
  p10: { patientId: 'p10', anamnese: 'Pós-parto vaginal espontâneo há 7 meses (sem episiotomia). Diastase abdominal grau 2 — distância interretal ~3cm na linha alba. Amamentando. Liberada pela Dra. Patrícia Yamamoto (ginecologia) para pilates solo.', queixaPrincipal: 'Lombalgia pós-parto, diastase abdominal grau 2, fraqueza de assoalho pélvico. Dor 4/10.', historico: 'Gestação sem intercorrências. Diastase identificada na consulta de revisão de puerpério (6 semanas pós-parto). Primigesta. Nunca praticou pilates. Fisicamente ativa antes da gestação.', restricoes: 'Sem exercícios de alta pressão intra-abdominal (crunch, sit-up, prancha convencional). Sem corrida. Progressão gradual e criteriosa.', objetivos: 'Fechamento da diastase, fortalecimento de core e assoalho pélvico, resolução da lombalgia.', evolucoes: [{ id: 'ev1', date: d(-3), text: 'Avaliação inicial pós-parto. Diastase 3cm. Transverso com ativação fraca mas coordenada. Instabilidade lombo-pélvica. Protocolo iniciado com respiração 360° e imprint.', professional: 'Dra. Marina' }] },
}

const INITIAL_PLANS = [
  { id: 'pl1', name: 'Protocolo Lombalgia', description: 'Reabilitação e prevenção de recidivas para dor lombar postural e funcional.', level: 'Iniciante', sessions: 12, exercises: [{ id: 'e1', name: 'Respiração Diafragmática', series: '3', reps: '10 resp', notes: 'Expansão costal lateral' }, { id: 'e2', name: 'Pelvic Curl', series: '3', reps: '10', notes: 'Vértebra a vértebra' }, { id: 'e3', name: 'Single Leg Stretch', series: '2', reps: '10 cada', notes: 'Joelhos a 90°' }, { id: 'e4', name: 'Cat-Cow', series: '3', reps: '8', notes: 'Sincronizar com respiração' }, { id: 'e5', name: 'Swan Modificado', series: '2', reps: '6', notes: 'Extensão confortável, sem hiperextensão' }] },
  { id: 'pl2', name: 'Fortalecimento Core Avançado', description: 'Estabilização lombo-pélvica e fortalecimento de core profundo para nível intermediário/avançado.', level: 'Intermediário', sessions: 16, exercises: [{ id: 'e1', name: 'Hundred', series: '2', reps: '100 batimentos', notes: 'Pernas a 45°' }, { id: 'e2', name: 'Roll-Up', series: '3', reps: '10', notes: 'Articulação total da coluna' }, { id: 'e3', name: 'Teaser Preparatório', series: '3', reps: '8', notes: 'Progressão gradual' }, { id: 'e4', name: 'Crisscross', series: '3', reps: '16', notes: 'Rotação oblíqua controlada' }, { id: 'e5', name: 'Leg Pull Front', series: '2', reps: '6 cada', notes: 'Estabilização escapular ativa' }] },
  { id: 'pl3', name: 'Pós-operatório Membros Inferiores', description: 'Protocolo de reabilitação para pós-op de joelho e tornozelo — fases 1 e 2 progressivas.', level: 'Iniciante', sessions: 20, exercises: [{ id: 'e1', name: 'Isométrico de Quadríceps', series: '3', reps: '10s cada', notes: 'Contração sustentada' }, { id: 'e2', name: 'SLR — Elevação Perna Estendida', series: '3', reps: '15', notes: 'Ângulo de 45°' }, { id: 'e3', name: 'Mini Agachamento', series: '3', reps: '15', notes: 'Até 60° de flexão' }, { id: 'e4', name: 'Step-Up', series: '3', reps: '12', notes: 'Degrau de 20-30cm' }, { id: 'e5', name: 'Leg Press Bilateral', series: '3', reps: '15', notes: 'Carga progressiva conforme resposta' }] },
  { id: 'pl4', name: 'Reabilitação Pós-Parto', description: 'Protocolo específico para puerpério — diastase abdominal, assoalho pélvico e lombalgia pós-gestacional.', level: 'Iniciante', sessions: 16, exercises: [{ id: 'e1', name: 'Respiração 360°', series: '3', reps: '10 resp', notes: 'Expansão 3D — frente, lado e dorso' }, { id: 'e2', name: 'Imprint — Ativação Transverso', series: '3', reps: '10s', notes: 'Contração suave, sem apneia' }, { id: 'e3', name: 'Bridge Preparatório', series: '3', reps: '10', notes: 'Sem hiperlordose no topo' }, { id: 'e4', name: 'Side-Lying Clam', series: '2', reps: '15 cada', notes: 'Ativação de glúteo médio' }, { id: 'e5', name: 'Bird Dog', series: '2', reps: '8 cada', notes: 'Controle pélvico durante o movimento' }] },
]

const INITIAL_SERVICOS = SERVICOS_DEFAULT.map(s => ({ ...s }))

const INITIAL_PROFESSIONALS = [
  { id: 'prof1', name: 'Marina Oliveira', role: 'Fisioterapeuta · Pilates', serviceIds: ['sv1'], phone: '(11) 99100-2030', email: 'marina@libertese.com', active: true, color: '#7b5cff', notes: '', createdAt: '2024-01-10' },
  { id: 'prof2', name: 'Juliana Santos', role: 'Osteopata', serviceIds: ['sv2'], phone: '(11) 99200-3040', email: 'juliana@libertese.com', active: true, color: '#d936d6', notes: '', createdAt: '2024-02-15' },
  { id: 'prof3', name: 'Fernanda Costa', role: 'Terapeuta Manual', serviceIds: ['sv3', 'sv4'], phone: '(11) 99300-4050', email: 'fernanda@libertese.com', active: true, color: '#36c7e8', notes: '', createdAt: '2024-03-20' },
]

const INITIAL_ROOMS = [
  { id: 'room1', name: 'Sala Pilates', number: '1', active: true, notes: 'Reformer + Solo' },
  { id: 'room2', name: 'Sala Osteopatia', number: '2', active: true, notes: 'Maca articulada' },
  { id: 'room3', name: 'Sala Terapias', number: '3', active: true, notes: 'Mesa de massagem' },
]

// maps legacy professional string → professionalId for migration
const PROF_NAME_MAP = {
  'Dra. Marina': 'prof1',
  'Marina Oliveira': 'prof1',
  'Dra. Juliana': 'prof2',
  'Juliana Santos': 'prof2',
  'Dra. Fernanda': 'prof3',
  'Fernanda Costa': 'prof3',
}

const ROOM_DEFAULT_MAP = {
  'sv1': 'room1',
  'sv2': 'room2',
  'sv3': 'room3',
  'sv4': 'room3',
}

function migrateAgendaSlots(slots) {
  return slots.map(s => ({
    ...s,
    professionalId: s.professionalId || PROF_NAME_MAP[s.professional] || null,
    roomId: s.roomId || ROOM_DEFAULT_MAP[s.serviceId] || null,
  }))
}

// ─── Storage helpers ─────────────────────────────────────────────────────────

function loadFromStorage(key, fallback) {
  try {
    const saved = localStorage.getItem(`clinic_${key}`)
    return saved ? JSON.parse(saved) : fallback
  } catch {
    return fallback
  }
}

function saveToStorage(key, value) {
  try {
    localStorage.setItem(`clinic_${key}`, JSON.stringify(value))
  } catch {}
}

// ─── Provider ────────────────────────────────────────────────────────────────

export function AppProvider({ children }) {
  const [patients, setPatients] = useState(() => loadFromStorage('patients', INITIAL_PATIENTS))
  const [agendaSlots, setAgendaSlots] = useState(() => migrateAgendaSlots(loadFromStorage('agenda', INITIAL_AGENDA)))
  const [financeiro, setFinanceiro] = useState(() => loadFromStorage('financeiro', INITIAL_FINANCEIRO))
  const [prontuarios, setProntuarios] = useState(() => loadFromStorage('prontuarios', INITIAL_PRONTUARIOS))
  const [plans, setPlans] = useState(() => loadFromStorage('plans', INITIAL_PLANS))
  const [servicos, setServicos] = useState(() => loadFromStorage('servicos', INITIAL_SERVICOS))
  const [clinicalMaps, setClinicalMaps] = useState(() => loadFromStorage('clinical_maps', {}))
  const [professionals, setProfessionals] = useState(() => loadFromStorage('professionals', INITIAL_PROFESSIONALS))
  const [rooms, setRooms] = useState(() => loadFromStorage('rooms', INITIAL_ROOMS))
  const [toasts, setToasts] = useState([])

  useEffect(() => { saveToStorage('patients', patients) }, [patients])
  useEffect(() => { saveToStorage('agenda', agendaSlots) }, [agendaSlots])
  useEffect(() => { saveToStorage('financeiro', financeiro) }, [financeiro])
  useEffect(() => { saveToStorage('prontuarios', prontuarios) }, [prontuarios])
  useEffect(() => { saveToStorage('plans', plans) }, [plans])
  useEffect(() => { saveToStorage('servicos', servicos) }, [servicos])
  useEffect(() => { saveToStorage('clinical_maps', clinicalMaps) }, [clinicalMaps])
  useEffect(() => { saveToStorage('professionals', professionals) }, [professionals])
  useEffect(() => { saveToStorage('rooms', rooms) }, [rooms])

  const showToast = useCallback((msg, type = 'success') => {
    const id = Date.now()
    setToasts(t => [...t, { id, msg, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500)
  }, [])

  useEffect(() => { registerToastHandler(showToast) }, [showToast])

  // ── Patients ──────────────────────────────────────────────────────────────
  const addPatient = useCallback((data) => {
    const p = { ...data, id: `p${Date.now()}`, joinDate: data.joinDate || new Date().toISOString().slice(0, 10) }
    setPatients(prev => [p, ...prev])
    showToast('Paciente cadastrado com sucesso!')
    return p
  }, [showToast])

  const updatePatient = useCallback((id, data) => {
    setPatients(prev => prev.map(p => p.id === id ? { ...p, ...data } : p))
    showToast('Paciente atualizado!')
  }, [showToast])

  const deletePatient = useCallback((id) => {
    setPatients(prev => prev.filter(p => p.id !== id))
    showToast('Paciente removido.', 'error')
  }, [showToast])

  // ── Agenda / Sessions ─────────────────────────────────────────────────────
  const addAgendaSlot = useCallback((data) => {
    const slot = {
      ...data, id: `ag${Date.now()}`,
      notasInternas: '', relatorioParaPaciente: '',
      dorAntes: null, dorDepois: null,
      evolucao: '', exercicios: '', recomendacoes: '', retorno: '',
    }
    setAgendaSlots(prev => [...prev, slot])
    showToast('Consulta agendada!')
    return slot
  }, [showToast])

  const updateAgendaSlot = useCallback((id, data) => {
    setAgendaSlots(prev => prev.map(s => s.id === id ? { ...s, ...data } : s))
    showToast('Consulta atualizada!')
  }, [showToast])

  const deleteAgendaSlot = useCallback((id) => {
    setAgendaSlots(prev => prev.filter(s => s.id !== id))
    showToast('Consulta removida.', 'error')
  }, [showToast])

  const saveSessionNotes = useCallback((id, notes) => {
    setAgendaSlots(prev => prev.map(s => s.id === id ? { ...s, ...notes } : s))
    showToast('Notas da sessão salvas!')
  }, [showToast])

  const savePostSessionReport = useCallback((slotId, report) => {
    const now = new Date().toISOString()
    setAgendaSlots(prev => prev.map(s =>
      s.id === slotId
        ? { ...s, postSessionReport: { ...report, updatedAt: now, createdAt: s.postSessionReport?.createdAt || now } }
        : s
    ))
    showToast('Relatório pós-sessão salvo!')
  }, [showToast])

  // ── Prontuário ────────────────────────────────────────────────────────────
  const getProntuario = useCallback((patientId) => {
    return prontuarios[patientId] || {
      patientId, anamnese: '', queixaPrincipal: '', historico: '',
      restricoes: '', objetivos: '', evolucoes: [],
    }
  }, [prontuarios])

  const updateProntuario = useCallback((patientId, data) => {
    setProntuarios(prev => ({ ...prev, [patientId]: { ...prev[patientId], patientId, ...data } }))
    showToast('Prontuário salvo!')
  }, [showToast])

  const addEvolucao = useCallback((patientId, texto, professional) => {
    const ev = { id: `ev${Date.now()}`, date: new Date().toISOString().slice(0, 10), text: texto, professional }
    setProntuarios(prev => ({
      ...prev,
      [patientId]: {
        ...prev[patientId],
        patientId,
        evolucoes: [ev, ...(prev[patientId]?.evolucoes || [])],
      }
    }))
    showToast('Evolução registrada!')
  }, [showToast])

  const getBodyMap = useCallback((patientId) => {
    const patient = patients.find(p => p.id === patientId)
    return clinicalMaps[patientId] || getDefaultBodyMap(patient)
  }, [clinicalMaps, patients])

  const saveBodyMap = useCallback((patientId, data) => {
    setClinicalMaps(prev => ({ ...prev, [patientId]: data }))
    showToast('Mapa corporal atualizado!')
  }, [showToast])

  // ── Financeiro ────────────────────────────────────────────────────────────
  const addTransacao = useCallback((data) => {
    const t = { ...data, id: `fin${Date.now()}` }
    setFinanceiro(prev => [t, ...prev])
    showToast('Transação registrada!')
    return t
  }, [showToast])

  const updateTransacao = useCallback((id, data) => {
    setFinanceiro(prev => prev.map(t => t.id === id ? { ...t, ...data } : t))
    showToast('Transação atualizada!')
  }, [showToast])

  const deleteTransacao = useCallback((id) => {
    setFinanceiro(prev => prev.filter(t => t.id !== id))
    showToast('Transação removida.', 'error')
  }, [showToast])

  // ── Serviços ──────────────────────────────────────────────────────────────
  const addServico = useCallback((data) => {
    const s = { ...data, id: `sv${Date.now()}` }
    setServicos(prev => [...prev, s])
    showToast('Serviço criado!')
    return s
  }, [showToast])

  const updateServico = useCallback((id, data) => {
    setServicos(prev => prev.map(s => s.id === id ? { ...s, ...data } : s))
    showToast('Serviço atualizado!')
  }, [showToast])

  const deleteServico = useCallback((id) => {
    setServicos(prev => prev.filter(s => s.id !== id))
    showToast('Serviço removido.', 'error')
  }, [showToast])

  // ── Planos ────────────────────────────────────────────────────────────────
  const addPlan = useCallback((data) => {
    const p = { ...data, id: `pl${Date.now()}` }
    setPlans(prev => [...prev, p])
    showToast('Plano criado!')
    return p
  }, [showToast])

  const updatePlan = useCallback((id, data) => {
    setPlans(prev => prev.map(p => p.id === id ? { ...p, ...data } : p))
    showToast('Plano atualizado!')
  }, [showToast])

  const deletePlan = useCallback((id) => {
    setPlans(prev => prev.filter(p => p.id !== id))
    showToast('Plano removido.', 'error')
  }, [showToast])

  // ── Professionals ─────────────────────────────────────────────────────────
  const addProfessional = useCallback((data) => {
    const p = { ...data, id: `prof${Date.now()}`, createdAt: new Date().toISOString().slice(0, 10) }
    setProfessionals(prev => [...prev, p])
    showToast('Profissional cadastrado!')
    return p
  }, [showToast])

  const updateProfessional = useCallback((id, data) => {
    setProfessionals(prev => prev.map(p => p.id === id ? { ...p, ...data } : p))
    showToast('Profissional atualizado!')
  }, [showToast])

  const deleteProfessional = useCallback((id) => {
    setProfessionals(prev => prev.filter(p => p.id !== id))
    showToast('Profissional removido.', 'error')
  }, [showToast])

  // ── Rooms ─────────────────────────────────────────────────────────────────
  const addRoom = useCallback((data) => {
    const r = { ...data, id: `room${Date.now()}` }
    setRooms(prev => [...prev, r])
    showToast('Sala cadastrada!')
    return r
  }, [showToast])

  const updateRoom = useCallback((id, data) => {
    setRooms(prev => prev.map(r => r.id === id ? { ...r, ...data } : r))
    showToast('Sala atualizada!')
  }, [showToast])

  const deleteRoom = useCallback((id) => {
    setRooms(prev => prev.filter(r => r.id !== id))
    showToast('Sala removida.', 'error')
  }, [showToast])

  // ── Helpers ───────────────────────────────────────────────────────────────
  const getPatientById = useCallback((id) => patients.find(p => p.id === id), [patients])
  const getServicoById = useCallback((id) => servicos.find(s => s.id === id), [servicos])
  const getProfessionalById = useCallback((id) => professionals.find(p => p.id === id), [professionals])
  const getRoomById = useCallback((id) => rooms.find(r => r.id === id), [rooms])
  const getSlotsForPatient = useCallback((patientId) => agendaSlots.filter(s => s.patientId === patientId), [agendaSlots])
  const getSlotsForDate = useCallback((date) => agendaSlots.filter(s => s.date === date).sort((a, b) => a.time.localeCompare(b.time)), [agendaSlots])

  return (
    <AppContext.Provider value={{
      // State
      patients, agendaSlots, financeiro, prontuarios, plans, servicos, clinicalMaps,
      professionals, rooms, toasts,
      // Patient ops
      addPatient, updatePatient, deletePatient, getPatientById,
      // Agenda ops
      addAgendaSlot, updateAgendaSlot, deleteAgendaSlot, saveSessionNotes, savePostSessionReport,
      getSlotsForDate, getSlotsForPatient,
      // Prontuário ops
      getProntuario, updateProntuario, addEvolucao, getBodyMap, saveBodyMap,
      // Financeiro ops
      addTransacao, updateTransacao, deleteTransacao,
      // Serviços ops
      addServico, updateServico, deleteServico, getServicoById,
      // Planos ops
      addPlan, updatePlan, deletePlan,
      // Professionals ops
      addProfessional, updateProfessional, deleteProfessional, getProfessionalById,
      // Rooms ops
      addRoom, updateRoom, deleteRoom, getRoomById,
      // Utils
      showToast,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
