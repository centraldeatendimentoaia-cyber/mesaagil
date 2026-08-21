import { useEffect } from 'react'

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
  useEffect(() => {
    function aoTeclar(e: KeyboardEvent) {
      if (e.key === 'Escape') onFechar()
    }
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [onFechar])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6"
      onClick={onFechar}
    >
      <div
        className="w-full max-w-[400px] rounded-2xl bg-white p-6 dark:bg-neutral-900"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          Marcar comanda #{senha} como entregue?
        </h2>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Isso pula direto para Entregue, sem passar por Pronto. Use quando o pedido já está
          pronto pra sair (bebidas, itens rápidos).
        </p>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onFechar}
            className="min-h-11 flex-1 rounded-2xl bg-neutral-200 text-base font-medium text-neutral-800 dark:bg-neutral-800 dark:text-neutral-100"
          >
            Voltar
          </button>
          <button
            type="button"
            onClick={onConfirmar}
            disabled={confirmando}
            className="min-h-11 flex-1 rounded-2xl bg-sinal-verde text-base font-semibold text-white disabled:opacity-50"
          >
            Confirmar entrega
          </button>
        </div>
      </div>
    </div>
  )
}
