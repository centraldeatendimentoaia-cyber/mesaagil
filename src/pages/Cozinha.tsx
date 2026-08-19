import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent, MouseEvent, PointerEvent } from 'react'
import { Link } from 'react-router-dom'
import { Check } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useBarracaAtual, useSincronizacaoAtual } from '../layouts/contextoBarraca'
import { enfileirar } from '../lib/fila'
import { useRealtimePedidos } from '../hooks/useRealtimePedidos'
import type { PedidoComItens, StatusConexao } from '../hooks/useRealtimePedidos'
import type { Barraca, ItemDoPedido } from '../types/database'

type Coluna = 'a_fazer' | 'pronto'
type CorSinal = 'verde' | 'amarelo' | 'vermelho' | 'pronto'

const DURACAO_LONGO_TOQUE_MS = 1000
const DURACAO_FAIXA_FINALIZADO_MS = 5000
const INTERVALO_RELOGIO_MS = 10000

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
  onAlternarEntregue,
}: {
  item: ItemDoPedido
  onSolicitarRemocao: (item: ItemDoPedido) => void
  onAlternarEntregue: (item: ItemDoPedido) => void
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

  const entregue = item.entregue && !item.removido

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
      className={`flex select-none items-center gap-2 py-1.5 text-lg ${
        item.removido ? 'opacity-40' : ''
      }`}
    >
      {!item.removido && (
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation()
            onAlternarEntregue(item)
          }}
          aria-label={
            item.entregue
              ? `Desmarcar ${item.nome_item} como entregue`
              : `Marcar ${item.nome_item} como entregue`
          }
          className="flex h-11 w-11 shrink-0 items-center justify-center"
        >
          <span
            className={`flex h-6 w-6 items-center justify-center rounded-md border-2 ${
              item.entregue ? 'border-sinal-verde bg-sinal-verde' : 'border-white/30'
            }`}
          >
            {item.entregue && <Check size={16} strokeWidth={3} className="text-white" />}
          </span>
        </button>
      )}

      <span
        className={`flex-1 ${
          item.removido
            ? 'text-neutral-400 line-through'
            : entregue
              ? 'text-white opacity-60'
              : 'text-white'
        }`}
      >
        {item.nome_item}
      </span>

      <span className="flex shrink-0 items-center gap-2">
        <span
          className={`font-semibold ${
            item.removido
              ? 'text-neutral-400 line-through'
              : entregue
                ? 'text-white opacity-60'
                : 'text-white'
          }`}
        >
          {item.quantidade}×
        </span>
        {entregue && <span className="text-xs text-neutral-400">✓ entregue</span>}
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
  onAlternarEntregue,
}: {
  pedido: PedidoComItens
  barraca: Barraca
  coluna: Coluna
  onMoverParaPronto: (pedido: PedidoComItens) => void
  onVoltar: (pedido: PedidoComItens) => void
  onEntregar: (pedido: PedidoComItens) => void
  onSolicitarRemocao: (pedido: PedidoComItens, item: ItemDoPedido) => void
  onAlternarEntregue: (pedido: PedidoComItens, item: ItemDoPedido) => void
}) {
  const minutos = minutosDecorridos(pedido)
  const cor = corPorTempo(pedido, minutos, barraca)

  const itensAtivos = pedido.itens_do_pedido.filter((i) => !i.removido)
  const tudoEntregue =
    pedido.status !== 'entregue' && itensAtivos.length > 0 && itensAtivos.every((i) => i.entregue)

  const conteudo = (
    <>
      {tudoEntregue && (
        <div className="mb-3 flex h-8 items-center justify-center gap-2 rounded-xl bg-sinal-verde/15">
          <Check size={16} strokeWidth={3} className="text-sinal-verde" />
          <span className="text-sm font-medium text-sinal-verde">Tudo entregue — finalizar?</span>
        </div>
      )}

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
            onAlternarEntregue={(itemAlvo) => onAlternarEntregue(pedido, itemAlvo)}
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

const CORES_PONTO_STATUS: Record<StatusConexao, string> = {
  conectado: 'bg-sinal-verde',
  reconectando: 'bg-sinal-amarelo',
  offline: 'bg-sinal-vermelho',
}

function PontoStatus({ status }: { status: StatusConexao }) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className={`h-2.5 w-2.5 shrink-0 rounded-full ${CORES_PONTO_STATUS[status]}`}
        aria-hidden
      />
      {status !== 'conectado' && (
        <span className="text-xs font-medium text-neutral-400">
          {status === 'reconectando' ? 'reconectando' : 'offline'}
        </span>
      )}
      <span className="sr-only">Conexão em tempo real: {status}</span>
    </div>
  )
}

