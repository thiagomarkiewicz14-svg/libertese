export const SERVICOS_DEFAULT = [
  {
    id: 'sv1', name: 'Pilates', color: '#2D7A5F', duration: 60, value: 150,
    description: 'Método Pilates com Reformer e Solo — reabilitação e condicionamento',
    category: 'Reabilitação',
  },
  {
    id: 'sv2', name: 'Osteopatia', color: '#1E3A5F', duration: 50, value: 280,
    description: 'Terapia manual osteopática — diagnóstico e tratamento de disfunções',
    category: 'Terapia Manual',
  },
  {
    id: 'sv3', name: 'Massagem Relaxante', color: '#7A4F8A', duration: 60, value: 180,
    description: 'Massagem terapêutica de relaxamento profundo e alívio de tensões',
    category: 'Terapias',
  },
  {
    id: 'sv4', name: 'Laserterapia', color: '#C47A3A', duration: 30, value: 130,
    description: 'Fototerapia com laser de baixa intensidade — analgesia e regeneração',
    category: 'Tecnologia',
  },
]

export const STATUS_PACIENTE = ['Ativo', 'Em Tratamento', 'Aguardando Retorno', 'Inativo']

export const STATUS_PACIENTE_COLOR = {
  'Ativo': 'success',
  'Em Tratamento': 'info',
  'Aguardando Retorno': 'warning',
  'Inativo': 'muted',
}

export const TAGS_PACIENTE = [
  'VIP', 'Indicação', 'Retorno pendente', 'Paciente novo',
  'Crônico', 'Pós-operatório', 'Convênio', 'Gestante',
]

export const ORIGENS = [
  'Indicação de paciente', 'Instagram', 'Google', 'Passagem/Vitrine',
  'Facebook', 'Médico parceiro', 'Outro',
]

export const FORMAS_PAGAMENTO = [
  'Pix', 'Cartão de Crédito', 'Cartão de Débito', 'Dinheiro', 'Transferência',
]

export const STATUS_AGENDAMENTO = ['Agendado', 'Confirmado', 'Realizado', 'Falta', 'Cancelado']

export const STATUS_AGENDAMENTO_COLOR = {
  'Agendado': 'muted',
  'Confirmado': 'info',
  'Realizado': 'success',
  'Falta': 'danger',
  'Cancelado': 'muted',
}

export const STATUS_FINANCEIRO = ['Pago', 'Pendente', 'Cancelado']

export const TIPO_FINANCEIRO = ['Entrada', 'Saída']

export const CATEGORIAS_DESPESA = [
  'Aluguel', 'Equipamentos', 'Marketing', 'Materiais clínicos',
  'Salários', 'Limpeza', 'Software', 'Outros',
]

export const ESCALA_DOR = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

export const NIVEL_PLANO = ['Iniciante', 'Intermediário', 'Avançado']

export const PROFISSIONAIS = ['Dra. Marina', 'Dra. Juliana', 'Dra. Fernanda', 'Dr. Rafael']

export const PROF_COLORS = [
  '#7b5cff', '#d936d6', '#36c7e8', '#2D7A5F',
  '#C47A3A', '#1E3A5F', '#7A4F8A', '#A83228',
]
