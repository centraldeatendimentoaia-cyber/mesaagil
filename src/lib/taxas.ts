export const BPS_MAX = 5000

export function bpsParaPercentual(bps: number | null): string {
  if (bps === null || bps === undefined) return ''
  const negativo = bps < 0
  const absBps = Math.abs(bps)
  const inteiro = Math.floor(absBps / 100)
  const decimal = String(absBps % 100).padStart(2, '0')
  return `${negativo ? '-' : ''}${inteiro},${decimal}`
}

/**
 * Converte string/number em percentual (aceita vírgula ou ponto) para basis
 * points, truncando em 2 decimais via manipulação de string — mesmo motivo
 * de reaisParaCentavos: evita erros de ponto flutuante. Vazio/null vira
 * null (não configurado), não 0.
 */
export function percentualParaBps(percentual: number | string | null): number | null {
  if (percentual === null || percentual === undefined) return null
  const texto = String(percentual).trim().replace(',', '.')
  if (!texto) return null

  const negativo = texto.startsWith('-')
  const semSinal = negativo ? texto.slice(1) : texto

  const [parteInteira, parteDecimal = ''] = semSinal.split('.')
  const inteiro = parteInteira.replace(/\D/g, '') || '0'
  const decimal = (parteDecimal.replace(/\D/g, '') + '00').slice(0, 2)

  const bps = Number(inteiro) * 100 + Number(decimal)
  if (!Number.isFinite(bps)) return null

  return negativo ? -bps : bps
}

export function formatarTaxaBR(bps: number | null): string {
  if (bps === null || bps === undefined) return 'não configurada'
  return `${bpsParaPercentual(bps)}%`
}
