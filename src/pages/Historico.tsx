import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useBarracaAtual } from '../layouts/LayoutBarraca'
import type { ItemDoPedido, Pedido } from '../types/database'

type PedidoComItens = Pedido & { itens_do_pedido: ItemDoPedido[] }
type Periodo = 'hoje' | 'ontem' | '7dias' | 'data'

const PERIODOS: { valor: Periodo; rotulo: string }[] = [
  { valor: 'hoje', rotulo: 'Hoje' },
  { valor: 'ontem', rotulo: 'Ontem' },
  { valor: '7dias', rotulo: '7 dias' },
  { valor: 'data', rotulo: 'Data' },
]

function formatarDataISO(data: Date): string {
  const ano = data.getFullYear()
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const dia = String(data.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

function hojeISO(): string {
  return formatarDataISO(new Date())
}

function deslocarDias(iso: string, dias: number): string {
  const [ano, mes, dia] = iso.split('-').map(Number)
  const data = new Date(ano, mes - 1, dia)
  data.setDate(data.getDate() + dias)
  return formatarDataISO(data)
}

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
    const tempoA = a.entregue_em ? new Date(a.entregue_em).getTime() : 0
    const tempoB = b.entregue_em ? new Date(b.entregue_em).getTime() : 0
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

  return (
    <div className="w-full rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-3xl font-black leading-none text-neutral-900 dark:text-neutral-100">
            {pedido.senha}
          </p>
          {pedido.viagem && (
            <p className="mt-1 text-xs font-bold tracking-widest text-neutral-500 dark:text-neutral-400">
              VIAGEM
            </p>
          )}
          {pedido.mesa && (
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              Mesa: {pedido.mesa}
            </p>
          )}
        </div>
        <div className="text-right text-sm text-neutral-500 dark:text-neutral-400">
          <p>Entrada {formatarHora(pedido.criado_em)}</p>
          <p className="font-semibold text-neutral-700 dark:text-neutral-300">
            {tempoTotal !== null ? `${tempoTotal} min de preparo` : '—'}
          </p>
        </div>
      </div>

      {pedido.observacao && (
        <div className="mt-3 rounded-xl bg-neutral-100 p-3 dark:bg-neutral-800">
          <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            {pedido.observacao}
          </p>
        </div>
      )}

      <ul className="mt-3 divide-y divide-neutral-100 dark:divide-neutral-800">
        {pedido.itens_do_pedido.map((item) => (
          <li
            key={item.id}
            className={`flex items-center justify-between gap-3 py-1.5 text-base ${
              item.removido ? 'opacity-50' : ''
            }`}
          >
            <span
              className={
                item.removido
                  ? 'text-neutral-400 line-through'
                  : 'text-neutral-800 dark:text-neutral-200'
              }
            >
              {item.nome_item}
            </span>
            <span
              className={`font-semibold ${
                item.removido
                  ? 'text-neutral-400 line-through'
                  : 'text-neutral-800 dark:text-neutral-200'
              }`}
            >
              {item.quantidade}×
            </span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() => onRestaurar(pedido)}
        className="mt-4 min-h-11 w-full rounded-2xl bg-marca text-base font-semibold text-marca-texto active:bg-marca-escura"
      >
        Restaurar
      </button>
    </div>
  )
}

export function Historico() {
  const barraca = useBarracaAtual()

  const [pedidos, setPedidos] = useState<PedidoComItens[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const [periodo, setPeriodo] = useState<Periodo>('hoje')
  const [dataEscolhida, setDataEscolhida] = useState(hojeISO())
  const [busca, setBusca] = useState('')

  const [mostrarConfirmacaoExclusao, setMostrarConfirmacaoExclusao] = useState(false)
  const [apagando, setApagando] = useState(false)
  const [erroExclusao, setErroExclusao] = useState<string | null>(null)

  useEffect(() => {
    let cancelado = false
    setCarregando(true)
    setErro(null)

    const hoje = hojeISO()
    const intervalo =
      periodo === 'hoje'
        ? { inicio: hoje, fim: hoje }
        : periodo === 'ontem'
          ? { inicio: deslocarDias(hoje, -1), fim: deslocarDias(hoje, -1) }
          : periodo === '7dias'
            ? { inicio: deslocarDias(hoje, -6), fim: hoje }
            : { inicio: dataEscolhida, fim: dataEscolhida }

    supabase
      .from('pedidos')
      .select('*, itens_do_pedido(*)')
      .eq('barraca_id', barraca.id)
      .eq('status', 'entregue')
      .gte('data_operacao', intervalo.inicio)
      .lte('data_operacao', intervalo.fim)
      .order('entregue_em', { ascending: false })
      .then(({ data, error }) => {
        if (cancelado) return
        if (error) {
          setErro(error.message)
        } else {
          setErro(null)
          setPedidos((data ?? []) as PedidoComItens[])
        }
        setCarregando(false)
      })

    return () => {
      cancelado = true
    }
  }, [barraca.id, periodo, dataEscolhida])

  const pedidosDoPeriodo = pedidos
  const pedidosExibidos = busca.trim()
    ? pedidosDoPeriodo.filter((p) => String(p.senha).includes(busca.trim()))
    : pedidosDoPeriodo

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
    <div className="min-h-screen bg-white pb-12 dark:bg-neutral-950">
      <div className="sticky top-0 z-10 border-b border-neutral-200 bg-white/95 p-4 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/95">
        <Link
          to={`/${barraca.slug}/cozinha`}
          className="mb-3 inline-flex min-h-11 items-center text-sm font-medium text-neutral-500 dark:text-neutral-400"
        >
          ← Cozinha
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          {PERIODOS.map((p) => (
            <button
              key={p.valor}
              type="button"
              onClick={() => setPeriodo(p.valor)}
              className={`min-h-11 rounded-2xl px-4 text-sm font-semibold ${
                periodo === p.valor
                  ? 'bg-marca text-marca-texto'
                  : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-900 dark:text-neutral-300'
              }`}
            >
              {p.rotulo}
            </button>
          ))}

          {periodo === 'data' && (
            <input
              type="date"
              value={dataEscolhida}
              max={hojeISO()}
              onChange={(e) => setDataEscolhida(e.target.value)}
              className="h-11 rounded-2xl border border-neutral-300 bg-white px-3 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
            />
          )}
        </div>

        <input
          type="text"
          inputMode="numeric"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por senha"
          className="mt-3 h-11 w-full rounded-2xl border border-neutral-300 bg-white px-4 text-base text-neutral-900 placeholder:text-neutral-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
        />

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {pedidosExibidos.length} comanda{pedidosExibidos.length === 1 ? '' : 's'} no período
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={exportarCsv}
              disabled={pedidosExibidos.length === 0}
              className="min-h-11 rounded-2xl bg-marca px-4 text-sm font-semibold text-marca-texto disabled:opacity-40"
            >
              Exportar CSV
            </button>
            <button
              type="button"
              onClick={() => setMostrarConfirmacaoExclusao(true)}
              disabled={pedidosDoPeriodo.length === 0}
              className="min-h-11 rounded-2xl bg-red-600 px-4 text-sm font-semibold text-white disabled:opacity-40"
            >
              Apagar
            </button>
          </div>
        </div>
      </div>

      <div className="p-4">
        {carregando && <p className="py-8 text-center text-neutral-500 dark:text-neutral-400">Carregando...</p>}

        {!carregando && erro && (
          <p className="py-8 text-center text-red-600">Não foi possível carregar o histórico.</p>
        )}

        {!carregando && !erro && pedidosExibidos.length === 0 && (
          <p className="py-8 text-center text-neutral-500 dark:text-neutral-400">
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

      {mostrarConfirmacaoExclusao && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center dark:bg-neutral-900">
            <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              Apagar {pedidosDoPeriodo.length} pedido
              {pedidosDoPeriodo.length === 1 ? '' : 's'} do período selecionado?
            </p>
            <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
              Esta ação não pode ser desfeita.
            </p>

            {erroExclusao && <p className="mt-2 text-sm text-red-600">{erroExclusao}</p>}

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setMostrarConfirmacaoExclusao(false)
                  setErroExclusao(null)
                }}
                className="min-h-11 flex-1 rounded-2xl bg-neutral-200 text-base font-medium text-neutral-800 dark:bg-neutral-800 dark:text-neutral-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={apagarPeriodo}
                disabled={apagando}
                className="min-h-11 flex-1 rounded-2xl bg-red-600 text-base font-semibold text-white disabled:opacity-50"
              >
                Apagar definitivamente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
