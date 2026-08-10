import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent, MouseEvent, PointerEvent } from 'react'
import { supabase } from '../lib/supabase'
import { useBarracaAtual } from '../layouts/LayoutBarraca'
import type { Barraca, ItemDoPedido, Pedido } from '../types/database'

type PedidoComItens = Pedido & { itens_do_pedido: ItemDoPedido[] }
type Coluna = 'a_fazer' | 'pronto'
type CorSinal = 'verde' | 'amarelo' | 'vermelho' | 'pronto'

const INTERVALO_POLLING_MS = 5000
const DURACAO_LONGO_TOQUE_MS = 1000
const DURACAO_FAIXA_FINALIZADO_MS = 5000

function dataOperacaoAtual(): string {
  const agora = new Date()
  const ano = agora.getFullYear()
  const mes = String(agora.getMonth() + 1).padStart(2, '0')
  const dia = String(agora.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

function ordenarPorCriadoEm(lista: PedidoComItens[]): PedidoComItens[] {
  return [...lista].sort(
    (a, b) => new Date(a.criado_em).getTime() - new Date(b.criado_em).getTime(),
  )
}

function minutosDecorridos(pedido: PedidoComItens): number {
  const inicio = new Date(pedido.criado_em).getTime()
  const fim = pedido.status === 'pronto' && pedido.pronto_em
    ? new Date(pedido.pronto_em).getTime()
    : Date.now()
  return Math.max(0, Math.floor((fim - inicio) / 60000))
}

function corPorTempo(pedido: PedidoComItens, minutos: number, barraca: Barraca): CorSinal {
  if (pedido.status === 'pronto') return 'pronto'
  if (minutos <= barraca.verde_ate) return 'verde'
  if (minutos <= barraca.amarelo_ate) return 'amarelo'
  return 'vermelho'
}

const CORES_BORDA: Record<CorSinal, string> = {
  verde: 'border-sinal-verde',
  amarelo: 'border-sinal-amarelo',
  vermelho: 'border-sinal-vermelho',
  pronto: 'border-sinal-pronto',
}

const CORES_FUNDO: Record<CorSinal, string> = {
  verde: 'bg-sinal-verde/10',
  amarelo: 'bg-sinal-amarelo/10',
  vermelho: 'bg-sinal-vermelho/10',
  pronto: 'bg-sinal-pronto/10',
}

const CORES_TEXTO: Record<CorSinal, string> = {
  verde: 'text-sinal-verde',
  amarelo: 'text-sinal-amarelo',
  vermelho: 'text-sinal-vermelho',
  pronto: 'text-sinal-pronto',
}

function LinhaItem({
  item,
  onSolicitarRemocao,
}: {
  item: ItemDoPedido
  onSolicitarRemocao: (item: ItemDoPedido) => void
}) {
  const timerRef = useRef<number | null>(null)
  const disparouRef = useRef(false)

  function iniciarToque() {
    if (item.removido) return
    disparouRef.current = false
    timerRef.current = window.setTimeout(() => {
      disparouRef.current = true
      onSolicitarRemocao(item)
    }, DURACAO_LONGO_TOQUE_MS)
  }

  function cancelarToque() {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  function aoClicar(e: MouseEvent<HTMLLIElement>) {
    if (disparouRef.current) {
      e.stopPropagation()
    }
  }

  return (
    <li
      onPointerDown={(e: PointerEvent<HTMLLIElement>) => {
        e.stopPropagation()
        iniciarToque()
      }}
      onPointerUp={cancelarToque}
      onPointerLeave={cancelarToque}
      onPointerCancel={cancelarToque}
      onContextMenu={(e) => e.preventDefault()}
      onClick={aoClicar}
      className={`flex select-none items-center justify-between gap-3 py-1.5 text-lg ${
        item.removido ? 'opacity-40' : ''
      }`}
    >
      <span className={item.removido ? 'text-neutral-400 line-through' : 'text-white'}>
        {item.nome_item}
      </span>
      <span
        className={`font-semibold ${item.removido ? 'text-neutral-400 line-through' : 'text-white'}`}
      >
        {item.quantidade}×
      </span>
    </li>
  )
}

function CardPedido({
  pedido,
  barraca,
  coluna,
  onMoverParaPronto,
  onVoltar,
  onEntregar,
  onSolicitarRemocao,
}: {
  pedido: PedidoComItens
  barraca: Barraca
  coluna: Coluna
  onMoverParaPronto: (pedido: PedidoComItens) => void
  onVoltar: (pedido: PedidoComItens) => void
  onEntregar: (pedido: PedidoComItens) => void
  onSolicitarRemocao: (pedido: PedidoComItens, item: ItemDoPedido) => void
}) {
  const minutos = minutosDecorridos(pedido)
  const cor = corPorTempo(pedido, minutos, barraca)

  const conteudo = (
    <>
      <p className={`text-center text-6xl font-black leading-none ${CORES_TEXTO[cor]}`}>
        {pedido.senha}
      </p>

      {pedido.viagem && (
        <p className="mt-2 text-center text-xs font-bold tracking-widest text-neutral-300">
          VIAGEM
        </p>
      )}

      {pedido.mesa && (
        <p className="mt-1 text-center text-base text-neutral-300">Mesa: {pedido.mesa}</p>
      )}

      {pedido.observacao && (
        <div className="mt-3 flex items-start gap-2 rounded-xl bg-sinal-amarelo/15 p-3">
          <span aria-hidden className="text-lg leading-none">
            ⚠️
          </span>
          <p className="text-sm font-semibold text-sinal-amarelo">{pedido.observacao}</p>
        </div>
      )}

      <ul className="mt-3 divide-y divide-white/10">
        {pedido.itens_do_pedido.map((item) => (
          <LinhaItem
            key={item.id}
            item={item}
            onSolicitarRemocao={(itemAlvo) => onSolicitarRemocao(pedido, itemAlvo)}
          />
        ))}
      </ul>

      <p className={`mt-3 text-center text-4xl font-bold ${CORES_TEXTO[cor]}`}>{minutos} min</p>
    </>
  )

  const classeCartao = `w-full rounded-2xl border-4 ${CORES_BORDA[cor]} ${CORES_FUNDO[cor]} bg-neutral-900 p-4`

  if (coluna === 'a_fazer') {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={() => onMoverParaPronto(pedido)}
        onKeyDown={(e: KeyboardEvent<HTMLDivElement>) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onMoverParaPronto(pedido)
          }
        }}
        className={`${classeCartao} cursor-pointer text-left`}
      >
        {conteudo}
      </div>
    )
  }

  return (
    <div className={classeCartao}>
      {conteudo}
      <div className="mt-4 flex gap-3">
        <button
          type="button"
          onClick={() => onVoltar(pedido)}
          className="min-h-11 flex-1 rounded-2xl bg-neutral-700 text-base font-semibold text-white active:bg-neutral-600"
        >
          Voltar
        </button>
        <button
          type="button"
          onClick={() => onEntregar(pedido)}
          className="min-h-11 flex-1 rounded-2xl bg-sinal-pronto text-base font-semibold text-white active:opacity-80"
        >
          Entregue
        </button>
      </div>
    </div>
  )
}

