import type { CSSProperties, HTMLAttributes } from 'react'
import clsx from 'clsx'

/** Ícone via Material Symbols Rounded (fonte variável, ver index.html) —
 * substitui lucide-react no rebrand "Sai aê". `nome` é o nome oficial do
 * símbolo (ex.: "close", "search", "skillet"); `preenchido` liga o eixo
 * FILL pra estado ativo, exatamente como a IDV pede ("preenchido =
 * ativo"). Tamanho fixo em width/height além do font-size pra não
 * herdar o line-height do texto ao redor e desalinhar (mesmo problema
 * que um <svg> solto teria sem viewBox consistente). */
export interface IconeProps extends HTMLAttributes<HTMLSpanElement> {
  nome: string
  size?: number
  preenchido?: boolean
  peso?: 300 | 400 | 500 | 600 | 700
}

export function Icone({ nome, size = 24, preenchido = false, peso = 500, className, style, ...rest }: IconeProps) {
  const estiloIcone: CSSProperties = {
    fontSize: size,
    width: size,
    height: size,
    lineHeight: 1,
    fontVariationSettings: `'FILL' ${preenchido ? 1 : 0}, 'wght' ${peso}, 'GRAD' 0, 'opsz' ${Math.round(size)}`,
    ...style,
  }

  return (
    <span
      className={clsx('material-symbols-rounded inline-flex shrink-0 select-none items-center justify-center leading-none', className)}
      style={estiloIcone}
      aria-hidden={rest['aria-hidden'] ?? true}
      {...rest}
    >
      {nome}
    </span>
  )
}
