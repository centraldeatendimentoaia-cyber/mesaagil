import { useState } from 'react'
import clsx from 'clsx'

export type PontoGrafico = { chave: string; rotulo: string; valor: number }

/** Gráfico de colunas de série única (um hue só, mesa-success) — sem paleta
 * categórica porque não há identidade a distinguir, só magnitude ao longo
 * do tempo. Rótulo abaixo do gráfico troca ao tocar/passar o mouse numa
 * barra, em vez de um tooltip flutuante posicionado em cima do SVG
 * (simples e robusto em telas estreitas). */
export function GraficoBarras({
  pontos,
  formatarValor,
  rotuloAcessivel,
}: {
  pontos: PontoGrafico[]
  formatarValor: (valor: number) => string
  rotuloAcessivel: string
}) {
  const [ativo, setAtivo] = useState<number | null>(null)

  if (pontos.length === 0) return null

  const maximo = Math.max(1, ...pontos.map((p) => p.valor))
  const largura = Math.max(pontos.length * 10, 100)
  const altura = 48
  const larguraBarra = (largura / pontos.length) * 0.6
  const espacoBarra = largura / pontos.length

  const passoRotulo = Math.max(1, Math.ceil(pontos.length / 6))
  const indiceExibido = ativo ?? pontos.length - 1
  const pontoExibido = pontos[indiceExibido]

  return (
    <div className="mt-2">
      <svg
        viewBox={`0 0 ${largura} ${altura}`}
        preserveAspectRatio="none"
        className="h-28 w-full"
        role="img"
        aria-label={rotuloAcessivel}
      >
        <line
          x1={0}
          y1={altura - 0.5}
          x2={largura}
          y2={altura - 0.5}
          className="stroke-mesa-border-subtle"
          strokeWidth={0.5}
          vectorEffect="non-scaling-stroke"
        />
        {pontos.map((ponto, indice) => {
          const alturaBarra = ponto.valor > 0 ? Math.max((ponto.valor / maximo) * (altura - 4), 1.5) : 0
          const x = indice * espacoBarra + (espacoBarra - larguraBarra) / 2
          return (
            <rect
              key={ponto.chave}
              x={x}
              y={altura - alturaBarra}
              width={larguraBarra}
              height={alturaBarra}
              rx={larguraBarra / 4}
              className={clsx(
                'cursor-pointer transition-colors',
                indiceExibido === indice
                  ? 'fill-mesa-success-700 dark:fill-mesa-success-500'
                  : 'fill-mesa-success-500/30 dark:fill-mesa-success-500/20',
              )}
              onMouseEnter={() => setAtivo(indice)}
              onMouseLeave={() => setAtivo(null)}
              onClick={() => setAtivo(indice)}
            />
          )
        })}
      </svg>

      <div className="mt-1 flex text-[10px] text-mesa-text-tertiary">
        {pontos.map((ponto, indice) =>
          indice % passoRotulo === 0 || indice === pontos.length - 1 ? (
            <span key={ponto.chave} style={{ width: `${100 / pontos.length}%` }} className="text-center">
              {ponto.rotulo}
            </span>
          ) : (
            <span key={ponto.chave} style={{ width: `${100 / pontos.length}%` }} aria-hidden />
          ),
        )}
      </div>

      {pontoExibido && (
        <p className="mt-2 text-sm font-medium text-mesa-text-primary">
          {pontoExibido.rotulo} — <span className="font-mesa-display font-semibold">{formatarValor(pontoExibido.valor)}</span>
        </p>
      )}
    </div>
  )
}
