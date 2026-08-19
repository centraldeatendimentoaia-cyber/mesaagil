export type Barraca = {
  id: string
  nome: string
  slug: string
  logo_url: string | null
  cor_primaria: string
  modo: 'claro' | 'escuro'
  verde_ate: number
  amarelo_ate: number
  criada_em: string
}

export type Item = {
  id: string
  barraca_id: string
  nome: string
  ativo: boolean
  ordem: number
}

export type StatusPedido = 'a_fazer' | 'pronto' | 'entregue'

export type Pedido = {
  id: string
  barraca_id: string
  senha: number
  data_operacao: string
  mesa: string | null
  viagem: boolean
  observacao: string | null
  status: StatusPedido
  criado_em: string
  pronto_em: string | null
  entregue_em: string | null
  client_uuid: string | null
}

export type ItemDoPedido = {
  id: string
  pedido_id: string
  item_id: string | null
  nome_item: string
  quantidade: number
  removido: boolean
  removido_em: string | null
  motivo_remocao: string | null
  entregue: boolean
  entregue_em: string | null
}
