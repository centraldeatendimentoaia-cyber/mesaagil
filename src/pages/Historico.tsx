import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, Download, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useBarracaAtual } from '../layouts/contextoBarraca'
import { MOTIVOS_CANCELAMENTO } from '../lib/cancelamento'
import { formatarPrecoBR } from '../lib/preco'
import { corMetodo, humanizarMetodo, METODOS_DISPONIVEIS } from '../lib/metodoPagamento'
import { hojeISO } from '../lib/datas'
import { calcularIntervalosRelatorio, calcularTotalPedido, ehEntregaDireta } from '../lib/relatorio'
import type { TipoFiltroRelatorio } from '../lib/relatorio'
import { PainelRelatorio } from '../components/PainelRelatorio'
import { Badge } from '../components/ui/Badge'
import { BotaoHome } from '../components/ui/BotaoHome'
import { BottomSheet } from '../components/ui/BottomSheet'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Chip } from '../components/ui/Chip'
import { Input } from '../components/ui/Input'
import { SegmentedControl } from '../components/ui/SegmentedControl'
import type { Item, PedidoComItens } from '../types/database'

function motivoHumanizado(motivo: string | null): string {
  return MOTIVOS_CANCELAMENTO.find((m) => m.valor === motivo)?.rotulo ?? motivo ?? 'não informado'
}

function rotuloMetodo(chave: string | null): string {
  const metodo = METODOS_DISPONIVEIS.find((m) => m.chave === chave)
  return metodo ? `${metodo.icone} ${metodo.label}` : humanizarMetodo(chave)
}

const PERIODOS: { valor: TipoFiltroRelatorio; rotulo: string }[] = [
  { valor: 'hoje', rotulo: 'Hoje' },
  { valor: 'ontem', rotulo: 'Ontem' },
  { valor: '7dias', rotulo: '7 dias' },
  { valor: 'mes', rotulo: 'Mês' },
  { valor: 'intervalo', rotulo: 'Período' },
]

type TipoConsumo = 'todos' | 'mesa' | 'viagem'

