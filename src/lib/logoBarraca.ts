import { supabase } from './supabase'

const BUCKET = 'logo-barraca'
const LARGURA_MAXIMA = 400
const QUALIDADE_JPEG = 0.85

/** Logo aparece pequeno (avatar ~44-64px) nas telas que a usam — 400px de
 * largura já sobra, evita subir foto de câmera de 3-5MB sem necessidade. */
async function redimensionar(arquivo: File): Promise<Blob> {
  const bitmap = await createImageBitmap(arquivo)
  const escala = Math.min(1, LARGURA_MAXIMA / bitmap.width)
  const largura = Math.round(bitmap.width * escala)
  const altura = Math.round(bitmap.height * escala)

  const canvas = document.createElement('canvas')
  canvas.width = largura
  canvas.height = altura
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas não suportado')
  ctx.drawImage(bitmap, 0, 0, largura, altura)

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Falha ao gerar imagem'))),
      'image/jpeg',
      QUALIDADE_JPEG,
    )
  })
}

function caminhoDoUrl(url: string): string | null {
  const marcador = `/object/public/${BUCKET}/`
  const indice = url.indexOf(marcador)
  return indice === -1 ? null : url.slice(indice + marcador.length)
}

export async function enviarLogoBarraca(barracaId: string, arquivo: File): Promise<string> {
  const blob = await redimensionar(arquivo)
  const caminho = `${barracaId}/logo-${Date.now()}.jpg`

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(caminho, blob, { contentType: 'image/jpeg', upsert: false })

  if (error) throw error

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(caminho)

  return publicUrl
}

/** Best-effort: nunca deve travar o fluxo de trocar o logo por causa da
 * limpeza do antigo. */
export async function apagarLogoBarraca(url: string): Promise<void> {
  const caminho = caminhoDoUrl(url)
  if (!caminho) return
  await supabase.storage.from(BUCKET).remove([caminho]).catch(() => {})
}
