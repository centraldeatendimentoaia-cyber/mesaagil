import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, ChefHat, CircleCheck, Clock, ListChecks, Moon, ShoppingBag, Sun, TriangleAlert } from 'lucide-react'
import clsx from 'clsx'
import { useBarracaAtual, useSincronizacaoAtual } from '../layouts/contextoBarraca'
import { useTheme } from '../hooks/useTheme'
import { usePedidosAtual } from '../layouts/contextoPedidos'
import { enfileirar } from '../lib/fila'
import { tocarSomPedidoCritico, tocarSomPedidoNaCozinha } from '../lib/sons'
import { Badge } from '../components/ui/Badge'
import { BotaoHome } from '../components/ui/BotaoHome'
import { BottomSheet } from '../components/ui/BottomSheet'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Chip } from '../components/ui/Chip'
import { SegmentedControl } from '../components/ui/SegmentedControl'
import { ModalCancelamento } from '../components/ModalCancelamento'
import { ModalEntregaDireta } from '../components/ModalEntregaDireta'
import { DetalheComanda } from '../components/DetalheComanda'
import type { MotivoCancelamento } from '../lib/cancelamento'
import type { Barraca, ItemDoPedido, PedidoComItens } from '../types/database'
import type { StatusConexao } from '../hooks/useRealtimePedidos'

type Coluna = 'a_fazer' | 'pronto'
type CorSinal = 'verde' | 'amarelo' | 'vermelho'

const DURACAO_FAIXA_FINALIZADO_MS = 5000
const INTERVALO_RELOGIO_MS = 10000

function minutosDecorridos(pedido: PedidoComItens): number {
  const inicio = new Date(pedido.criado_em).getTime()
  const fim = pedido.status === 'pronto' && pedido.pronto_em
    ? new Date(pedido.pronto_em).getTime()
    : Date.now()
  return Math.max(0, Math.floor((fim - inicio) / 60000))
}

function corPorTempo(minutos: number, barraca: Barraca): CorSinal {
  if (minutos <= barraca.verde_ate) return 'verde'
  if (minutos <= barraca.amarelo_ate) return 'amarelo'
  return 'vermelho'
}

function formatarHora(iso: string): string {
  const data = new Date(iso)
  return `${String(data.getHours()).padStart(2, '0')}:${String(data.getMinutes()).padStart(2, '0')}`
}

const CORES_BORDA: Record<CorSinal, string> = {
  verde: 'border-l-mesa-kanban-green',
  amarelo: 'border-l-mesa-kanban-yellow',
  vermelho: 'border-l-mesa-kanban-red',
}

const CORES_TEXTO: Record<CorSinal, string> = {
  verde: 'text-mesa-kanban-green',
  amarelo: 'text-mesa-kanban-yellow',
  vermelho: 'text-mesa-kanban-red',
}

/**
 * 34×34 visual (regra da tarefa), 44×44 de área de toque — mesmo padrão do
 * botão de apagar em Ajustes.tsx e do stepper em LancarPedido.tsx.
 */
function BotaoChecklist({
  onClick,
  contador,
  total,
}: {
  onClick: () => void
  contador: number
  total: number
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Ver detalhes da comanda"
      className="relative flex size-11 shrink-0 items-center justify-center outline-none"
    >
      <span className="flex size-[34px] items-center justify-center rounded-mesa-sm bg-mesa-teal-50 text-mesa-teal-700 dark:bg-mesa-teal-500/15 dark:text-mesa-teal-400">
        <ListChecks className="size-[18px]" aria-hidden />
      </span>
      {contador > 0 && (
        <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-mesa-full bg-mesa-teal-500 px-0.5 text-[10px] font-bold leading-none text-white">
          {contador}/{total}
        </span>
      )}
    </button>
  )
}

/**
 * Item com entrega_direta=true nasceu entregue direto no balcão (Fase 4) —
 * nunca passou pela cozinha, então não usa o Chip normal (que alterna
 * entregue/pendente via onClick). Visual não-interativo, cinza + riscado,
 * pra deixar claro que esse item já saiu e não precisa de ação aqui.
 */
function ChipEntregaDireta({ item }: { item: ItemDoPedido }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-mesa-full bg-mesa-neutral-100 px-3 py-2 text-sm font-medium text-mesa-text-tertiary line-through dark:bg-mesa-neutral-700">
      <ShoppingBag className="size-3.5 shrink-0" aria-hidden />
      {item.quantidade}× {item.nome_item}
    </span>
  )
}

