import { X } from 'lucide-react'
import { BottomSheet } from './ui/BottomSheet'
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
    <BottomSheet open={open} onClose={onClose} aria-label="Assinar o MesaAgil">
      <div className="mb-2 flex justify-end">
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="flex size-11 items-center justify-center rounded-mesa-full text-mesa-text-secondary hover:bg-[var(--mesa-state-hover-bg)]"
        >
          <X className="size-5" aria-hidden />
        </button>
      </div>
      <PaywallConteudo assinatura={assinatura} />
    </BottomSheet>
  )
}
