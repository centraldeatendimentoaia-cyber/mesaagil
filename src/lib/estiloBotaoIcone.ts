import clsx from 'clsx'

/** Classe compartilhada pros botões de ícone circulares do cabeçalho
 * (tema, ajustes, sair) — usada tanto em <button> quanto em <Link>, por
 * isso é uma função de classe, não um componente que assume o elemento.
 * Cantos rounded-mesa-lg (não mais rounded-full) e variant="danger" pro
 * botão de sair, que precisa se destacar dos outros com um tom vermelho
 * translúcido em vez do neutro padrão. */
export function classesBotaoIcone(variant: 'neutral' | 'danger' = 'neutral'): string {
  return clsx(
    'flex size-11 shrink-0 items-center justify-center rounded-mesa-lg outline-none transition-colors duration-[var(--mesa-duration-micro)]',
    variant === 'danger'
      ? 'bg-mesa-error-500/15 text-mesa-error-500 focus-visible:[box-shadow:var(--mesa-focus-ring-danger)] dark:bg-mesa-error-500/20'
      : 'bg-mesa-surface text-mesa-text-primary shadow-mesa-1 focus-visible:[box-shadow:var(--mesa-focus-ring-primary)]',
  )
}
