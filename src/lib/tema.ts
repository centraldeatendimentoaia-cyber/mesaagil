export function aplicarTema(modo: 'claro' | 'escuro'): void {
  document.documentElement.classList.toggle('dark', modo === 'escuro')
}
