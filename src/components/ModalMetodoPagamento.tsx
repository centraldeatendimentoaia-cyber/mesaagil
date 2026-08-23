import { useEffect, useState } from 'react'
import { Banknote, CreditCard, QrCode } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { METODOS_DISPONIVEIS } from '../lib/metodoPagamento'
import type { MetodoPagamento } from '../lib/metodoPagamento'

const ICONES: Record<MetodoPagamento, LucideIcon> = {
  dinheiro: Banknote,
  debito: CreditCard,
  credito: CreditCard,
  pix: QrCode,
}

const CORES_ICONE_INATIVO: Record<MetodoPagamento, string> = {
  dinheiro: 'text-sinal-verde',
  debito: 'text-blue-600 dark:text-blue-400',
  credito: 'text-purple-600 dark:text-purple-400',
  pix: 'text-teal-600 dark:text-teal-400',
}

export function ModalMetodoPagamento({
  metodosAtivos,
  onCancelar,
  onConfirmar,
}: {
  metodosAtivos: string[]
  onCancelar: () => void
  onConfirmar: (metodo: MetodoPagamento) => void
}) {
  const [selecionado, setSelecionado] = useState<MetodoPagamento | null>(null)

  useEffect(() => {
    function aoTeclar(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancelar()
    }
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [onCancelar])

  const opcoes = METODOS_DISPONIVEIS.filter((m) => metodosAtivos.includes(m.chave))

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6"
      onClick={onCancelar}
    >
      <div
        className="w-full max-w-[400px] rounded-2xl bg-white p-6 dark:bg-neutral-900"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          Como o cliente vai pagar?
        </h2>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Escolha o método usado nessa comanda.
        </p>

        <div className="mt-4 flex flex-col gap-2">
          {opcoes.map((opcao) => {
            const Icone = ICONES[opcao.chave]
            const ativo = selecionado === opcao.chave
            return (
              <button
                key={opcao.chave}
                type="button"
                onClick={() => setSelecionado(opcao.chave)}
                className={`flex min-h-11 items-center gap-3 rounded-2xl px-4 text-base font-semibold transition-colors ${
                  ativo
                    ? 'bg-marca text-white'
                    : 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-100'
                }`}
              >
                <Icone size={20} className={ativo ? 'text-white' : CORES_ICONE_INATIVO[opcao.chave]} />
                {opcao.label}
              </button>
            )
          })}
        </div>

        <button
          type="button"
          onClick={onCancelar}
          className="mt-4 min-h-11 w-full rounded-2xl text-sm font-medium text-neutral-500 dark:text-neutral-400"
        >
          Voltar
        </button>
        <button
          type="button"
          onClick={() => selecionado && onConfirmar(selecionado)}
          disabled={!selecionado}
          className="mt-1 min-h-11 w-full rounded-2xl bg-marca text-base font-semibold text-marca-texto disabled:opacity-40"
        >
          OK
        </button>
      </div>
    </div>
  )
}
