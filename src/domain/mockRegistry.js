export const LOCAL_FIRST_MOCKS = Object.freeze({
  ai: {
    label: 'IA operacional local-first',
    owner: 'src/services/ai',
    productionPath: 'Substituir geradores locais por um orquestrador de IA com contexto clínico, auditoria e LGPD.',
  },
  whatsapp: {
    label: 'Mensagens preparadas localmente',
    owner: 'src/services/whatsapp',
    productionPath: 'Conectar a WhatsApp Business API ou provedor autorizado com templates e opt-in.',
  },
  pdf: {
    label: 'Prévia de relatório em tela',
    owner: 'src/components/reports',
    productionPath: 'Adicionar renderização PDF server-side/client-side com identidade da clínica.',
  },
  patientPortal: {
    label: 'Portal do paciente demonstrativo',
    owner: 'src/components/patient',
    productionPath: 'Publicar portal autenticado com permissões, histórico e prescrições reais.',
  },
  videos: {
    label: 'Biblioteca terapêutica demonstrativa',
    owner: 'src/domain/clinical.js',
    productionPath: 'Vincular vídeos, thumbnails e categorias a um CMS ou storage privado.',
  },
  automations: {
    label: 'Automações calculadas em memória',
    owner: 'src/domain/clinical.js',
    productionPath: 'Mover disparos para filas, agenda de tarefas e logs de comunicação.',
  },
  storage: {
    label: 'Storage local-first',
    owner: 'src/services/storage',
    productionPath: 'Conectar storage privado com buckets por paciente, assinatura de URL e auditoria.',
  },
})
