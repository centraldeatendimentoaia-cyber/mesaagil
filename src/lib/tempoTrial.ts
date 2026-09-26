/** Texto de urgência do trial a partir de trial_ends_at (vindo do banco —
 * a decisão de bloquear ou não nunca depende disso, só o texto exibido).
 * Retorna null quando já passou (a tela de "acabou" cuida desse caso). */
export function textoTempoRestante(trialEndsAt: string | null): string | null {
  if (!trialEndsAt) return null

  const restanteMs = new Date(trialEndsAt).getTime() - Date.now()
  if (restanteMs <= 0) return null

  const horas = Math.ceil(restanteMs / (1000 * 60 * 60))

  if (horas < 24) {
    return horas <= 1 ? 'Falta menos de 1 hora do seu teste grátis' : `Faltam ${horas} horas do seu teste grátis`
  }

  const dias = Math.ceil(horas / 24)
  return dias === 1 ? 'Falta 1 dia do seu teste grátis' : `Faltam ${dias} dias do seu teste grátis`
}
