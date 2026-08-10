import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useBarracaAtual } from '../layouts/LayoutBarraca'
import type { Item } from '../types/database'

type Carrinho = Record<string, number>

export function LancarPedido() {
  const barraca = useBarracaAtual()
  const [itens, setItens] = useState<Item[]>([])
  const [carregandoItens, setCarregandoItens] = useState(true)
  const [erroItens, setErroItens] = useState<string | null>(null)

  const [carrinho, setCarrinho] = useState<Carrinho>({})
  const [mesa, setMesa] = useState('')
  const [viagem, setViagem] = useState(false)
  const [observacao, setObservacao] = useState('')

  const [enviando, setEnviando] = useState(false)
  const [erroEnvio, setErroEnvio] = useState<string | null>(null)
  const [senha, setSenha] = useState<number | null>(null)

  const enviandoRef = useRef(false)

  useEffect(() => {
    let cancelado = false
    setCarregandoItens(true)
    setErroItens(null)

    supabase
      .from('itens')
      .select('*')
      .eq('barraca_id', barraca.id)
      .eq('ativo', true)
      .order('ordem')
      .then(({ data, error }) => {
        if (cancelado) return
        if (error) {
          setErroItens(error.message)
          setCarregandoItens(false)
          return
        }
        setItens((data ?? []) as Item[])
        setCarregandoItens(false)
      })

    return () => {
      cancelado = true
    }
  }, [barraca.id])

  const totalItens = useMemo(
    () => Object.values(carrinho).reduce((soma, quantidade) => soma + quantidade, 0),
    [carrinho],
  )

  function incrementar(itemId: string) {
    setCarrinho((atual) => ({ ...atual, [itemId]: (atual[itemId] ?? 0) + 1 }))
  }

  function decrementar(itemId: string) {
    setCarrinho((atual) => {
      const quantidadeAtual = atual[itemId] ?? 0
      if (quantidadeAtual <= 1) {
        const copia = { ...atual }
        delete copia[itemId]
        return copia
      }
      return { ...atual, [itemId]: quantidadeAtual - 1 }
    })
  }

  function limparFormulario() {
    setCarrinho({})
    setMesa('')
    setViagem(false)
    setObservacao('')
  }

  async function enviarPedido() {
    if (enviandoRef.current || totalItens === 0) return
    enviandoRef.current = true
    setEnviando(true)
    setErroEnvio(null)

    const clientUuid = crypto.randomUUID()

    const itensPedido = Object.entries(carrinho)
      .filter(([, quantidade]) => quantidade > 0)
      .map(([itemId, quantidade]) => ({
        item_id: itemId,
        nome_item: itens.find((item) => item.id === itemId)?.nome ?? '',
        quantidade,
      }))

    try {
      const { data, error } = await supabase
        .rpc('criar_pedido', {
          p_barraca_id: barraca.id,
          p_mesa: viagem ? null : mesa.trim() || null,
          p_viagem: viagem,
          p_observacao: observacao.trim() || null,
          p_client_uuid: clientUuid,
          p_itens: itensPedido,
        })
        .single()

      if (error) throw error

      setSenha((data as { pedido_id: string; senha: number }).senha)
      limparFormulario()
    } catch {
      setErroEnvio('Não foi possível enviar o pedido. Tente novamente.')
    } finally {
      enviandoRef.current = false
      setEnviando(false)
    }
  }

  if (senha !== null) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-white p-6 dark:bg-neutral-950">
        <p className="text-xl font-medium text-neutral-500 dark:text-neutral-400">Senha</p>
        <p className="text-[112px] font-bold leading-none text-marca">{senha}</p>
        <button
          type="button"
          onClick={() => {
            limparFormulario()
            setSenha(null)
          }}
          className="min-h-11 rounded-2xl bg-marca px-8 py-3 text-base font-semibold text-marca-texto active:bg-marca-escura"
        >
          Novo Pedido
        </button>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-neutral-950">
      <div className="flex-1 overflow-y-auto p-4 pb-40">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={mesa}
            onChange={(e) => setMesa(e.target.value)}
            disabled={viagem}
            placeholder={viagem ? 'Viagem (sem mesa)' : 'Mesa (opcional)'}
            className="h-11 flex-1 rounded-2xl border border-neutral-300 bg-white px-4 text-base text-neutral-900 placeholder:text-neutral-400 disabled:bg-neutral-100 disabled:text-neutral-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:disabled:bg-neutral-800"
          />

          <div className="flex shrink-0 items-center gap-2">
            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Viagem
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={viagem}
              aria-label="Viagem"
              onClick={() => setViagem((v) => !v)}
              className={`relative h-11 w-[72px] shrink-0 rounded-full p-1 transition-colors ${
                viagem ? 'bg-marca' : 'bg-neutral-300 dark:bg-neutral-700'
              }`}
            >
              <span
                className={`block h-9 w-9 rounded-full bg-white shadow transition-transform ${
                  viagem ? 'translate-x-7' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          {carregandoItens && (
            <p className="col-span-2 py-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
              Carregando cardápio...
            </p>
          )}

          {!carregandoItens && erroItens && (
            <p className="col-span-2 py-8 text-center text-sm text-red-600">
              Não foi possível carregar o cardápio.
            </p>
          )}

          {!carregandoItens && !erroItens && itens.length === 0 && (
            <p className="col-span-2 py-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
              Nenhum item cadastrado.
            </p>
          )}

          {!carregandoItens &&
            !erroItens &&
            itens.map((item) => {
              const quantidade = carrinho[item.id] ?? 0
              const selecionado = quantidade > 0

              return (
                <div key={item.id} className="relative">
                  <button
                    type="button"
                    onClick={() => incrementar(item.id)}
                    className={`min-h-16 w-full rounded-2xl px-3 py-3 text-base font-medium transition-colors ${
                      selecionado
                        ? 'bg-marca text-marca-texto'
                        : 'bg-neutral-100 text-neutral-900 active:bg-neutral-200 dark:bg-neutral-900 dark:text-neutral-100 dark:active:bg-neutral-800'
                    }`}
                  >
                    {item.nome}
                  </button>

                  {selecionado && (
                    <div className="absolute right-2 top-2 flex items-center gap-1">
                      <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-marca-texto/20 px-1.5 text-xs font-bold text-marca-texto">
                        {quantidade}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          decrementar(item.id)
                        }}
                        aria-label={`Remover uma unidade de ${item.nome}`}
                        className="flex size-11 items-center justify-center rounded-full bg-marca-texto/20 text-lg font-bold leading-none text-marca-texto"
                      >
                        −
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
        </div>

        <textarea
          value={observacao}
          onChange={(e) => setObservacao(e.target.value)}
          placeholder="Observação (opcional)"
          rows={2}
          className="mt-6 w-full resize-none rounded-2xl border border-neutral-300 bg-white p-3 text-base text-neutral-900 placeholder:text-neutral-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
        />

        {erroEnvio && <p className="mt-3 text-center text-sm text-red-600">{erroEnvio}</p>}
      </div>

      <div className="fixed inset-x-0 bottom-0 flex gap-3 border-t border-neutral-200 bg-white p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] dark:border-neutral-800 dark:bg-neutral-950">
        <button
          type="button"
          onClick={limparFormulario}
          className="min-h-11 basis-1/4 rounded-2xl bg-neutral-200 px-4 text-base font-medium text-neutral-800 active:bg-neutral-300 dark:bg-neutral-800 dark:text-neutral-100 dark:active:bg-neutral-700"
        >
          Limpar
        </button>
        <button
          type="button"
          onClick={enviarPedido}
          disabled={totalItens === 0 || enviando}
          className="min-h-11 basis-3/4 rounded-2xl bg-marca px-4 text-base font-semibold text-marca-texto active:bg-marca-escura disabled:opacity-40"
        >
          {enviando ? 'Enviando...' : `Enviar Pedido (${totalItens})`}
        </button>
      </div>
    </div>
  )
}
