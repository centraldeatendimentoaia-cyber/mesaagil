import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import {
  calcularDivisaoPorMetodo,
  calcularEstimativaLiquida,
  calcularIntervalosRelatorio,
  calcularPontosAtencao,
  calcularTotalBruto,
} from '../lib/relatorio'
import type {
  DivisaoMetodo,
  EstimativaLiquida,
  FiltroRelatorio,
  MetodoOuNaoInformado,
  PontosAtencao,
} from '../lib/relatorio'
import type { Barraca, PedidoComItens } from '../types/database'

export type { FiltroRelatorio, TipoFiltroRelatorio } from '../lib/relatorio'

export type AgregadosRelatorio = {
  pedidos: PedidoComItens[]
  totalBruto: number
  quantidadePedidos: number
  divisaoPorMetodo: Record<MetodoOuNaoInformado, DivisaoMetodo>
  estimativaLiquida: EstimativaLiquida | null
  pontosAtencao: PontosAtencao
}

async function buscarPedidosDoPeriodo(
  barracaId: string,
  inicio: string,
  fim: string,
): Promise<PedidoComItens[]> {
  const { data, error } = await supabase
    .from('pedidos')
    .select('*, itens_do_pedido(*)')
    .eq('barraca_id', barracaId)
    .gte('data_operacao', inicio)
    .lte('data_operacao', fim)

  if (error) throw error
  return (data ?? []) as PedidoComItens[]
}

async function buscarCatalogoPrecos(barracaId: string): Promise<Map<string, number>> {
  const { data, error } = await supabase
    .from('itens')
    .select('id, preco_centavos')
    .eq('barraca_id', barracaId)

  if (error) throw error
  return new Map(
    (data ?? []).map((item) => [item.id as string, item.preco_centavos as number]),
  )
}

function agregar(
  pedidos: PedidoComItens[],
  catalogoPrecos: Map<string, number>,
  taxaDebitoBps: number | null,
  taxaCreditoBps: number | null,
): AgregadosRelatorio {
  return {
    pedidos,
    totalBruto: calcularTotalBruto(pedidos),
    quantidadePedidos: pedidos.filter((p) => p.status !== 'cancelado').length,
    divisaoPorMetodo: calcularDivisaoPorMetodo(pedidos),
    estimativaLiquida: calcularEstimativaLiquida(pedidos, taxaDebitoBps, taxaCreditoBps),
    pontosAtencao: calcularPontosAtencao(pedidos, catalogoPrecos),
  }
}

export function useRelatorio(
  barraca: Barraca,
  filtro: FiltroRelatorio,
): {
  atual: AgregadosRelatorio | null
  comparacao: AgregadosRelatorio | null
  carregando: boolean
  erro: string | null
} {
  const [pedidosAtuais, setPedidosAtuais] = useState<PedidoComItens[] | null>(null)
  const [pedidosComparacao, setPedidosComparacao] = useState<PedidoComItens[] | null>(null)
  const [catalogoPrecos, setCatalogoPrecos] = useState<Map<string, number>>(new Map())
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    let cancelado = false
    setCarregando(true)
    setErro(null)

    const intervalos = calcularIntervalosRelatorio(filtro)

    Promise.all([
      buscarPedidosDoPeriodo(barraca.id, intervalos.atual.inicio, intervalos.atual.fim),
      buscarPedidosDoPeriodo(
        barraca.id,
        intervalos.comparacao.inicio,
        intervalos.comparacao.fim,
      ),
      buscarCatalogoPrecos(barraca.id),
    ])
      .then(([atual, comparacao, catalogo]) => {
        if (cancelado) return
        setPedidosAtuais(atual)
        setPedidosComparacao(comparacao)
        setCatalogoPrecos(catalogo)
        setCarregando(false)
      })
      .catch((e: Error) => {
        if (cancelado) return
        setErro(e.message)
        setCarregando(false)
      })

    return () => {
      cancelado = true
    }
    // depende dos campos primitivos de filtro, não do objeto — o chamador
    // passa um literal inline, então uma dependência em `filtro` mudaria de
    // referência a cada render e refaria a busca sem necessidade
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [barraca.id, filtro.tipo, filtro.data])

  // barraca vem inteira (não só o id) especificamente pra isso: useBarraca
  // mostra o cache offline-first na hora e só troca pela versão de verdade
  // quando a rede responde. Como aqui não há edição do usuário pra proteger
  // (é leitura pura), basta recalcular via useMemo sempre que os campos de
  // taxa mudarem — sem precisar do guard de "debounce em voo" usado em
  // Ajustes.
  const atual = useMemo(() => {
    if (!pedidosAtuais) return null
    return agregar(pedidosAtuais, catalogoPrecos, barraca.taxa_debito_bps, barraca.taxa_credito_bps)
  }, [pedidosAtuais, catalogoPrecos, barraca.taxa_debito_bps, barraca.taxa_credito_bps])

  const comparacao = useMemo(() => {
    if (!pedidosComparacao) return null
    return agregar(
      pedidosComparacao,
      catalogoPrecos,
      barraca.taxa_debito_bps,
      barraca.taxa_credito_bps,
    )
  }, [pedidosComparacao, catalogoPrecos, barraca.taxa_debito_bps, barraca.taxa_credito_bps])

  return { atual, comparacao, carregando, erro }
}
