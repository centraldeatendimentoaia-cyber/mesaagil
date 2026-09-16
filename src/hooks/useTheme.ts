import { useEffect, useState } from 'react'

export type Tema = 'claro' | 'escuro'

const CHAVE_STORAGE = 'mesa-theme'

function lerPreferenciaSalva(): Tema | null {
  try {
    const valor = window.localStorage.getItem(CHAVE_STORAGE)
    return valor === 'claro' || valor === 'escuro' ? valor : null
  } catch {
    return null
  }
}

function preferenciaDoSistema(): Tema {
  if (typeof window === 'undefined' || !window.matchMedia) return 'claro'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'escuro' : 'claro'
}

function aplicarClasseDark(tema: Tema): void {
  document.documentElement.classList.toggle('dark', tema === 'escuro')
}

/**
 * Preferência de tema do dispositivo (não confundir com o campo `modo`
 * da barraca, que é o padrão definido por nós via Supabase). Ainda não
 * é consumido por nenhum componente — ver anotação de pendência da
 * Fase 0 sobre a precedência entre os dois mecanismos.
 */
export function useTheme() {
  const [tema, setTemaState] = useState<Tema>(
    () => lerPreferenciaSalva() ?? preferenciaDoSistema(),
  )

  useEffect(() => {
    aplicarClasseDark(tema)
  }, [tema])

  function definirTema(novoTema: Tema): void {
    setTemaState(novoTema)
    try {
      window.localStorage.setItem(CHAVE_STORAGE, novoTema)
    } catch {
      // localStorage indisponível (modo privado, quota etc.) — a escolha
      // só vale para esta sessão, sem persistir entre recarregamentos.
    }
  }

  function alternarTema(): void {
    definirTema(tema === 'escuro' ? 'claro' : 'escuro')
  }

  return { tema, definirTema, alternarTema }
}
