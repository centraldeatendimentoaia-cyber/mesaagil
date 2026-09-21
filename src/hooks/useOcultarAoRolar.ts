import { useEffect, useRef, useState } from 'react'

const LIMIAR_TOPO_PX = 24
// Quanto precisa descer (a partir de onde a barra apareceu, seja por chegar
// no topo ou por um toque manual em "exibir") antes de escondê-la nessa
// mesma leva de rolagem. Sem isso, mostrar manualmente no meio da lista e
// rolar 1px já escondia de novo na hora.
const LIMIAR_ESCONDER_PX = 40

/** Esconde uma barra fixa ao rolar pra baixo — útil pra liberar espaço de
 * tela em barras de filtro grandes. Só volta a aparecer sozinha perto do
 * topo da página (não a cada arrastada pra cima, por menor que seja — isso
 * deixava a barra "piscando" por cima do conteúdo ao rolar o Histórico).
 * Também expõe controles manuais de ocultar/exibir, pra um botão dedicado
 * poder chamar em qualquer posição de rolagem — o manual "exibir" fica de
 * pé até o usuário rolar mais um pouco pra baixo a partir dali, não some
 * no próximo pixel de scroll. */
export function useOcultarAoRolar(): [boolean, () => void, () => void] {
  const [escondida, setEscondida] = useState(false)
  const escondidaRef = useRef(false)
  const referenciaYRef = useRef(0)

  useEffect(() => {
    function aoRolar() {
      const posicaoAtual = window.scrollY

      if (posicaoAtual <= LIMIAR_TOPO_PX) {
        referenciaYRef.current = posicaoAtual
        if (escondidaRef.current) {
          escondidaRef.current = false
          setEscondida(false)
        }
        return
      }

      if (!escondidaRef.current) {
        if (posicaoAtual - referenciaYRef.current >= LIMIAR_ESCONDER_PX) {
          escondidaRef.current = true
          setEscondida(true)
        }
        return
      }

      // Já escondida: acompanha a posição, senão reaparecer manualmente no
      // meio da lista e rolar um pouco mais pra baixo escoderia de novo
      // usando uma referência antiga.
      referenciaYRef.current = posicaoAtual
    }

    window.addEventListener('scroll', aoRolar, { passive: true })
    return () => window.removeEventListener('scroll', aoRolar)
  }, [])

  function esconder() {
    referenciaYRef.current = window.scrollY
    escondidaRef.current = true
    setEscondida(true)
  }

  function exibir() {
    referenciaYRef.current = window.scrollY
    escondidaRef.current = false
    setEscondida(false)
  }

  return [escondida, esconder, exibir]
}
