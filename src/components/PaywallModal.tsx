import { BottomSheet } from './ui/BottomSheet'
import { Icone } from './ui/Icone'
import { PaywallConteudo } from './PaywallConteudo'
import type { AssinaturaBarraca } from '../types/database'

export function PaywallModal({
  open,
  onClose,
  assinatura,
}: {
  open: boolean
  onClose: () => void
  assinatura: AssinaturaBarraca | null
}) {
  return (
    <BottomSheet open={open} onClose={onClose} aria-label="Assinar o Sai aê">
      <div className="mb-2 flex justify-end">
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="flex size-11 items-center justify-center rounded-mesa-full text-mesa-text-secondary hover:bg-[var(--mesa-state-hover-bg)]"
        >
          <Icone nome="close" size={20} />
        </button>
      </div>
      <PaywallConteudo assinatura={assinatura} />
    </BottomSheet>
  )
}
