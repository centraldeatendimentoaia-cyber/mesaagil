export type Barraca = {
  id: string
  nome: string
  slug: string
  logo_url: string | null
  modo: 'claro' | 'escuro'
  verde_ate: number
  amarelo_ate: number
  criada_em: string
  metodos_pagamento_ativos: string[]
  taxa_debito_bps: number | null
  taxa_credito_bps: number | null
}

export type Item = {
  id: string
  barraca_id: string
  nome: string
  ativo: boolean
  ordem: number
  preco_centavos: number
  categoria_id: string | null
  foto_url: string | null
  descricao: string | null
}

export type Categoria = {
  id: string
  barraca_id: string
  nome: string
  ordem: number
  criada_em: string
}

export type CustoDiario = {
  id: string
  barraca_id: string
  data: string
  valor_centavos: number
}

export type StatusPedido = 'a_fazer' | 'pronto' | 'entregue' | 'cancelado'

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
  motivo_cancelamento: string | null
  cancelado_em: string | null
  metodo_pagamento: string | null
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
  entrega_direta: boolean
  preco_centavos_unitario: number
  observacao: string | null
}

export type PedidoComItens = Pedido & { itens_do_pedido: ItemDoPedido[] }

export type StatusAssinatura = 'trialing' | 'active' | 'past_due' | 'canceled' | 'expired'
export type PlanoAssinatura = 'essencial' | 'pro'
export type CicloAssinatura = 'mensal' | 'anual'

/** Linha crua de assinaturas — retorno de minha_assinatura() (RPC), pra
 * tela "Minha assinatura". Plan/cycle podem ser null no expired "de
 * nascença" (quem já tinha usado o trial com esse e-mail antes). */
export type Assinatura = {
  usuario_id: string
  status: StatusAssinatura
  plan: PlanoAssinatura | null
  cycle: CicloAssinatura | null
  trial_ends_at: string | null
  current_period_end: string | null
  grace_until: string | null
  kirvano_customer_email: string | null
  kirvano_sale_id: string | null
  kirvano_offer_id: string | null
  canceled_at: string | null
  updated_at: string
}

/** Retorno de assinatura_da_barraca(slug) — status da assinatura do DONO
 * da barraca, não do usuário logado (que pode ser um funcionário). */
export type AssinaturaBarraca = {
  status: StatusAssinatura | null
  plano: PlanoAssinatura | null
  ciclo: CicloAssinatura | null
  tem_acesso: boolean
  dias_restantes_trial: number | null
  trial_ends_at: string | null
  current_period_end: string | null
  eh_dono: boolean
}

export type OfertaPublica = {
  plano: PlanoAssinatura
  ciclo: CicloAssinatura
  checkout_url: string
}
