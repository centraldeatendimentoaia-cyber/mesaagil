import { useEffect, useRef, useState } from 'react'

const LIMIAR_TOPO_PX = 24
const LIMIAR_MOVIMENTO_PX = 8

/** Esconde uma barra fixa ao rolar pra baixo e mostra de novo ao rolar pra
 * cima — útil pra liberar espaço de tela em barras de filtro grandes.
 * Sempre visível perto do topo da página, mesmo rolando pra baixo. */
export function useOcultarAoRolar(): boolean {
  const [escondida, setEscondida] = useState(false)
  const ultimaPosicaoRef = useRef(0)

  useEffect(() => {
    function aoRolar() {
      const posicaoAtual = window.scrollY

      if (posicaoAtual <= LIMIAR_TOPO_PX) {
        setEscondida(false)
        ultimaPosicaoRef.current = posicaoAtual
        return
      }

      const diferenca = posicaoAtual - ultimaPosicaoRef.current
      if (Math.abs(diferenca) < LIMIAR_MOVIMENTO_PX) return

      setEscondida(diferenca > 0)
      ultimaPosicaoRef.current = posicaoAtual
    }

    window.addEventListener('scroll', aoRolar, { passive: true })
    return () => window.removeEventListener('scroll', aoRolar)
  }, [])

  return escondida
}
