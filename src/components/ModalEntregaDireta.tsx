import { CheckCheck } from 'lucide-react'
import { BottomSheet } from './ui/BottomSheet'
import { Button } from './ui/Button'

export function ModalEntregaDireta({
  senha,
  confirmando,
  onFechar,
  onConfirmar,
}: {
  senha: number
  confirmando: boolean
  onFechar: () => void
  onConfirmar: () => void
}) {
  return (
    <BottomSheet open onClose={onFechar} aria-label="Marcar comanda como entregue">
      <h2 className="text-lg font-semibold text-mesa-text-primary">
        Marcar comanda <span className="font-mesa-mono">#{senha}</span> como entregue?
      </h2>
      <p className="mt-1 text-sm text-mesa-text-secondary">
        Isso pula direto para Entregue, sem passar por Pronto. Use quando o pedido já está pronto
        pra sair (bebidas, itens rápidos).
      </p>

      <div className="mt-6 flex flex-col gap-2">
        <Button
          variant="confirm"
          size="xl"
          icon={<CheckCheck className="size-5" aria-hidden />}
          loading={confirmando}
          onClick={onConfirmar}
          className="w-full"
        >
          Confirmar entrega
        </Button>
        <Button variant="ghost" size="md" onClick={onFechar} className="w-full">
          Voltar
        </Button>
      </div>
    </BottomSheet>
  )
}
