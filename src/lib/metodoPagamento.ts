export type MetodoPagamento = 'dinheiro' | 'debito' | 'credito' | 'pix'

// Nomes do Material Symbols Rounded — mesmos da IDV Sai aê (payments/
// credit_card/qr_code_2, ver DESIGN.md "Ícones-chave").
export const METODOS_DISPONIVEIS: { chave: MetodoPagamento; label: string; icone: string }[] = [
  { chave: 'dinheiro', label: 'Dinheiro', icone: 'payments' },
  { chave: 'debito', label: 'Débito', icone: 'credit_card' },
  { chave: 'credito', label: 'Crédito', icone: 'credit_card' },
  { chave: 'pix', label: 'Pix', icone: 'qr_code_2' },
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
    case 'pix':
      return 'bg-teal-500/15 text-teal-700 dark:text-teal-400'
    default:
      return 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400'
  }
}
