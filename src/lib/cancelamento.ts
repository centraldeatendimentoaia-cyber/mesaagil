export type MotivoCancelamento = 'cliente_desistiu' | 'erro_pedido' | 'sem_estoque' | 'outro'

export const MOTIVOS_CANCELAMENTO: { valor: MotivoCancelamento; rotulo: string }[] = [
  { valor: 'cliente_desistiu', rotulo: 'Cliente desistiu' },
  { valor: 'erro_pedido', rotulo: 'Erro no pedido' },
  { valor: 'sem_estoque', rotulo: 'Sem estoque' },
  { valor: 'outro', rotulo: 'Outro' },
]