export function Cozinha() {
  const barraca = useBarracaAtual()
  const { pedidos, status: statusConexao, aplicarPatchPedido, aplicarPatchItem } =
    useRealtimePedidos(barraca.id)
  const { pendentes, online } = useSincronizacaoAtual()
  const [aba, setAba] = useState<Coluna>('a_fazer')

  const [itemParaRemover, setItemParaRemover] = useState<{
    pedido: PedidoComItens
    item: ItemDoPedido
  } | null>(null)
  const [removendoItem, setRemovendoItem] = useState(false)

  const [pedidoFinalizado, setPedidoFinalizado] = useState<PedidoComItens | null>(null)
  const faixaTimeoutRef = useRef<number | null>(null)

  // Relógio global: minutosDecorridos/corPorTempo são calculados em tempo de
  // render usando Date.now(). Sem isso, os cards só recalculam quando
  // `pedidos` muda por outro motivo (evento realtime, etc.) e o cronômetro
  // fica congelado no valor do último render real. Um único timer aqui
  // força esse re-render — não é por card, pra não multiplicar timers.
  const [, forcarAtualizacaoDoRelogio] = useState(0)

  useEffect(() => {
    const intervalo = window.setInterval(() => {
      forcarAtualizacaoDoRelogio((atual) => atual + 1)
    }, INTERVALO_RELOGIO_MS)

    return () => window.clearInterval(intervalo)
  }, [])

  async function moverParaPronto(pedido: PedidoComItens) {
    const agora = new Date().toISOString()
    aplicarPatchPedido(pedido.id, { status: 'pronto', pronto_em: agora })
    await enfileirar('mudar_status', { pedido_id: pedido.id, status: 'pronto', pronto_em: agora })
  }

  async function voltarParaFazer(pedido: PedidoComItens) {
    aplicarPatchPedido(pedido.id, { status: 'a_fazer', pronto_em: null })
    await enfileirar('mudar_status', {
      pedido_id: pedido.id,
      status: 'a_fazer',
      pronto_em: null,
    })
  }

  async function finalizarPedido(pedido: PedidoComItens) {
    if (faixaTimeoutRef.current !== null) window.clearTimeout(faixaTimeoutRef.current)
    setPedidoFinalizado(pedido)
    faixaTimeoutRef.current = window.setTimeout(() => {
      setPedidoFinalizado(null)
    }, DURACAO_FAIXA_FINALIZADO_MS)

    const agora = new Date().toISOString()
    aplicarPatchPedido(pedido.id, { status: 'entregue', entregue_em: agora })
    await enfileirar('mudar_status', {
      pedido_id: pedido.id,
      status: 'entregue',
      entregue_em: agora,
    })
  }

  async function desfazerFinalizacao() {
    if (!pedidoFinalizado) return
    const pedido = pedidoFinalizado

    if (faixaTimeoutRef.current !== null) window.clearTimeout(faixaTimeoutRef.current)
    setPedidoFinalizado(null)

    aplicarPatchPedido(pedido.id, { status: 'pronto', entregue_em: null })
    await enfileirar('mudar_status', {
      pedido_id: pedido.id,
      status: 'pronto',
      entregue_em: null,
    })
  }

  async function confirmarRemocaoItem() {
    if (!itemParaRemover) return
    const { pedido, item } = itemParaRemover
    const agora = new Date().toISOString()

    setRemovendoItem(true)
    aplicarPatchItem(pedido.id, item.id, { removido: true, removido_em: agora })
    await enfileirar('remover_item', { item_id: item.id, removido: true, removido_em: agora })

    setRemovendoItem(false)
    setItemParaRemover(null)
  }

  async function alternarEntregueItem(pedido: PedidoComItens, item: ItemDoPedido) {
    const novoValor = !item.entregue
    const novoEntregueEm = novoValor ? new Date().toISOString() : null

    aplicarPatchItem(pedido.id, item.id, { entregue: novoValor, entregue_em: novoEntregueEm })

    const { error } = await supabase
      .from('itens_do_pedido')
      .update({ entregue: novoValor, entregue_em: novoEntregueEm })
      .eq('id', item.id)

    if (error) {
      aplicarPatchItem(pedido.id, item.id, {
        entregue: item.entregue,
        entregue_em: item.entregue_em,
      })
    }
  }

  const pedidosAFazer = pedidos.filter((p) => p.status === 'a_fazer')
  const pedidosProntos = pedidos.filter((p) => p.status === 'pronto')

  function renderLista(lista: PedidoComItens[], coluna: Coluna) {
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
            onAlternarEntregue={alternarEntregueItem}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cozinha-fundo pb-40">
      {!online && (
        <div className="bg-sinal-amarelo px-4 py-2 text-center text-sm font-semibold text-neutral-900">
          Sem conexão — os pedidos serão enviados quando a rede voltar
        </div>
      )}

      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-white">Cozinha</span>
          <PontoStatus status={statusConexao} />
          {pendentes > 0 && (
            <span className="rounded-full bg-neutral-800 px-3 py-1 text-xs font-semibold text-neutral-300">
              {pendentes} pendente{pendentes === 1 ? '' : 's'}
            </span>
          )}
        </div>
        <Link
          to={`/${barraca.slug}/historico`}
          className="flex min-h-11 items-center rounded-2xl bg-neutral-800 px-4 text-sm font-semibold text-white active:bg-neutral-700"
        >
          Histórico
        </Link>
      </div>

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
        <div className="fixed inset-x-0 bottom-16 z-40 flex items-center justify-between gap-4 bg-neutral-800 px-6 py-4">
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
