import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useBarracaAtual, useSincronizacaoAtual } from '../layouts/contextoBarraca'
import { aoConcluirCriacaoPedido, enfileirar } from '../lib/fila'
import { formatarPrecoBR } from '../lib/preco'
import type { Item } from '../types/database'

type Carrinho = Record<string, number>

type SenhaConfirmada = {
  valor: number
  provisoria: boolean
  idFila?: string
}

function dataOperacaoAtual(): string {
  const agora = new Date()
  const ano = agora.getFullYear()
  const mes = String(agora.getMonth() + 1).padStart(2, '0')
  const dia = String(agora.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

/**
 * Número local, só para o operador ter o que falar/anotar enquanto o
 * pedido real ainda não sincronizou. Isolado por barraca e por dia,
 * mas NUNCA é escrito no banco nem comparado com a senha real — dois
 * dispositivos offline ao mesmo tempo podem gerar o mesmo número
 * provisório, e é por isso que a tela deixa isso muito claro.
 */
function proximoNumeroProvisorio(barracaId: string): number {
  const chave = `mesaagil:provisorio:${barracaId}:${dataOperacaoAtual()}`
  const atual = Number(window.localStorage.getItem(chave) ?? '0')
  const proximo = atual + 1
  window.localStorage.setItem(chave, String(proximo))
  return proximo
}

export function LancarPedido() {
  const barraca = useBarracaAtual()
  const { pendentes, online } = useSincronizacaoAtual()

  const [itens, setItens] = useState<Item[]>([])
  const [carregandoItens, setCarregandoItens] = useState(true)
  const [erroItens, setErroItens] = useState<string | null>(null)

  const [carrinho, setCarrinho] = useState<Carrinho>({})
  const [mesa, setMesa] = useState('')
  const [viagem, setViagem] = useState(false)
  const [observacao, setObservacao] = useState('')

  const [senha, setSenha] = useState<SenhaConfirmada | null>(null)

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

  useEffect(() => {
    if (!senha?.provisoria || !senha.idFila) return

    return aoConcluirCriacaoPedido(senha.idFila, (resultado) => {
      setSenha({ valor: resultado.senha, provisoria: false })
    })
  }, [senha])

  const totalItens = useMemo(
    () => Object.values(carrinho).reduce((soma, quantidade) => soma + quantidade, 0),
    [carrinho],
  )

  const totalCentavos = useMemo(
    () =>
      Object.entries(carrinho).reduce((soma, [itemId, quantidade]) => {
        const item = itens.find((i) => i.id === itemId)
        if (!item || item.preco_centavos <= 0) return soma
        return soma + item.preco_centavos * quantidade
      }, 0),
    [carrinho, itens],
  )

  const itensSemPreco = useMemo(
    () =>
      Object.entries(carrinho).filter(([itemId, quantidade]) => {
        if (quantidade <= 0) return false
        const item = itens.find((i) => i.id === itemId)
        return item !== undefined && item.preco_centavos <= 0
      }).length,
    [carrinho, itens],
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

    const clientUuid = crypto.randomUUID()
    const itensPedido = Object.entries(carrinho)
      .filter(([, quantidade]) => quantidade > 0)
      .map(([itemId, quantidade]) => {
        const item = itens.find((i) => i.id === itemId)
        return {
          item_id: itemId,
          nome_item: item?.nome ?? '',
          quantidade,
          preco_centavos_unitario: item?.preco_centavos ?? 0,
        }
      })

    const operacao = await enfileirar('criar_pedido', {
      p_barraca_id: barraca.id,
      p_mesa: viagem ? null : mesa.trim() || null,
      p_viagem: viagem,
      p_observacao: observacao.trim() || null,
      p_client_uuid: clientUuid,
      p_itens: itensPedido,
    })

    setSenha({ valor: proximoNumeroProvisorio(barraca.id), provisoria: true, idFila: operacao.id })
    limparFormulario()
    enviandoRef.current = false
  }

  if (senha !== null) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-white p-6 dark:bg-neutral-950">
        <p className="text-xl font-medium text-neutral-500 dark:text-neutral-400">Senha</p>
        <p
          className={`text-[112px] font-bold leading-none ${
            senha.provisoria ? 'text-neutral-400 dark:text-neutral-600' : 'text-marca'
          }`}
        >
          {senha.valor}
        </p>

        {senha.provisoria && (
          <div className="flex items-center gap-2 rounded-full bg-neutral-100 px-4 py-2 dark:bg-neutral-900">
            <span className="h-2 w-2 animate-pulse rounded-full bg-neutral-400" aria-hidden />
            <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
              Provisória — confirmando pedido...
            </span>
          </div>
        )}

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
      {!online && (
        <div className="bg-sinal-amarelo px-4 py-2 text-center text-sm font-semibold text-neutral-900">
          Sem conexão — os pedidos serão enviados quando a rede voltar
        </div>
      )}

      {pendentes > 0 && (
        <div className="flex justify-end px-4 pt-2">
          <span className="rounded-full bg-neutral-200 px-3 py-1 text-xs font-semibold text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
            {pendentes} pendente{pendentes === 1 ? '' : 's'}
          </span>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 pb-52">
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

              if (!selecionado) {
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => incrementar(item.id)}
                    className="flex min-h-16 w-full items-center gap-2 rounded-2xl bg-neutral-100 py-3 pl-4 pr-3 text-base font-medium text-neutral-900 transition-colors active:bg-neutral-200 dark:bg-neutral-900 dark:text-neutral-100 dark:active:bg-neutral-800"
                  >
                    <span className="flex-1 text-left">{item.nome}</span>
                    <span className="shrink-0 min-w-[56px] text-right text-sm font-normal text-neutral-500 dark:text-neutral-400">
                      {item.preco_centavos > 0 ? formatarPrecoBR(item.preco_centavos) : '—'}
                    </span>
                  </button>
                )
              }

              return (
                <div
                  key={item.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => incrementar(item.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      incrementar(item.id)
                    }
                  }}
                  className="flex min-h-16 w-full cursor-pointer items-center gap-2 rounded-2xl bg-marca px-2 py-2 text-marca-texto"
                >
                  <span className="flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full bg-marca-texto/20 px-1.5 text-xs font-bold">
                    {quantidade}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-left text-base font-medium">
                    {item.nome}
                  </span>
                  <span className="shrink-0 text-right text-sm font-semibold">
                    {item.preco_centavos > 0
                      ? formatarPrecoBR(item.preco_centavos * quantidade)
                      : '—'}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      decrementar(item.id)
                    }}
                    aria-label={`Remover uma unidade de ${item.nome}`}
                    className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-marca-texto/20 text-lg font-bold leading-none"
                  >
                    −
                  </button>
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
      </div>

      <div className="fixed inset-x-0 bottom-16 flex flex-col gap-1 border-t border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
        <div className="flex gap-3">
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
            disabled={totalItens === 0}
            className="min-h-11 basis-3/4 rounded-2xl bg-marca px-4 text-base font-semibold text-marca-texto active:bg-marca-escura disabled:opacity-40"
          >
            {totalItens === 0
              ? 'Enviar Pedido (0)'
              : `Enviar Pedido (${totalItens}) — ${formatarPrecoBR(totalCentavos)}`}
          </button>
        </div>
        {itensSemPreco > 0 && (
          <p className="text-center text-xs text-neutral-500 dark:text-neutral-400">
            {itensSemPreco === 1 ? '1 item sem preço' : `${itensSemPreco} itens sem preço`}
          </p>
        )}
      </div>
    </div>
  )
}
