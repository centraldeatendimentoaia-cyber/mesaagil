import { deslocarDias, hojeISO } from './datas'
import type { MetodoPagamento } from './metodoPagamento'
import type { PedidoComItens } from '../types/database'

export type MetodoOuNaoInformado = MetodoPagamento | 'nao_informado'

export const METODOS_OU_NAO_INFORMADO: MetodoOuNaoInformado[] = [
  'dinheiro',
  'debito',
  'credito',
  'pix',
  'nao_informado',
]

export function calcularTotalPedido(pedido: PedidoComItens): number {
  return pedido.itens_do_pedido
    .filter((item) => !item.removido)
    .reduce((soma, item) => soma + item.preco_centavos_unitario * item.quantidade, 0)
}

export function ehEntregaDireta(pedido: PedidoComItens): boolean {
  if (!pedido.pronto_em || !pedido.entregue_em) return false
  const diferencaMs = Math.abs(
    new Date(pedido.entregue_em).getTime() - new Date(pedido.pronto_em).getTime(),
  )
  return diferencaMs < 1000
}

function naoCancelados(pedidos: PedidoComItens[]): PedidoComItens[] {
  return pedidos.filter((p) => p.status !== 'cancelado')
}

export function calcularTotalBruto(pedidos: PedidoComItens[]): number {
  return naoCancelados(pedidos).reduce((soma, p) => soma + calcularTotalPedido(p), 0)
}

export type DivisaoMetodo = { total: number; quantidade: number; percentual: number }

export function calcularDivisaoPorMetodo(
  pedidos: PedidoComItens[],
): Record<MetodoOuNaoInformado, DivisaoMetodo> {
  const validos = naoCancelados(pedidos)
  const totalGeral = validos.reduce((soma, p) => soma + calcularTotalPedido(p), 0)

  const resultado = {} as Record<MetodoOuNaoInformado, DivisaoMetodo>

  for (const chave of METODOS_OU_NAO_INFORMADO) {
    const doMetodo = validos.filter((p) =>
      chave === 'nao_informado' ? !p.metodo_pagamento : p.metodo_pagamento === chave,
    )
    const total = doMetodo.reduce((soma, p) => soma + calcularTotalPedido(p), 0)
    resultado[chave] = {
      total,
      quantidade: doMetodo.length,
      percentual: totalGeral > 0 ? (total / totalGeral) * 100 : 0,
    }
  }

  return resultado
}

export type DetalhamentoLiquido = {
  metodo: MetodoOuNaoInformado
  total: number
  totalLiquido: number
  taxaBps: number | null
}

export type EstimativaLiquida = {
  totalLiquido: number
  detalhamento: DetalhamentoLiquido[]
}

export function calcularEstimativaLiquida(
  pedidos: PedidoComItens[],
  taxaDebitoBps: number | null,
  taxaCreditoBps: number | null,
): EstimativaLiquida | null {
  if (taxaDebitoBps === null && taxaCreditoBps === null) return null

  const divisao = calcularDivisaoPorMetodo(pedidos)
  const taxaPorMetodo: Record<MetodoOuNaoInformado, number | null> = {
    dinheiro: null,
    debito: taxaDebitoBps,
    credito: taxaCreditoBps,
    pix: null,
    nao_informado: null,
  }

  const detalhamento: DetalhamentoLiquido[] = METODOS_OU_NAO_INFORMADO.filter(
    (chave) => divisao[chave].total > 0,
  ).map((chave) => {
    const taxaBps = taxaPorMetodo[chave]
    const total = divisao[chave].total
    const totalLiquido = taxaBps ? Math.round(total * (1 - taxaBps / 10000)) : total
    return { metodo: chave, total, totalLiquido, taxaBps }
  })

  const totalLiquido = detalhamento.reduce((soma, d) => soma + d.totalLiquido, 0)

  return { totalLiquido, detalhamento }
}

export type PontosAtencao = {
  cancelados: { quantidade: number; valor: number; motivos: Record<string, number> }
  entregaDireta: { quantidade: number }
  itensSemPreco: { pedidos: number; valorEstimado: number }
  itensRemovidos: { quantidade: number }
}

export function calcularPontosAtencao(
  pedidos: PedidoComItens[],
  catalogoPrecos: Map<string, number>,
): PontosAtencao {
  const cancelados = pedidos.filter((p) => p.status === 'cancelado')
  const valorCancelados = cancelados.reduce((soma, p) => soma + calcularTotalPedido(p), 0)
  const motivos: Record<string, number> = {}
  for (const pedido of cancelados) {
    const chave = pedido.motivo_cancelamento ?? 'outro'
    motivos[chave] = (motivos[chave] ?? 0) + 1
  }

  const entregaDireta = naoCancelados(pedidos).filter(ehEntregaDireta)

  let pedidosComItemSemPreco = 0
  let valorEstimado = 0
  for (const pedido of naoCancelados(pedidos)) {
    const semPreco = pedido.itens_do_pedido.filter(
      (item) => !item.removido && item.preco_centavos_unitario === 0,
    )
    if (semPreco.length === 0) continue
    pedidosComItemSemPreco += 1
    for (const item of semPreco) {
      const precoAtual = item.item_id ? catalogoPrecos.get(item.item_id) : undefined
      if (precoAtual) valorEstimado += precoAtual * item.quantidade
    }
  }

  const itensRemovidos = pedidos.reduce(
    (soma, p) => soma + p.itens_do_pedido.filter((item) => item.removido).length,
    0,
  )

  return {
    cancelados: { quantidade: cancelados.length, valor: valorCancelados, motivos },
    entregaDireta: { quantidade: entregaDireta.length },
    itensSemPreco: { pedidos: pedidosComItemSemPreco, valorEstimado },
    itensRemovidos: { quantidade: itensRemovidos },
  }
}

export type TipoFiltroRelatorio = 'hoje' | 'ontem' | '7dias' | 'data'

export type FiltroRelatorio = {
  tipo: TipoFiltroRelatorio
  data?: string
}

export type IntervaloData = { inicio: string; fim: string }

export function calcularIntervalosRelatorio(filtro: FiltroRelatorio): {
  atual: IntervaloData
  comparacao: IntervaloData
} {
  const hoje = hojeISO()

  if (filtro.tipo === 'hoje') {
    return {
      atual: { inicio: hoje, fim: hoje },
      comparacao: { inicio: deslocarDias(hoje, -7), fim: deslocarDias(hoje, -7) },
    }
  }

  if (filtro.tipo === 'ontem') {
    const ontem = deslocarDias(hoje, -1)
    return {
      atual: { inicio: ontem, fim: ontem },
      comparacao: { inicio: deslocarDias(ontem, -7), fim: deslocarDias(ontem, -7) },
    }
  }

  if (filtro.tipo === '7dias') {
    return {
      atual: { inicio: deslocarDias(hoje, -6), fim: hoje },
      comparacao: { inicio: deslocarDias(hoje, -13), fim: deslocarDias(hoje, -7) },
    }
  }

  const data = filtro.data ?? hoje
  return {
    atual: { inicio: data, fim: data },
    comparacao: { inicio: deslocarDias(data, -7), fim: deslocarDias(data, -7) },
  }
}
