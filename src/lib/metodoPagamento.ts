export type MetodoPagamento = 'dinheiro' | 'debito' | 'credito'

export const METODOS_DISPONIVEIS: { chave: MetodoPagamento; label: string; icone: string }[] = [
  { chave: 'dinheiro', label: 'Dinheiro', icone: '💵' },
  { chave: 'debito', label: 'Débito', icone: '💳' },
  { chave: 'credito', label: 'Crédito', icone: '💳' },
]

export function humanizarMetodo(chave: string | null): string {
  if (!chave) return 'Método não informado'
  return METODOS_DISPONIVEIS.find((m) => m.chave === chave)?.label ?? 'Método não informado'
}

export function corMetodo(chave: string | null): string {
  switch (chave) {
    case 'dinheiro':
      return 'bg-sinal-verde/15 text-sinal-verde'
    case 'debito':
      return 'bg-blue-500/15 text-blue-700 dark:text-blue-400'
    case 'credito':
      return 'bg-purple-500/15 text-purple-700 dark:text-purple-400'
    default:
      return 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400'
  }
}
