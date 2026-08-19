import { useEffect, useState } from 'react'
import type { ChangeEvent } from 'react'
import { MOTIVOS_CANCELAMENTO } from '../lib/cancelamento'
import type { MotivoCancelamento } from '../lib/cancelamento'

export function ModalCancelamento({
  senha,
  cancelando,
  onFechar,
  onConfirmar,
}: {
  senha: number
  cancelando: boolean
  onFechar: () => void
  onConfirmar: (motivo: MotivoCancelamento) => void
}) {
  const [motivo, setMotivo] = useState<MotivoCancelamento | ''>('')

  useEffect(() => {
    function aoTeclar(e: KeyboardEvent) {
      if (e.key === 'Escape') onFechar()
    }
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [onFechar])

  function aoMudarMotivo(e: ChangeEvent<HTMLSelectElement>) {
    setMotivo(e.target.value as MotivoCancelamento)
  }

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
          Cancelar comanda #{senha}?
        </h2>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Essa ação não pode ser desfeita.
        </p>

        <label className="mt-4 block">
          <span className="text-sm text-neutral-600 dark:text-neutral-400">
            Motivo do cancelamento:
          </span>
          <select
            value={motivo}
            onChange={aoMudarMotivo}
            className="mt-1 h-11 w-full rounded-2xl border border-neutral-300 bg-white px-3 text-base text-neutral-900 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
          >
            <option value="" disabled>
              Escolha um motivo...
            </option>
            {MOTIVOS_CANCELAMENTO.map((opcao) => (
              <option key={opcao.valor} value={opcao.valor}>
                {opcao.rotulo}
              </option>
            ))}
          </select>
        </label>

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
            onClick={() => motivo && onConfirmar(motivo)}
            disabled={!motivo || cancelando}
            className="min-h-11 flex-1 rounded-2xl bg-sinal-vermelho text-base font-semibold text-white disabled:opacity-50"
          >
            Confirmar cancelamento
          </button>
        </div>
      </div>
    </div>
  )
}
