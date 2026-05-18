/**
 * Serviço de WhatsApp — MOCKADO
 *
 * Arquitetura preparada para integração futura com:
 * - WhatsApp Business API (Meta)
 * - Z-API / WPPConnect / Evolution API
 *
 * Para produção: substituir os console.log por chamadas HTTP reais.
 */

import { showToastGlobal } from '../toast'

function formatPhone(phone) {
  return phone.replace(/\D/g, '')
}

function buildWhatsAppURL(phone, message) {
  const cleaned = formatPhone(phone)
  const encoded = encodeURIComponent(message)
  return `https://wa.me/55${cleaned}?text=${encoded}`
}

export const whatsapp = {
  sendConfirmation(patient, slot, serviceName) {
    const msg = `Olá, ${patient.name.split(' ')[0]}! 😊\n\nSua consulta está confirmada:\n📅 Data: ${new Date(slot.date + 'T12:00').toLocaleDateString('pt-BR')}\n⏰ Horário: ${slot.time}\n💆 Serviço: ${serviceName}\n\nQualquer dúvida, estamos à disposição!\n\n— Studio Clínica`
    console.log('[WhatsApp MOCK] sendConfirmation', { patient, slot, msg })
    showToastGlobal(`Confirmação preparada para ${patient.name}`, 'success')
    return { ok: true, message: msg }
  },

  sendReminder(patient, slot, serviceName) {
    const msg = `Olá, ${patient.name.split(' ')[0]}! 🌿\n\nLembrando da sua consulta amanhã:\n⏰ ${slot.time} — ${serviceName}\n\nNos vemos em breve! 💙`
    console.log('[WhatsApp MOCK] sendReminder', { patient, slot, msg })
    showToastGlobal(`Lembrete preparado para ${patient.name}`, 'success')
    return { ok: true, message: msg }
  },

  sendSessionReport(patient, report) {
    const msg = `Olá, ${patient.name.split(' ')[0]}! 📋\n\nSegue o resumo da sua sessão de hoje:\n\n*Evolução:*\n${report.evolucao || '—'}\n\n*Recomendações:*\n${report.recomendacoes || '—'}\n\n*Exercícios para casa:*\n${report.exercicios || '—'}\n\n*Próximo retorno:*\n${report.retorno || 'A combinar'}\n\nQualquer dúvida estamos disponíveis! 🌱`
    console.log('[WhatsApp MOCK] sendSessionReport', { patient, report, msg })
    showToastGlobal(`Relatório preparado para ${patient.name}`, 'success')
    const url = buildWhatsAppURL(patient.phone, msg)
    window.open(url, '_blank')
    return { ok: true, url }
  },

  sendReturnReminder(patient, daysSinceLastSession) {
    const msg = `Olá, ${patient.name.split(' ')[0]}! 💚\n\nFaz ${daysSinceLastSession} dias desde sua última sessão conosco.\n\nQue tal agendar um retorno? Estamos com horários disponíveis! 📅\n\nResponda esta mensagem ou ligue para nós.`
    console.log('[WhatsApp MOCK] sendReturnReminder', { patient, msg })
    showToastGlobal(`Lembrete de retorno preparado para ${patient.name}`, 'success')
    return { ok: true, message: msg }
  },
}
