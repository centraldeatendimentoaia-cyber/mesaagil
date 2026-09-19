import { supabase } from './supabase'

const DIAS_JANELA_POPULARIDADE = 30
const MAXIMO_ITENS_MAIS_PEDIDOS = 8

type LinhaItemPedido = {
  item_id: string | null
  quantidade: number
  removido: boolean
}

/** IDs dos itens mais pedidos da barraca nos últimos 30 dias, do mais pro
 * menos pedido — usado no chip "Mais Pedidos" de Lançar Pedido. Conta
 * quantidade real de itens em pedidos não cancelados, não número de
 * comandas. Item sem item_id (cardápio já apagou) não entra — não tem
 * como adicionar ele de novo no carrinho de qualquer forma. */
export async function buscarIdsMaisPedidos(barracaId: string): Promise<string[]> {
  const desde = new Date()
  desde.setDate(desde.getDate() - DIAS_JANELA_POPULARIDADE)

  const { data, error } = await supabase
    .from('itens_do_pedido')
    .select('item_id, quantidade, removido, pedidos!inner(barraca_id, criado_em, status)')
    .eq('pedidos.barraca_id', barracaId)
    .gte('pedidos.criado_em', desde.toISOString())
    .neq('pedidos.status', 'cancelado')

  if (error || !data) return []

  const totaisPorItem = new Map<string, number>()
  for (const linha of data as unknown as LinhaItemPedido[]) {
    if (linha.removido || !linha.item_id) continue
    totaisPorItem.set(linha.item_id, (totaisPorItem.get(linha.item_id) ?? 0) + linha.quantidade)
  }

  return [...totaisPorItem.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAXIMO_ITENS_MAIS_PEDIDOS)
    .map(([itemId]) => itemId)
}
