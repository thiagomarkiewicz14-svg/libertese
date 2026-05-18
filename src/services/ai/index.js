/**
 * Serviço de IA / Insights — MOCKADO
 *
 * Arquitetura preparada para integração futura com:
 * - Claude API (Anthropic) para insights clínicos
 * - OpenAI GPT-4 para análise de prontuários
 * - Modelos locais para LGPD compliance
 *
 * Para produção: substituir retornos mockados por chamadas à API.
 */

import { generateAutomations, generateClinicalInsights } from '../../domain/clinical'

export const ai = {
  async generateDailySummary({ patients, slots, financeiro }) {
    await new Promise(r => setTimeout(r, 800))

    const today = new Date().toISOString().slice(0, 10)
    const todaySlots = slots.filter(s => s.date === today)
    const realized = todaySlots.filter(s => s.status === 'Realizado').length
    const scheduled = todaySlots.filter(s => ['Agendado', 'Confirmado'].includes(s.status)).length

    return {
      summary: `Hoje você tem ${scheduled} consultas agendadas e ${realized} já realizadas. ` +
        `${realized > 0 ? 'Ótimo ritmo! ' : ''}` +
        `${patients.filter(p => p.status === 'Aguardando Retorno').length} pacientes aguardam retorno.`,
      insight: 'Dica: pacientes que retornam em até 7 dias têm 3x mais chances de aderir ao tratamento.',
    }
  },

  async inactivePatients({ patients, slots }) {
    await new Promise(r => setTimeout(r, 500))

    const today = new Date()
    return patients
      .filter(p => p.status !== 'Inativo')
      .map(p => {
        const lastSlot = slots
          .filter(s => s.patientId === p.id && s.status === 'Realizado')
          .sort((a, b) => b.date.localeCompare(a.date))[0]
        if (!lastSlot) return null
        const days = Math.floor((today - new Date(lastSlot.date)) / 86400000)
        return days > 30 ? { patient: p, daysSince: days, lastDate: lastSlot.date } : null
      })
      .filter(Boolean)
      .sort((a, b) => b.daysSince - a.daysSince)
  },

  async frequentNoShows({ patients, slots }) {
    await new Promise(r => setTimeout(r, 400))

    const countByPatient = {}
    slots.filter(s => s.status === 'Falta').forEach(s => {
      countByPatient[s.patientId] = (countByPatient[s.patientId] || 0) + 1
    })
    return Object.entries(countByPatient)
      .filter(([, count]) => count >= 2)
      .map(([patientId, count]) => ({
        patient: patients.find(p => p.id === patientId),
        noShowCount: count,
      }))
      .filter(x => x.patient)
      .sort((a, b) => b.noShowCount - a.noShowCount)
  },

  async revenueInsights({ financeiro }) {
    await new Promise(r => setTimeout(r, 600))

    const now = new Date()
    const thisMonth = now.toISOString().slice(0, 7)
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 7)

    const sum = (month, type) => financeiro
      .filter(f => f.date.startsWith(month) && f.type === type && f.status === 'Pago')
      .reduce((acc, f) => acc + f.value, 0)

    const thisRevenue = sum(thisMonth, 'Entrada')
    const lastRevenue = sum(lastMonth, 'Entrada')
    const growth = lastRevenue > 0 ? ((thisRevenue - lastRevenue) / lastRevenue * 100).toFixed(1) : null

    return {
      thisMonth: thisRevenue,
      lastMonth: lastRevenue,
      growth,
      insight: growth !== null
        ? `Receita ${growth >= 0 ? 'cresceu' : 'caiu'} ${Math.abs(growth)}% em relação ao mês anterior.`
        : 'Primeiro mês de dados — continue registrando para ver tendências.',
    }
  },

  async generateSessionNotes({ patient, service, prontuario }) {
    await new Promise(r => setTimeout(r, 1000))
    return {
      sugestao: `Sugestão baseada no histórico de ${patient.name.split(' ')[0]}: ` +
        `Focar em ${prontuario?.queixaPrincipal || 'queixa principal'} com abordagem progressiva. ` +
        `Considerar restrições registradas no prontuário.`,
    }
  },

  async clinicalInsights({ patients, slots }) {
    await new Promise(r => setTimeout(r, 650))
    return generateClinicalInsights({ patients, slots })
  },

  async automationSuggestions({ patients, slots }) {
    await new Promise(r => setTimeout(r, 450))
    return generateAutomations({ patients, slots })
  },
}
