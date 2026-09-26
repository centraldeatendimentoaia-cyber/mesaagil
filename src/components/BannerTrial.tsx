import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { PaywallModal } from './PaywallModal'
import { textoTempoRestante } from '../lib/tempoTrial'
import type { AssinaturaBarraca } from '../types/database'

/** Banner fixo de trial — só aparece pro dono, só durante `trialing`.
 * Nunca some sozinho: o dono decide quando assinar tocando aqui. */
export function BannerTrial({ assinatura }: { assinatura: AssinaturaBarraca }) {
  const [abertoPaywall, setAbertoPaywall] = useState(false)
  const texto = textoTempoRestante(assinatura.trial_ends_at)

  if (!texto) return null

  return (
    <>
      <button
        type="button"
        onClick={() => setAbertoPaywall(true)}
        className="flex min-h-11 w-full items-center justify-center gap-2 bg-mesa-orange-500 px-4 py-2 text-center text-sm font-medium text-mesa-neutral-900"
      >
        <Sparkles className="size-4 shrink-0" aria-hidden />
        {texto} · Assinar agora
      </button>
      <PaywallModal open={abertoPaywall} onClose={() => setAbertoPaywall(false)} assinatura={assinatura} />
    </>
  )
}
