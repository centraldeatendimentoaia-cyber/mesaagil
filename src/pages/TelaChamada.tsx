import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useBarracaAtual } from '../layouts/LayoutBarraca'
import type { Pedido } from '../types/database'

type PedidoPronto = Pick<Pedido, 'id' | 'senha' | 'viagem' | 'pronto_em'>

const INTERVALO_POLLING_MS = 5000
const DURACAO_DESTAQUE_MS = 10000

function dataOperacaoAtual(): string {
  const agora = new Date()
  const ano = agora.getFullYear()
  const mes = String(agora.getMonth() + 1).padStart(2, '0')
  const dia = String(agora.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

function tamanhoGrade(quantidade: number): { colunas: string; texto: string } {
  if (quantidade <= 1) return { colunas: 'grid-cols-1', texto: 'text-[260px]' }
  if (quantidade === 2) return { colunas: 'grid-cols-2', texto: 'text-[200px]' }
  if (quantidade <= 4) return { colunas: 'grid-cols-2', texto: 'text-[160px]' }
  if (quantidade <= 6) return { colunas: 'grid-cols-3', texto: 'text-[120px]' }
  if (quantidade <= 9) return { colunas: 'grid-cols-3', texto: 'text-[90px]' }
  return { colunas: 'grid-cols-4', texto: 'text-[72px]' }
}

export function TelaChamada() {
  const barraca = useBarracaAtual()
  const [pedidos, setPedidos] = useState<PedidoPronto[]>([])
  const [destacados, setDestacados] = useState<Set<string>>(new Set())

  const vistosRef = useRef<Set<string>>(new Set())
  const timersRef = useRef<Map<string, number>>(new Map())

  useEffect(() => {
    let cancelado = false

    function processarNovaLista(novos: PedidoPronto[]) {
      const idsAtuais = new Set(novos.map((p) => p.id))

      for (const id of vistosRef.current) {
        if (!idsAtuais.has(id)) vistosRef.current.delete(id)
      }

      for (const pedido of novos) {
        if (!vistosRef.current.has(pedido.id)) {
          vistosRef.current.add(pedido.id)
          setDestacados((atual) => new Set(atual).add(pedido.id))

          const timer = window.setTimeout(() => {
            setDestacados((atual) => {
              const copia = new Set(atual)
              copia.delete(pedido.id)
              return copia
            })
            timersRef.current.delete(pedido.id)
          }, DURACAO_DESTAQUE_MS)

          timersRef.current.set(pedido.id, timer)
        }
      }

      setPedidos(novos)
    }

    async function buscar() {
      const { data, error } = await supabase
        .from('pedidos')
        .select('id, senha, viagem, pronto_em')
        .eq('barraca_id', barraca.id)
        .eq('data_operacao', dataOperacaoAtual())
        .eq('status', 'pronto')
        .order('pronto_em', { ascending: false })

      if (cancelado) return
      if (!error) {
        processarNovaLista((data ?? []) as PedidoPronto[])
      }
    }

    buscar()
    const intervalo = window.setInterval(buscar, INTERVALO_POLLING_MS)

    return () => {
      cancelado = true
      window.clearInterval(intervalo)
      timersRef.current.forEach((timer) => window.clearTimeout(timer))
      timersRef.current.clear()
    }
  }, [barraca.id])

  const { colunas, texto } = tamanhoGrade(pedidos.length)

  return (
    <div className="flex min-h-screen flex-col bg-cozinha-fundo">
      <header className="flex items-center gap-3 border-b border-white/10 px-6 py-4">
        {barraca.logo_url && (
          <img
            src={barraca.logo_url}
            alt=""
            className="h-8 w-8 rounded-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
        )}
        <span className="text-lg font-semibold text-marca">{barraca.nome}</span>
      </header>

      {pedidos.length === 0 ? (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-3xl font-medium text-neutral-600">Aguardando pedidos...</p>
        </div>
      ) : (
        <div className={`grid flex-1 ${colunas} auto-rows-fr gap-6 p-6`}>
          {pedidos.map((pedido) => {
            const destacado = destacados.has(pedido.id)
            return (
              <div
                key={pedido.id}
                className={`flex flex-col items-center justify-center rounded-3xl border-4 border-sinal-pronto transition-colors duration-1000 ${
                  destacado ? 'bg-neutral-700' : 'bg-neutral-900'
                }`}
              >
                <span className={`font-black leading-none text-white ${texto}`}>
                  {pedido.senha}
                </span>
                {pedido.viagem && (
                  <span className="mt-4 text-2xl font-bold tracking-widest text-neutral-300">
                    VIAGEM
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
