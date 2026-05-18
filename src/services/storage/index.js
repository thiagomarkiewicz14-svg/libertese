/**
 * Serviço de Storage — MOCKADO
 *
 * Arquitetura preparada para integração futura com:
 * - Supabase Storage (buckets privados por prontuário)
 * - LGPD: arquivos vinculados ao patient_id com controle de acesso
 * - Criptografia em repouso para dados sensíveis
 *
 * Estrutura de buckets planejada:
 * - clinica/pacientes/{patient_id}/prontuario/
 * - clinica/pacientes/{patient_id}/sessoes/{session_id}/
 * - clinica/pacientes/{patient_id}/fotos/
 *
 * Para produção: substituir por chamadas ao Supabase Storage SDK.
 */

const MOCK_DELAY = 600

export const storage = {
  async uploadFile(file, path) {
    await new Promise(r => setTimeout(r, MOCK_DELAY))
    const mockUrl = URL.createObjectURL(file)
    console.log(`[Storage MOCK] Upload: ${path}`, { file, mockUrl })
    return {
      ok: true,
      url: mockUrl,
      path,
      name: file.name,
      size: file.size,
      type: file.type,
      uploadedAt: new Date().toISOString(),
    }
  },

  async deleteFile(path) {
    await new Promise(r => setTimeout(r, 300))
    console.log(`[Storage MOCK] Delete: ${path}`)
    return { ok: true }
  },

  async listFiles(prefix) {
    await new Promise(r => setTimeout(r, 400))
    console.log(`[Storage MOCK] List: ${prefix}`)
    return []
  },

  formatSize(bytes) {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  },

  isAllowedType(file) {
    const allowed = [
      'image/jpeg', 'image/png', 'image/webp',
      'video/mp4', 'video/quicktime',
      'audio/mpeg', 'audio/wav', 'audio/ogg',
      'application/pdf',
    ]
    return allowed.includes(file.type)
  },
}