export function Cozinha() {
  const barraca = useBarracaAtual()
  const [pedidos, setPedidos] = useState<PedidoComItens[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [aba, setAba] = useState<Coluna>('a_fazer')

  const [itemParaRemover, setItemParaRemover] = useState<{
    pedido: PedidoComItens
    item: ItemDoPedido
  } | null>(null)
  const [removendoItem, setRemovendoItem] = useState(false)

  const [pedidoFinalizado, setPedidoFinalizado] = useState<PedidoComItens | null>(null)
  const faixaTimeoutRef = useRef<number | null>(null)

  useEffect(() => {
    let cancelado = false

    async function buscar() {
      const { data, error } = await supabase
        .from('pedidos')
        .select('*, itens_do_pedido(*)')
        .eq('barraca_id', barraca.id)
        .eq('data_operacao', dataOperacaoAtual())
        .in('status', ['a_fazer', 'pronto'])
        .order('criado_em', { ascending: true })

      if (cancelado) return

      if (error) {
        setErro(error.message)
      } else {
        setErro(null)
        setPedidos((data ?? []) as PedidoComItens[])
      }
      setCarregando(false)
    }

    buscar()
    const intervalo = window.setInterval(buscar, INTERVALO_POLLING_MS)

    return () => {
      cancelado = true
      window.clearInterval(intervalo)
    }
  }, [barraca.id])

  function atualizarPedidoLocal(id: string, patch: Partial<Pedido>) {
    setPedidos((atual) => atual.map((p) => (p.id === id ? { ...p, ...patch } : p)))
  }

  function atualizarItemLocal(pedidoId: string, itemId: string, patch: Partial<ItemDoPedido>) {
    setPedidos((atual) =>
      atual.map((p) =>
        p.id === pedidoId
          ? {
              ...p,
              itens_do_pedido: p.itens_do_pedido.map((i) =>
                i.id === itemId ? { ...i, ...patch } : i,
              ),
            }
          : p,
      ),
    )
  }

  async function moverParaPronto(pedido: PedidoComItens) {
    const agora = new Date().toISOString()
    atualizarPedidoLocal(pedido.id, { status: 'pronto', pronto_em: agora })

    const { error } = await supabase
      .from('pedidos')
      .update({ status: 'pronto', pronto_em: agora })
      .eq('id', pedido.id)

    if (error) {
      atualizarPedidoLocal(pedido.id, { status: 'a_fazer', pronto_em: null })
    }
  }

  async function voltarParaFazer(pedido: PedidoComItens) {
    atualizarPedidoLocal(pedido.id, { status: 'a_fazer', pronto_em: null })

    const { error } = await supabase
      .from('pedidos')
      .update({ status: 'a_fazer', pronto_em: null })
      .eq('id', pedido.id)

    if (error) {
      atualizarPedidoLocal(pedido.id, { status: 'pronto', pronto_em: pedido.pronto_em })
    }
  }

  async function finalizarPedido(pedido: PedidoComItens) {
    const agora = new Date().toISOString()

    setPedidos((atual) => atual.filter((p) => p.id !== pedido.id))

    if (faixaTimeoutRef.current !== null) window.clearTimeout(faixaTimeoutRef.current)
    setPedidoFinalizado(pedido)
    faixaTimeoutRef.current = window.setTimeout(() => {
      setPedidoFinalizado(null)
    }, DURACAO_FAIXA_FINALIZADO_MS)

    const { error } = await supabase
      .from('pedidos')
      .update({ status: 'entregue', entregue_em: agora })
      .eq('id', pedido.id)

    if (error) {
      if (faixaTimeoutRef.current !== null) window.clearTimeout(faixaTimeoutRef.current)
      setPedidoFinalizado(null)
      setPedidos((atual) => ordenarPorCriadoEm([...atual, pedido]))
    }
  }

  function desfazerFinalizacao() {
    if (!pedidoFinalizado) return
    const pedido = pedidoFinalizado

    if (faixaTimeoutRef.current !== null) window.clearTimeout(faixaTimeoutRef.current)
    setPedidoFinalizado(null)

    setPedidos((atual) =>
      ordenarPorCriadoEm([...atual, { ...pedido, status: 'pronto', entregue_em: null }]),
    )

    supabase.from('pedidos').update({ status: 'pronto', entregue_em: null }).eq('id', pedido.id)
  }

  async function confirmarRemocaoItem() {
    if (!itemParaRemover) return
    const { pedido, item } = itemParaRemover
    const agora = new Date().toISOString()

    setRemovendoItem(true)
    atualizarItemLocal(pedido.id, item.id, { removido: true, removido_em: agora })

    const { error } = await supabase
      .from('itens_do_pedido')
      .update({ removido: true, removido_em: agora })
      .eq('id', item.id)

    if (error) {
      atualizarItemLocal(pedido.id, item.id, { removido: false, removido_em: null })
    }

    setRemovendoItem(false)
    setItemParaRemover(null)
  }

  const pedidosAFazer = pedidos.filter((p) => p.status === 'a_fazer')
  const pedidosProntos = pedidos.filter((p) => p.status === 'pronto')

  function renderLista(lista: PedidoComItens[], coluna: Coluna) {
    if (carregando) {
      return <p className="py-8 text-center text-neutral-500">Carregando...</p>
    }
    if (erro) {
      return <p className="py-8 text-center text-sinal-vermelho">Não foi possível carregar os pedidos.</p>
    }
    if (lista.length === 0) {
      return <p className="py-8 text-center text-neutral-500">Nenhum pedido.</p>
    }
    return (
      <div className="flex flex-col gap-4">
        {lista.map((pedido) => (
          <CardPedido
            key={pedido.id}
            pedido={pedido}
            barraca={barraca}
            coluna={coluna}
            onMoverParaPronto={moverParaPronto}
            onVoltar={voltarParaFazer}
            onEntregar={finalizarPedido}
            onSolicitarRemocao={(p, item) => setItemParaRemover({ pedido: p, item })}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cozinha-fundo pb-24">
      <div className="flex border-b border-white/10 md:hidden">
        <button
          type="button"
          onClick={() => setAba('a_fazer')}
          className={`min-h-11 flex-1 py-3 text-center text-sm font-bold ${
            aba === 'a_fazer'
              ? 'border-b-2 border-white text-white'
              : 'text-neutral-500'
          }`}
        >
          A Fazer ({pedidosAFazer.length})
        </button>
        <button
          type="button"
          onClick={() => setAba('pronto')}
          className={`min-h-11 flex-1 py-3 text-center text-sm font-bold ${
            aba === 'pronto' ? 'border-b-2 border-white text-white' : 'text-neutral-500'
          }`}
        >
          Pronto ({pedidosProntos.length})
        </button>
      </div>

      <div className="p-4 md:hidden">
        {renderLista(aba === 'a_fazer' ? pedidosAFazer : pedidosProntos, aba)}
      </div>

      <div className="hidden gap-6 p-6 md:grid md:grid-cols-2">
        <div>
          <h2 className="mb-4 text-lg font-bold text-white">A Fazer ({pedidosAFazer.length})</h2>
          {renderLista(pedidosAFazer, 'a_fazer')}
        </div>
        <div>
          <h2 className="mb-4 text-lg font-bold text-white">Pronto ({pedidosProntos.length})</h2>
          {renderLista(pedidosProntos, 'pronto')}
        </div>
      </div>

      {itemParaRemover && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
          <div className="w-full max-w-sm rounded-2xl bg-neutral-900 p-6 text-center">
            <p className="text-lg font-semibold text-white">
              Remover "{itemParaRemover.item.nome_item}"?
            </p>
            <p className="mt-1 text-sm text-neutral-400">Pedido {itemParaRemover.pedido.senha}</p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setItemParaRemover(null)}
                className="min-h-11 flex-1 rounded-2xl bg-neutral-700 text-base font-medium text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarRemocaoItem}
                disabled={removendoItem}
                className="min-h-11 flex-1 rounded-2xl bg-sinal-vermelho text-base font-semibold text-white disabled:opacity-50"
              >
                Remover
              </button>
            </div>
          </div>
        </div>
      )}

      {pedidoFinalizado && (
        <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-4 bg-neutral-800 px-6 py-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
          <span className="text-base font-medium text-white">
            Pedido {pedidoFinalizado.senha} finalizado
          </span>
          <button
            type="button"
            onClick={desfazerFinalizacao}
            className="min-h-11 rounded-2xl bg-neutral-600 px-4 text-base font-semibold text-white"
          >
            Desfazer
          </button>
        </div>
      )}
    </div>
  )
}
