/**
 * sons.ts — sons de notificação sintetizados via Web Audio API.
 *
 * Sem arquivos de áudio, sem dependências. Funciona 100% offline, como
 * exigem as telas de lançar pedido e cozinha.
 *
 * Os navegadores só liberam a reprodução de áudio depois de um gesto do
 * usuário (política de autoplay) e limitam quantos AudioContext podem
 * existir ao mesmo tempo. Por isso mantemos UM único contexto (singleton
 * de módulo), criado sob demanda e "destravado" uma vez no primeiro
 * toque/clique via `desbloquearAudio()`.
 */

type FormaOnda = 'sine' | 'triangle'

let contextoAudio: AudioContext | null = null

/** Obtém (ou cria) o AudioContext compartilhado. Nunca lança erro. */
function obterContexto(): AudioContext | null {
  if (contextoAudio) return contextoAudio

  const ClasseAudioContext =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext

  if (!ClasseAudioContext) return null

  try {
    contextoAudio = new ClasseAudioContext()
  } catch {
    contextoAudio = null
  }

  return contextoAudio
}

/**
 * Deve ser chamada uma vez no primeiro gesto do usuário (pointerdown ou
 * click) para criar/retomar o AudioContext compartilhado. Idempotente:
 * pode ser chamada várias vezes sem efeito colateral.
 */
export function desbloquearAudio(): void {
  const ctx = obterContexto()
  if (!ctx) return

  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {
      // Ignorado: se não conseguir retomar agora, tenta na próxima chamada.
    })
  }
}

/**
 * Toca uma única nota (oscilador + envelope de ganho) e limpa os nós ao
 * final, sem deixar vazamentos mesmo em chamadas rápidas e repetidas.
 */
function tocarNota(
  ctx: AudioContext,
  frequenciaHz: number,
  inicio: number,
  duracaoSegundos: number,
  forma: FormaOnda,
  volumePico: number,
): void {
  const oscilador = ctx.createOscillator()
  const ganho = ctx.createGain()

  oscilador.type = forma
  oscilador.frequency.setValueAtTime(frequenciaHz, inicio)

  // Envelope curto: ataque rápido, decaimento suave (evita clique/estalo).
  const ataque = 0.015
  ganho.gain.setValueAtTime(0, inicio)
  ganho.gain.linearRampToValueAtTime(volumePico, inicio + ataque)
  ganho.gain.exponentialRampToValueAtTime(0.0001, inicio + duracaoSegundos)

  oscilador.connect(ganho)
  ganho.connect(ctx.destination)

  oscilador.start(inicio)
  oscilador.stop(inicio + duracaoSegundos + 0.02)

  oscilador.onended = () => {
    oscilador.disconnect()
    ganho.disconnect()
  }
}

/** Retorna o contexto pronto pra tocar, ou null se indisponível/travado. */
function contextoPronto(): AudioContext | null {
  const ctx = obterContexto()
  if (!ctx || ctx.state !== 'running') return null
  return ctx
}

/**
 * Som de SUCESSO ao lançar um pedido: duas notas curtas ascendentes,
 * quentes e discretas (toca a cada pedido enviado, não pode cansar).
 */
export function tocarSomPedidoCriado(): void {
  const ctx = contextoPronto()
  if (!ctx) return

  const agora = ctx.currentTime
  tocarNota(ctx, 880, agora, 0.11, 'sine', 0.22) // A5
  tocarNota(ctx, 1318.5, agora + 0.09, 0.14, 'sine', 0.22) // E6
}

/**
 * Som de ATENÇÃO na tela da cozinha: dois toques curtos na mesma altura,
 * perceptível em ambiente barulhento sem soar como alarme.
 */
export function tocarSomPedidoNaCozinha(): void {
  const ctx = contextoPronto()
  if (!ctx) return

  const agora = ctx.currentTime
  tocarNota(ctx, 740, agora, 0.09, 'triangle', 0.26)
  tocarNota(ctx, 740, agora + 0.14, 0.09, 'triangle', 0.26)
}

/**
 * Som de CHAMADA de senha pronta: sino de recepção — mais brilhante e
 * com decaimento mais longo, pra alcançar a área de espera.
 */
export function tocarSomPedidoNaChamada(): void {
  const ctx = contextoPronto()
  if (!ctx) return

  const agora = ctx.currentTime
  tocarNota(ctx, 1046.5, agora, 0.55, 'sine', 0.3) // C6, corpo do sino
  tocarNota(ctx, 2093, agora, 0.35, 'sine', 0.12) // C7, brilho harmônico
}
