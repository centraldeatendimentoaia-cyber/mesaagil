import { createContext, useContext } from 'react'
import type { PedidoComItens, StatusConexao } from '../hooks/useRealtimePedidos'
import type { ItemDoPedido, Pedido } from '../types/database'

export type EstadoPedidos = {
  pedidos: PedidoComItens[]
  status: StatusConexao
  contagemAFazer: number
  contagemPronto: number
  aplicarPatchPedido: (id: string, patch: Partial<Pedido>) => void
  aplicarPatchItem: (pedidoId: string, itemId: string, patch: Partial<ItemDoPedido>) => void
}

export const PedidosContext = createContext<EstadoPedidos | null>(null)

/**
 * Fonte única do useRealtimePedidos, assinado uma vez em LayoutBarraca —
 * Cozinha, Chamada e a BarraNavegacao (badge de contagem) leem daqui em
 * vez de cada um abrir seu próprio canal realtime.
 */
export function usePedidosAtual(): EstadoPedidos {
  const estado = useContext(PedidosContext)
  if (!estado) {
    throw new Error('usePedidosAtual precisa ser usado dentro de LayoutBarraca')
  }
  return estado
}