function formatarHora(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function minutosEntre(inicioIso: string, fimIso: string): number {
  return Math.round((new Date(fimIso).getTime() - new Date(inicioIso).getTime()) / 60000)
}

function paraCelulaCsv(valor: string): string {
  if (/[",\n]/.test(valor)) {
    return `"${valor.replace(/"/g, '""')}"`
  }
  return valor
}

function gerarCsv(pedidos: PedidoComItens[]): string {
  const cabecalho = [
    'senha',
    'mesa',
    'viagem',
    'observacao',
    'itens',
    'hora_entrada',
    'hora_finalizacao',
    'tempo_total_min',
  ]

  const linhas = pedidos.map((pedido) => {
    const itensTexto = pedido.itens_do_pedido
      .filter((item) => !item.removido)
      .map((item) => `${item.quantidade}x ${item.nome_item}`)
      .join('; ')

    const tempoTotal = pedido.entregue_em
      ? String(minutosEntre(pedido.criado_em, pedido.entregue_em))
      : ''

    return [
      String(pedido.senha),
      pedido.mesa ?? '',
      pedido.viagem ? 'sim' : 'não',
      pedido.observacao ?? '',
      itensTexto,
      formatarHora(pedido.criado_em),
      pedido.entregue_em ? formatarHora(pedido.entregue_em) : '',
      tempoTotal,
    ]
      .map(paraCelulaCsv)
      .join(',')
  })

  return [cabecalho.join(','), ...linhas].join('\n')
}

function ordenarPorEntregueEmDesc(lista: PedidoComItens[]): PedidoComItens[] {
  return [...lista].sort((a, b) => {
    const finalizacaoA = a.entregue_em ?? a.cancelado_em
    const finalizacaoB = b.entregue_em ?? b.cancelado_em
    const tempoA = finalizacaoA ? new Date(finalizacaoA).getTime() : 0
    const tempoB = finalizacaoB ? new Date(finalizacaoB).getTime() : 0
    return tempoB - tempoA
  })
}

function CardHistorico({
  pedido,
  onRestaurar,
}: {
  pedido: PedidoComItens
  onRestaurar: (pedido: PedidoComItens) => void
}) {
  const tempoTotal = pedido.entregue_em ? minutosEntre(pedido.criado_em, pedido.entregue_em) : null
  const cancelado = pedido.status === 'cancelado'
  const itensAtivos = pedido.itens_do_pedido.filter((item) => !item.removido)

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-2xl font-black leading-none text-mesa-text-tertiary">{pedido.senha}</p>
          <p
            className={
              cancelado
                ? 'mt-1.5 text-base font-semibold text-mesa-text-tertiary line-through'
                : 'mt-1.5 text-base font-semibold text-mesa-text-primary'
            }
          >
            {formatarPrecoBR(calcularTotalPedido(pedido))}
          </p>
          {(pedido.viagem || pedido.mesa) && (
            <p className="mt-1 text-sm text-mesa-text-secondary">
              {pedido.viagem ? 'Viagem' : `Mesa ${pedido.mesa}`}
            </p>
          )}
        </div>
        <div className="text-right text-sm text-mesa-text-secondary">
          <p>Entrada {formatarHora(pedido.criado_em)}</p>
          <p className="font-semibold text-mesa-text-primary">
            {tempoTotal !== null ? `${tempoTotal} min de preparo` : '—'}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {cancelado ? (
          <Badge variant="danger">CANCELADO</Badge>
        ) : (
          <Badge variant="neutral">ENTREGUE</Badge>
        )}
        {!cancelado && ehEntregaDireta(pedido) && <Badge variant="neutral">Entrega direta</Badge>}
        {/* corMetodo() já devolve um par bg/texto completo (cor dinâmica por
            método) — não passa por Badge pra não competir com as classes de
            variant do próprio primitivo (mesma race de especificidade que já
            corrigimos no Input). Mesmo formato visual (pill, texto pequeno). */}
        <span
          className={`inline-flex items-center rounded-mesa-full px-3 py-1 text-xs font-medium ${corMetodo(pedido.metodo_pagamento)}`}
        >
          {rotuloMetodo(pedido.metodo_pagamento)}
        </span>
      </div>

      {cancelado && (
        <p className="mt-2 text-xs text-mesa-text-secondary">
          Motivo: {motivoHumanizado(pedido.motivo_cancelamento)}
        </p>
      )}

      {pedido.observacao && (
        <p className="mt-3 rounded-mesa-md bg-mesa-neutral-100 p-3 text-sm text-mesa-text-primary dark:bg-mesa-neutral-700">
          {pedido.observacao}
        </p>
      )}

      {itensAtivos.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {itensAtivos.map((item) => (
            <Chip key={item.id} variant="plain">
              {item.quantidade}× {item.nome_item}
            </Chip>
          ))}
        </div>
      )}

      {!cancelado && (
        <Button
          variant="outline"
          size="md"
          onClick={() => onRestaurar(pedido)}
          className="mt-4 w-full"
        >
          Restaurar
        </Button>
      )}
    </Card>
  )
}