function CardPedido({
  pedido,
  barraca,
  coluna,
  onAbrirDetalhe,
  onMoverParaPronto,
  onVoltar,
  onEntregar,
  onCancelar,
  onAtalhoEntregar,
}: {
  pedido: PedidoComItens
  barraca: Barraca
  coluna: Coluna
  onAbrirDetalhe: (pedido: PedidoComItens) => void
  onMoverParaPronto: (pedido: PedidoComItens) => void
  onVoltar: (pedido: PedidoComItens) => void
  onEntregar: (pedido: PedidoComItens) => void
  onCancelar: (pedido: PedidoComItens) => void
  onAtalhoEntregar: (pedido: PedidoComItens) => void
}) {
  const minutos = minutosDecorridos(pedido)
  const cor = corPorTempo(minutos, barraca)

  const itensAtivos = pedido.itens_do_pedido.filter((i) => !i.removido)
  // Itens entrega_direta nasceram entregues direto no balcão — nunca
  // entraram no fluxo de preparo, então não contam pro checklist/banner de
  // progresso da cozinha (só aparecem como chip informativo abaixo).
  const itensParaCozinha = itensAtivos.filter((i) => !i.entrega_direta)
  const entreguesCount = itensParaCozinha.filter((i) => i.entregue).length
  const tudoEntregue =
    pedido.status !== 'entregue' &&
    itensParaCozinha.length > 0 &&
    itensParaCozinha.every((i) => i.entregue)
  const mostrarIdentificacao = pedido.viagem || pedido.mesa
  const itensComObservacao = itensAtivos.filter((i) => i.observacao)

  return (
    <Card className={clsx(coluna === 'a_fazer' && ['border-l-4', CORES_BORDA[cor]])}>
      <div className="flex items-center gap-2">
        <span className="font-mesa-mono text-2xl font-black leading-none text-mesa-text-tertiary">
          {pedido.senha}
        </span>
        {mostrarIdentificacao && (
          <>
            <span className="text-mesa-border-default" aria-hidden>
              |
            </span>
            <Badge variant="neutral">{pedido.viagem ? 'Viagem' : `Mesa ${pedido.mesa}`}</Badge>
          </>
        )}
        <span
          className={clsx(
            'ml-auto flex items-center gap-1 font-mesa-mono text-sm font-semibold',
            coluna === 'a_fazer' ? CORES_TEXTO[cor] : 'text-mesa-text-secondary',
          )}
        >
          <Clock className="size-3.5 shrink-0" aria-hidden />
          {coluna === 'a_fazer'
            ? formatarHora(pedido.criado_em)
            : `Pronto às ${pedido.pronto_em ? formatarHora(pedido.pronto_em) : '--:--'}`}
        </span>
        {coluna === 'a_fazer' && (
          <BotaoChecklist
            onClick={() => onAbrirDetalhe(pedido)}
            contador={entreguesCount}
            total={itensParaCozinha.length}
          />
        )}
      </div>

      {tudoEntregue && (
        <div className="mt-3 flex h-9 items-center justify-center gap-2 rounded-mesa-md bg-mesa-teal-50 dark:bg-mesa-teal-500/15">
          <Check className="size-4 shrink-0 text-mesa-teal-700 dark:text-mesa-teal-400" strokeWidth={3} aria-hidden />
          <span className="text-sm font-medium text-mesa-teal-700 dark:text-mesa-teal-400">
            Tudo entregue — finalizar?
          </span>
        </div>
      )}

      {itensAtivos.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {itensAtivos.map((item) =>
            item.entrega_direta ? (
              <ChipEntregaDireta key={item.id} item={item} />
            ) : (
              <Chip key={item.id} checked={item.entregue} variant={item.entregue ? 'teal' : 'plain'}>
                <span className={item.entregue ? 'line-through' : undefined}>
                  {item.quantidade}× {item.nome_item}
                </span>
              </Chip>
            ),
          )}
        </div>
      )}

      {(pedido.observacao || itensComObservacao.length > 0) && (
        <div className="mt-3 flex items-start gap-2 rounded-mesa-md border-l-[3px] border-mesa-orange-500 bg-mesa-orange-50 p-3 dark:bg-mesa-orange-500/15">
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-mesa-orange-700 dark:text-mesa-orange-400" aria-hidden />
          <div className="flex flex-col gap-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-mesa-orange-700 dark:text-mesa-orange-400">
              Atenção
            </p>
            {pedido.observacao && <p className="text-sm text-mesa-text-primary">{pedido.observacao}</p>}
            {itensComObservacao.map((item) => (
              <p key={item.id} className="text-sm text-mesa-text-primary">
                <span className="font-semibold">{item.nome_item}:</span> {item.observacao}
              </p>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 flex gap-3">
        {coluna === 'a_fazer' ? (
          <>
            <Button variant="outline" size="md" className="flex-1" onClick={() => onMoverParaPronto(pedido)}>
              Pronto
            </Button>
            <Button variant="confirm" size="md" className="flex-1" onClick={() => onAtalhoEntregar(pedido)}>
              Entregar direto
            </Button>
          </>
        ) : (
          <>
            <Button variant="outline" size="md" className="flex-1" onClick={() => onVoltar(pedido)}>
              Voltar
            </Button>
            <Button variant="confirm" size="md" className="flex-1" onClick={() => onEntregar(pedido)}>
              Entregue
            </Button>
          </>
        )}
      </div>

      <div className="mt-2 flex justify-center">
        <button
          type="button"
          onClick={() => onCancelar(pedido)}
          className="min-h-11 px-2 text-sm font-semibold text-mesa-error-500"
        >
          {coluna === 'a_fazer' ? 'Cancelar comanda' : 'Cancelar pedido'}
        </button>
      </div>
    </Card>
  )
}

const TEXTO_STATUS: Record<StatusConexao, string> = {
  conectado: 'Tempo real',
  reconectando: 'Reconectando',
  offline: 'Offline',
}

function BadgeStatus({ status }: { status: StatusConexao }) {
  if (status === 'conectado') {
    return (
      <Badge variant="successOutline" dot>
        {TEXTO_STATUS[status]}
      </Badge>
    )
  }
  if (status === 'offline') {
    return (
      <Badge variant="danger" dot>
        {TEXTO_STATUS[status]}
      </Badge>
    )
  }
  return (
    <Badge variant="neutral" dot className="[&>span:first-child]:animate-pulse">
      {TEXTO_STATUS[status]}
    </Badge>
  )
}

export function Cozinha() {
  const barraca = useBarracaAtual()
  const {
    pedidos,
    status: statusConexao,
    pedidosCarregados,
    aplicarPatchPedido,
    aplicarPatchItem,
  } = usePedidosAtual()
  const { pendentes, online } = useSincronizacaoAtual()
  const { tema, alternarTema } = useTheme()
  const escuro = tema === 'escuro'
  const [aba, setAba] = useState<Coluna>('a_fazer')

  const [pedidoSelecionadoId, setPedidoSelecionadoId] = useState<string | null>(null)

  const [itemParaRemover, setItemParaRemover] = useState<{
    pedido: PedidoComItens
    item: ItemDoPedido
  } | null>(null)
  const [removendoItem, setRemovendoItem] = useState(false)

  const [pedidoFinalizado, setPedidoFinalizado] = useState<PedidoComItens | null>(null)
  const faixaTimeoutRef = useRef<number | null>(null)

  const [pedidoParaCancelar, setPedidoParaCancelar] = useState<PedidoComItens | null>(null)
  const [cancelando, setCancelando] = useState(false)

  const [pedidoParaEntregaDireta, setPedidoParaEntregaDireta] = useState<PedidoComItens | null>(
    null,
  )
  const [confirmandoEntregaDireta, setConfirmandoEntregaDireta] = useState(false)

  // Relógio global: minutosDecorridos/corPorTempo são calculados em tempo de
  // render usando Date.now(). Sem isso, os cards só recalculam quando
  // `pedidos` muda por outro motivo (evento realtime, etc.) e o horário
  // exibido fica parado no valor do último render real. Um único timer aqui
  // força esse re-render — não é por card, pra não multiplicar timers.
  const [relogioTick, forcarAtualizacaoDoRelogio] = useState(0)

  useEffect(() => {
    const intervalo = window.setInterval(() => {
      forcarAtualizacaoDoRelogio((atual) => atual + 1)
    }, INTERVALO_RELOGIO_MS)

    return () => window.clearInterval(intervalo)
  }, [])

  // Alerta sonoro de atraso crítico: dispara uma vez por pedido quando ele
  // cruza pra faixa vermelha em "A Fazer" (não repete a cada tick do
  // relógio nem quando o pedido sai da lista e volta sem ter mudado de
  // faixa). idsAlertadosVermelhoRef é limpo por pedido assim que ele sai
  // de "a_fazer" — se voltar depois via "Voltar", alerta de novo se ainda
  // estiver no vermelho.
  const idsAlertadosVermelhoRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    const emFazerAgoraIds = new Set(
      pedidos.filter((p) => p.status === 'a_fazer').map((p) => p.id),
    )

    for (const id of idsAlertadosVermelhoRef.current) {
      if (!emFazerAgoraIds.has(id)) idsAlertadosVermelhoRef.current.delete(id)
    }

    for (const pedido of pedidos) {
      if (pedido.status !== 'a_fazer') continue
      if (idsAlertadosVermelhoRef.current.has(pedido.id)) continue
      if (corPorTempo(minutosDecorridos(pedido), barraca) !== 'vermelho') continue

      idsAlertadosVermelhoRef.current.add(pedido.id)
      tocarSomPedidoCritico()
    }
    // relogioTick força reavaliar mesmo sem `pedidos` mudar — o atraso
    // cresce só com o tempo passando.
  }, [pedidos, relogioTick, barraca])

  // Toca só quando um pedido novo chega via realtime enquanto a tela já
  // está aberta. Espera `pedidosCarregados` (useRealtimePedidos.ts) antes
  // de registrar a primeira leitura — sem isso, `pedidos` começa vazio
  // ([]) até o fetch inicial responder, e os pedidos que já existiam
  // apareceriam de uma vez parecendo "todos novos", tocando o som toda
  // vez que a Cozinha abre ou recarrega com pedidos pendentes.
  const idsConhecidosRef = useRef<Set<string> | null>(null)

  useEffect(() => {
    if (!pedidosCarregados) return

    if (idsConhecidosRef.current === null) {
      idsConhecidosRef.current = new Set(pedidos.map((p) => p.id))
      return
    }

    const chegouPedidoNovo = pedidos.some(
      (p) => p.status === 'a_fazer' && !idsConhecidosRef.current?.has(p.id),
    )
    if (chegouPedidoNovo) tocarSomPedidoNaCozinha()

    idsConhecidosRef.current = new Set(pedidos.map((p) => p.id))
  }, [pedidos, pedidosCarregados])

  const pedidoSelecionado = pedidos.find((p) => p.id === pedidoSelecionadoId) ?? null

  function abrirDetalhe(pedido: PedidoComItens) {
    setPedidoSelecionadoId(pedido.id)
  }

  // Optimistic + fila offline, mesmo padrão de moverParaPronto/remover_item
  // logo abaixo: aplica local na hora, enfileira, sincroniza quando puder.
  // Sem revert síncrono no erro — a fila resolve/retenta em segundo plano
  // (Cozinha precisa funcionar offline, regra do CLAUDE.md). O realtime já
  // propaga entregue/entregue_em pra outros aparelhos de graça: a
  // assinatura de itens_do_pedido em useRealtimePedidos é `event: '*'`
  // sem filtro de coluna, então já cobre esses dois campos sem ajuste.
  async function alternarEntregueItem(pedido: PedidoComItens, item: ItemDoPedido) {
    const novoValor = !item.entregue
    const novoEntregueEm = novoValor ? new Date().toISOString() : null

    aplicarPatchItem(pedido.id, item.id, { entregue: novoValor, entregue_em: novoEntregueEm })
    await enfileirar('marcar_entregue', {
      item_id: item.id,
      entregue: novoValor,
      entregue_em: novoEntregueEm,
    })
  }

  async function moverParaPronto(pedido: PedidoComItens) {
    const agora = new Date().toISOString()
    aplicarPatchPedido(pedido.id, { status: 'pronto', pronto_em: agora })
    await enfileirar('mudar_status', { pedido_id: pedido.id, status: 'pronto', pronto_em: agora })
  }

  function moverParaProntoEFechar(pedido: PedidoComItens) {
    setPedidoSelecionadoId(null)
    moverParaPronto(pedido)
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

  async function cancelarPedido(motivo: MotivoCancelamento) {
    if (!pedidoParaCancelar) return
    const pedido = pedidoParaCancelar
    const agora = new Date().toISOString()

    setCancelando(true)
    aplicarPatchPedido(pedido.id, {
      status: 'cancelado',
      motivo_cancelamento: motivo,
      cancelado_em: agora,
    })

    // mesmo padrão das outras mudanças de status: via fila offline, sem
    // reversão síncrona aqui — enfileirar não expõe um erro imediato pra
    // reverter contra (a fila resolve/retenta em segundo plano), igual
    // moverParaPronto/voltarParaFazer/finalizarPedido já fazem hoje.
    await enfileirar('mudar_status', {
      pedido_id: pedido.id,
      status: 'cancelado',
      motivo_cancelamento: motivo,
      cancelado_em: agora,
    })

    setCancelando(false)
    setPedidoParaCancelar(null)
    if (pedidoSelecionadoId === pedido.id) setPedidoSelecionadoId(null)
  }

  async function confirmarEntregaDireta() {
    if (!pedidoParaEntregaDireta) return
    const pedido = pedidoParaEntregaDireta
    const agora = new Date().toISOString()

    setConfirmandoEntregaDireta(true)
    aplicarPatchPedido(pedido.id, { status: 'entregue', pronto_em: agora, entregue_em: agora })

    // mesmo padrão de moverParaPronto/cancelarPedido: via fila offline, sem
    // reversão síncrona aqui — enfileirar não expõe um erro imediato pra
    // reverter contra (a fila resolve/retenta em segundo plano)
    await enfileirar('mudar_status', {
      pedido_id: pedido.id,
      status: 'entregue',
      pronto_em: agora,
      entregue_em: agora,
    })

    setConfirmandoEntregaDireta(false)
    setPedidoParaEntregaDireta(null)
  }

  const pedidosAFazer = pedidos.filter((p) => p.status === 'a_fazer')
  const pedidosProntos = pedidos.filter((p) => p.status === 'pronto')

  function renderLista(lista: PedidoComItens[], coluna: Coluna) {
    if (lista.length === 0) {
      return <p className="py-8 text-center text-sm text-mesa-text-secondary">Nenhum pedido.</p>
    }
    return (
      <div className="flex flex-col gap-4">
        {lista.map((pedido) => (
          <CardPedido
            key={pedido.id}
            pedido={pedido}
            barraca={barraca}
            coluna={coluna}
            onAbrirDetalhe={abrirDetalhe}
            onMoverParaPronto={moverParaPronto}
            onVoltar={voltarParaFazer}
            onEntregar={finalizarPedido}
            onCancelar={setPedidoParaCancelar}
            onAtalhoEntregar={setPedidoParaEntregaDireta}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-mesa-bg-kanban pb-40">
      {!online && (
        <p className="border-l-[3px] border-mesa-error-500 bg-mesa-error-50 p-3 text-center text-sm font-medium text-mesa-error-700 dark:bg-mesa-error-500/15 dark:text-mesa-error-400">
          Sem conexão — os pedidos serão enviados quando a rede voltar
        </p>
      )}

      <div className="flex items-center justify-between gap-3 px-4 pt-[calc(env(safe-area-inset-top)+16px)] pb-4">
        <div className="flex items-center gap-1">
          <BotaoHome className="-ml-2" />
          <h1 className="text-2xl font-bold text-mesa-text-primary">Cozinha</h1>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {pendentes > 0 && (
            <Badge variant="neutral">
              {pendentes} pendente{pendentes === 1 ? '' : 's'}
            </Badge>
          )}
          <BadgeStatus status={statusConexao} />
          <button
            type="button"
            onClick={alternarTema}
            aria-label={escuro ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
            className="flex size-11 shrink-0 items-center justify-center rounded-mesa-full bg-mesa-neutral-100 text-mesa-text-primary outline-none dark:bg-mesa-neutral-700"
          >
            {escuro ? <Sun className="size-5" aria-hidden /> : <Moon className="size-5" aria-hidden />}
          </button>
          <Link
            to={`/${barraca.slug}/historico`}
            className="flex min-h-11 items-center rounded-mesa-full bg-mesa-neutral-100 px-4 text-sm font-semibold text-mesa-text-primary dark:bg-mesa-neutral-700"
          >
            Histórico
          </Link>
        </div>
      </div>

      <div className="px-4 pb-4 md:hidden">
        <SegmentedControl
          aria-label="Colunas da cozinha"
          items={[
            { label: 'A Fazer', count: pedidosAFazer.length, icon: <ChefHat className="size-4" /> },
            { label: 'Pronto', count: pedidosProntos.length, icon: <CircleCheck className="size-4" /> },
          ]}
          activeIndex={aba === 'a_fazer' ? 0 : 1}
          onChange={(indice) => setAba(indice === 0 ? 'a_fazer' : 'pronto')}
        />
      </div>

      <div className="px-4 md:hidden">
        {renderLista(aba === 'a_fazer' ? pedidosAFazer : pedidosProntos, aba)}
        {aba === 'pronto' && (
          <p className="mt-6 text-center text-sm text-mesa-text-secondary">
            O cronômetro congela ao entrar em Pronto — a cor não muda mais, o pedido só espera o
            cliente
          </p>
        )}
      </div>

      <div className="hidden gap-6 px-6 md:grid md:grid-cols-2">
        <div>
          <h2 className="mb-4 text-lg font-bold text-mesa-text-primary">
            A Fazer ({pedidosAFazer.length})
          </h2>
          {renderLista(pedidosAFazer, 'a_fazer')}
        </div>
        <div>
          <h2 className="mb-4 text-lg font-bold text-mesa-text-primary">
            Pronto ({pedidosProntos.length})
          </h2>
          {renderLista(pedidosProntos, 'pronto')}
          <p className="mt-6 text-center text-sm text-mesa-text-secondary">
            O cronômetro congela ao entrar em Pronto — a cor não muda mais, o pedido só espera o
            cliente
          </p>
        </div>
      </div>

      <DetalheComanda
        pedido={pedidoSelecionado}
        barraca={barraca}
        onFechar={() => setPedidoSelecionadoId(null)}
        onAlternarEntregue={(item) => {
          if (pedidoSelecionado) alternarEntregueItem(pedidoSelecionado, item)
        }}
        onSolicitarRemocaoItem={(item) => {
          if (pedidoSelecionado) setItemParaRemover({ pedido: pedidoSelecionado, item })
        }}
        onMoverParaPronto={moverParaProntoEFechar}
        onCancelar={setPedidoParaCancelar}
      />

      {/* Sheet empilhado sobre o DetalheComanda — o primitivo já isola qual
          dos dois responde ao Esc (ver correção em ui/BottomSheet.tsx). */}
      <BottomSheet
        open={itemParaRemover !== null}
        onClose={() => setItemParaRemover(null)}
        aria-label="Confirmar remoção de item"
      >
        {itemParaRemover && (
          <>
            <h2 className="text-lg font-semibold text-mesa-text-primary">
              Remover {itemParaRemover.item.nome_item} do pedido?
            </h2>
            <p className="mt-1 text-sm text-mesa-text-secondary">
              Pedido {itemParaRemover.pedido.senha} · essa ação não pode ser desfeita.
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <Button
                variant="destructive"
                size="xl"
                loading={removendoItem}
                onClick={confirmarRemocaoItem}
                className="w-full"
              >
                Remover
              </Button>
              <Button
                variant="ghost"
                size="md"
                onClick={() => setItemParaRemover(null)}
                className="w-full"
              >
                Cancelar
              </Button>
            </div>
          </>
        )}
      </BottomSheet>

      {pedidoFinalizado && (
        <div className="fixed inset-x-0 bottom-16 z-40 flex items-center justify-between gap-4 bg-mesa-neutral-800 px-6 py-4">
          <span className="text-base font-medium text-white">
            Pedido {pedidoFinalizado.senha} finalizado
          </span>
          {/* Banner sempre escuro (bg-mesa-neutral-800 fixo, não segue o tema),
              então usa botão local com texto branco fixo em vez do Button
              ghost — a variante ghost usa text-mesa-text-primary (escuro no
              claro), e sobrepor com className é a mesma corrida de
              especificidade que já corrigimos no Input na Fase 3. */}
          <button
            type="button"
            onClick={desfazerFinalizacao}
            className="min-h-11 shrink-0 rounded-mesa-md px-3 text-base font-semibold text-white outline-none"
          >
            Desfazer
          </button>
        </div>
      )}

      {pedidoParaCancelar && (
        <ModalCancelamento
          pedido={pedidoParaCancelar}
          barraca={barraca}
          cancelando={cancelando}
          onFechar={() => setPedidoParaCancelar(null)}
          onConfirmar={cancelarPedido}
        />
      )}

      {pedidoParaEntregaDireta && (
        <ModalEntregaDireta
          senha={pedidoParaEntregaDireta.senha}
          confirmando={confirmandoEntregaDireta}
          onFechar={() => setPedidoParaEntregaDireta(null)}
          onConfirmar={confirmarEntregaDireta}
        />
      )}
    </div>
  )
}