export function Historico() {
  const barraca = useBarracaAtual()

  const [pedidos, setPedidos] = useState<PedidoComItens[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const [periodo, setPeriodo] = useState<TipoFiltroRelatorio>('hoje')
  const [dataInicio, setDataInicio] = useState(hojeISO())
  const [dataFim, setDataFim] = useState(hojeISO())
  const [busca, setBusca] = useState('')
  const [tipoConsumo, setTipoConsumo] = useState<TipoConsumo>('todos')
  const [metodoFiltrado, setMetodoFiltrado] = useState<string | null>(null)

  const [itensCardapio, setItensCardapio] = useState<Item[]>([])
  const [itemFiltradoId, setItemFiltradoId] = useState<string | null>(null)

  const [mostrarConfirmacaoExclusao, setMostrarConfirmacaoExclusao] = useState(false)
  const [apagando, setApagando] = useState(false)
  const [erroExclusao, setErroExclusao] = useState<string | null>(null)

  useEffect(() => {
    let cancelado = false
    setCarregando(true)
    setErro(null)

    const intervalo = calcularIntervalosRelatorio({ tipo: periodo, dataInicio, dataFim }).atual

    supabase
      .from('pedidos')
      .select('*, itens_do_pedido(*)')
      .eq('barraca_id', barraca.id)
      .in('status', ['entregue', 'cancelado'])
      .gte('data_operacao', intervalo.inicio)
      .lte('data_operacao', intervalo.fim)
      .order('criado_em', { ascending: false })
      .then(({ data, error }) => {
        if (cancelado) return
        if (error) {
          setErro(error.message)
        } else {
          setErro(null)
          // ordena no cliente (entregue_em ou cancelado_em, o que existir) —
          // um ORDER BY entregue_em no servidor jogaria os cancelados (que
          // não têm entregue_em) todos pro topo por causa do NULLS FIRST
          // padrão do Postgres em DESC, fora de ordem cronológica real
          setPedidos(ordenarPorEntregueEmDesc((data ?? []) as PedidoComItens[]))
        }
        setCarregando(false)
      })

    return () => {
      cancelado = true
    }
  }, [barraca.id, periodo, dataInicio, dataFim])

  useEffect(() => {
    let cancelado = false

    supabase
      .from('itens')
      .select('*')
      .eq('barraca_id', barraca.id)
      .eq('ativo', true)
      .order('ordem')
      .then(({ data, error }) => {
        if (cancelado || error) return
        setItensCardapio((data ?? []) as Item[])
      })

    return () => {
      cancelado = true
    }
  }, [barraca.id])

  const pedidosDoPeriodo = pedidos
  const pedidosDoPeriodoComItemFiltrado = itemFiltradoId
    ? pedidosDoPeriodo.filter((p) =>
        p.itens_do_pedido.some((item) => !item.removido && item.item_id === itemFiltradoId),
      )
    : pedidosDoPeriodo

  const pedidosPorConsumo =
    tipoConsumo === 'todos'
      ? pedidosDoPeriodoComItemFiltrado
      : pedidosDoPeriodoComItemFiltrado.filter((p) => (tipoConsumo === 'viagem' ? p.viagem : !p.viagem))

  const pedidosPorMetodo = metodoFiltrado
    ? pedidosPorConsumo.filter((p) => p.metodo_pagamento === metodoFiltrado)
    : pedidosPorConsumo

  const buscaNormalizada = busca.trim().toLowerCase()
  const pedidosExibidos = buscaNormalizada
    ? pedidosPorMetodo.filter(
        (p) =>
          String(p.senha).includes(buscaNormalizada) ||
          (p.mesa ?? '').toLowerCase().includes(buscaNormalizada),
      )
    : pedidosPorMetodo

  const nomeItemFiltrado = itemFiltradoId
    ? (itensCardapio.find((item) => item.id === itemFiltradoId)?.nome ?? null)
    : null

  const filtroRelatorio = { tipo: periodo, dataInicio, dataFim }

  async function restaurarPedido(pedido: PedidoComItens) {
    setPedidos((atual) => atual.filter((p) => p.id !== pedido.id))

    const { error } = await supabase
      .from('pedidos')
      .update({ status: 'a_fazer', pronto_em: null, entregue_em: null })
      .eq('id', pedido.id)

    if (error) {
      setPedidos((atual) => ordenarPorEntregueEmDesc([...atual, pedido]))
    }
  }

  function exportarCsv() {
    const csv = gerarCsv(pedidosExibidos)
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `historico-${barraca.slug}-${hojeISO()}.csv`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  async function apagarPeriodo() {
    const ids = pedidosDoPeriodo.map((p) => p.id)
    if (ids.length === 0) {
      setMostrarConfirmacaoExclusao(false)
      return
    }

    setApagando(true)
    setErroExclusao(null)

    const { error: erroItens } = await supabase
      .from('itens_do_pedido')
      .delete()
      .in('pedido_id', ids)

    if (erroItens) {
      setErroExclusao('Não foi possível apagar os pedidos. Tente novamente.')
      setApagando(false)
      return
    }

    const { error: erroPedidos } = await supabase.from('pedidos').delete().in('id', ids)

    if (erroPedidos) {
      setErroExclusao('Não foi possível apagar os pedidos. Tente novamente.')
      setApagando(false)
      return
    }

    setPedidos([])
    setApagando(false)
    setMostrarConfirmacaoExclusao(false)
  }

  return (
    <div className="min-h-dvh pb-24">
      <div className="sticky top-0 z-[var(--mesa-z-sticky)] bg-[var(--mesa-color-surface-blur)] px-6 pt-[calc(env(safe-area-inset-top)+16px)] pb-4 [backdrop-filter:blur(var(--mesa-surface-blur-strength))]">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1">
            <BotaoHome className="-ml-2" />
            <Link
              to={`/${barraca.slug}/cozinha`}
              aria-label="Voltar para Cozinha"
              className="inline-flex items-center gap-2 text-mesa-teal-700 dark:text-mesa-teal-300"
            >
              <ChevronLeft className="size-7 shrink-0" aria-hidden />
              <h1 className="text-2xl font-bold leading-tight">Histórico</h1>
            </Link>
          </div>
          <Button
            variant="outline"
            size="sm"
            icon={<Download className="size-4" aria-hidden />}
            onClick={exportarCsv}
            disabled={pedidosExibidos.length === 0}
          >
            Exportar
          </Button>
        </div>

        <div className="mt-4">
          <SegmentedControl
            aria-label="Período do histórico"
            items={PERIODOS.map((p) => ({ label: p.rotulo }))}
            activeIndex={PERIODOS.findIndex((p) => p.valor === periodo)}
            onChange={(indice) => setPeriodo(PERIODOS[indice].valor)}
          />
        </div>

        {periodo === 'intervalo' && (
          <div className="mt-3 flex items-center gap-2">
            <input
              type="date"
              value={dataInicio}
              max={dataFim}
              onChange={(e) => setDataInicio(e.target.value)}
              aria-label="Data de início"
              className="h-10 min-w-0 flex-1 rounded-mesa-sm border-[1.5px] border-mesa-border-default bg-mesa-surface px-3 text-sm text-mesa-text-primary outline-none focus:border-mesa-orange-500"
            />
            <span className="text-sm text-mesa-text-secondary">até</span>
            <input
              type="date"
              value={dataFim}
              min={dataInicio}
              max={hojeISO()}
              onChange={(e) => setDataFim(e.target.value)}
              aria-label="Data de fim"
              className="h-10 min-w-0 flex-1 rounded-mesa-sm border-[1.5px] border-mesa-border-default bg-mesa-surface px-3 text-sm text-mesa-text-primary outline-none focus:border-mesa-orange-500"
            />
          </div>
        )}

        <select
          value={itemFiltradoId ?? ''}
          onChange={(e) => setItemFiltradoId(e.target.value || null)}
          className="mt-3 h-12 w-full rounded-mesa-sm border-[1.5px] border-mesa-border-default bg-mesa-surface px-4 text-sm text-mesa-text-primary outline-none focus:border-mesa-orange-500"
        >
          <option value="">Todos os produtos</option>
          {itensCardapio.map((item) => (
            <option key={item.id} value={item.id}>
              {item.nome}
            </option>
          ))}
        </select>

        <Input
          type="search"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          onClear={() => setBusca('')}
          placeholder="Buscar por senha ou mesa"
          aria-label="Buscar por senha ou mesa"
          className="mt-3"
        />

        <div className="mt-3 flex flex-wrap gap-1.5">
          {(['todos', 'mesa', 'viagem'] as const).map((valor) => (
            <Chip
              key={valor}
              variant={tipoConsumo === valor ? 'teal' : 'plain'}
              checked={tipoConsumo === valor}
              onClick={() => setTipoConsumo(valor)}
            >
              {valor === 'todos' ? 'Todos' : valor === 'mesa' ? 'No local' : 'Viagem'}
            </Chip>
          ))}
          <span className="mx-1 self-center text-mesa-text-tertiary" aria-hidden>
            ·
          </span>
          <Chip
            variant={metodoFiltrado === null ? 'teal' : 'plain'}
            checked={metodoFiltrado === null}
            onClick={() => setMetodoFiltrado(null)}
          >
            Qualquer método
          </Chip>
          {METODOS_DISPONIVEIS.filter((m) => barraca.metodos_pagamento_ativos?.includes(m.chave)).map(
            (metodo) => (
              <Chip
                key={metodo.chave}
                variant={metodoFiltrado === metodo.chave ? 'teal' : 'plain'}
                checked={metodoFiltrado === metodo.chave}
                onClick={() => setMetodoFiltrado(metodo.chave)}
              >
                {metodo.icone} {metodo.label}
              </Chip>
            ),
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-mesa-text-secondary">
            {pedidosExibidos.length} comanda{pedidosExibidos.length === 1 ? '' : 's'} no período
          </p>
          <button
            type="button"
            onClick={() => setMostrarConfirmacaoExclusao(true)}
            disabled={pedidosDoPeriodo.length === 0}
            className="flex min-h-11 items-center gap-1.5 px-2 text-sm font-semibold text-mesa-error-500 disabled:opacity-40"
          >
            <Trash2 className="size-4 shrink-0" aria-hidden />
            Apagar período
          </button>
        </div>
      </div>

      <div className="px-6 pt-4">
        <div className="mb-4">
          <PainelRelatorio
            barraca={barraca}
            filtro={filtroRelatorio}
            itemFiltradoId={itemFiltradoId}
            nomeItemFiltrado={nomeItemFiltrado}
          />
        </div>

        {carregando && (
          <p className="py-8 text-center text-sm text-mesa-text-secondary">Carregando...</p>
        )}

        {!carregando && erro && (
          <p className="py-8 text-center text-sm text-mesa-error-500">
            Não foi possível carregar o histórico.
          </p>
        )}

        {!carregando && !erro && pedidosExibidos.length === 0 && (
          <p className="py-8 text-center text-sm text-mesa-text-secondary">
            Nenhuma comanda no período.
          </p>
        )}

        {!carregando && !erro && pedidosExibidos.length > 0 && (
          <div className="flex flex-col gap-4">
            {pedidosExibidos.map((pedido) => (
              <CardHistorico key={pedido.id} pedido={pedido} onRestaurar={restaurarPedido} />
            ))}
          </div>
        )}
      </div>

      <BottomSheet
        open={mostrarConfirmacaoExclusao}
        onClose={() => {
          setMostrarConfirmacaoExclusao(false)
          setErroExclusao(null)
        }}
        aria-label="Confirmar exclusão do período"
      >
        <h2 className="text-lg font-semibold text-mesa-text-primary">
          Apagar {pedidosDoPeriodo.length} pedido{pedidosDoPeriodo.length === 1 ? '' : 's'} do
          período selecionado?
        </h2>
        <p className="mt-1 text-sm text-mesa-text-secondary">Esta ação não pode ser desfeita.</p>

        {erroExclusao && <p className="mt-2 text-sm text-mesa-error-500">{erroExclusao}</p>}

        <div className="mt-6 flex flex-col gap-2">
          <Button
            variant="destructive"
            size="xl"
            loading={apagando}
            onClick={apagarPeriodo}
            className="w-full"
          >
            Apagar definitivamente
          </Button>
          <Button
            variant="ghost"
            size="md"
            onClick={() => {
              setMostrarConfirmacaoExclusao(false)
              setErroExclusao(null)
            }}
            className="w-full"
          >
            Cancelar
          </Button>
        </div>
      </BottomSheet>
    </div>
  )
}
