import { useRef } from 'react'
import type { MouseEvent, PointerEvent } from 'react'
import { Check, Clock, Trash } from 'lucide-react'
import clsx from 'clsx'
import { BottomSheet } from './ui/BottomSheet'
import { Button } from './ui/Button'
import { Badge } from './ui/Badge'
import type { Barraca, ItemDoPedido, PedidoComItens } from '../types/database'

const DURACAO_LONGO_TOQUE_MS = 1000

function minutosDecorridos(pedido: PedidoComItens): number {
  const inicio = new Date(pedido.criado_em).getTime()
  return Math.max(0, Math.floor((Date.now() - inicio) / 60000))
}

function corSemaforo(minutos: number, barraca: Barraca): 'verde' | 'amarelo' | 'vermelho' {
  if (minutos <= barraca.verde_ate) return 'verde'
  if (minutos <= barraca.amarelo_ate) return 'amarelo'
  return 'vermelho'
}

const TEXTO_COR: Record<'verde' | 'amarelo' | 'vermelho', string> = {
  verde: 'text-mesa-kanban-green',
  amarelo: 'text-mesa-kanban-yellow',
  vermelho: 'text-mesa-kanban-red',
}

function formatarMinutos(minutos: number): string {
  const h = Math.floor(minutos / 60)
  const m = minutos % 60
  return h > 0 ? `${h}h${String(m).padStart(2, '0')}` : `${m} min`
}

function LinhaItemDetalhe({
  item,
  marcado,
  onAlternar,
  onSolicitarRemocao,
}: {
  item: ItemDoPedido
  marcado: boolean
  onAlternar: () => void
  onSolicitarRemocao: () => void
}) {
  const timerRef = useRef<number | null>(null)
  const disparouRef = useRef(false)

  function iniciarToque() {
    if (item.removido) return
    disparouRef.current = false
    timerRef.current = window.setTimeout(() => {
      disparouRef.current = true
      onSolicitarRemocao()
    }, DURACAO_LONGO_TOQUE_MS)
  }

  function cancelarToque() {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  function aoClicar(e: MouseEvent<HTMLLIElement>) {
    if (disparouRef.current) e.stopPropagation()
  }

  return (
    <li
      onPointerDown={(e: PointerEvent<HTMLLIElement>) => {
        if ((e.target as HTMLElement).closest('button')) return
        iniciarToque()
      }}
      onPointerUp={cancelarToque}
      onPointerLeave={cancelarToque}
      onPointerCancel={cancelarToque}
      onContextMenu={(e) => e.preventDefault()}
      onClick={aoClicar}
      className={clsx(
        'flex select-none items-center gap-3 border-b border-mesa-border-subtle py-2.5 last:border-b-0',
        item.removido && 'opacity-40',
      )}
    >
      {item.removido ? (
        <span className="size-7 shrink-0" />
      ) : (
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation()
            // TODO(fase 4): Persistir estado "entregue" no banco.
            // A coluna já existe (itens_do_pedido.entregue / entregue_em —
            // era gravada por alternarEntregueItem antes desta reforma,
            // removida quando este checkbox virou só-visual). Falta:
            // - Trocar onAlternar/onAlternarLocal por uma chamada real ao
            //   Supabase (mesmo padrão de aplicarPatchItem já usado pelo
            //   resto da tela)
            // - Sync via Supabase Realtime pra outros aparelhos verem em
            //   tempo real (PedidosContext já assina a tabela — falta o
            //   componente ler o valor real em vez do Set local)
            // - No card da Cozinha (fora do sheet), refletir chips
            //   entregues como verdes riscados (padrão do que já foi
            //   marcado)
            // - Contador "X/Y" no ícone de checklist do card fica com
            //   dado real
            onAlternar()
          }}
          aria-label={marcado ? `Desmarcar ${item.nome_item} como entregue` : `Marcar ${item.nome_item} como entregue`}
          className="flex size-11 shrink-0 items-center justify-center outline-none"
        >
          <span
            className={clsx(
              'flex size-7 items-center justify-center rounded-mesa-full border-2 transition-colors',
              marcado
                ? 'border-mesa-teal-500 bg-mesa-teal-500'
                : 'border-mesa-neutral-300 bg-transparent dark:border-mesa-neutral-600',
            )}
          >
            {marcado && <Check className="size-4 text-white" strokeWidth={3} aria-hidden />}
          </span>
        </button>
      )}

      <span
        className={clsx(
          'min-w-0 flex-1 truncate text-base',
          item.removido
            ? 'text-mesa-text-tertiary line-through'
            : marcado
              ? 'text-mesa-text-tertiary line-through'
              : 'text-mesa-text-primary',
        )}
      >
        {item.nome_item}
      </span>

      <span className="shrink-0 rounded-mesa-full bg-mesa-neutral-100 px-2.5 py-1 text-xs font-semibold text-mesa-text-secondary dark:bg-mesa-neutral-700">
        ×{item.quantidade}
      </span>

      {!item.removido && (
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation()
            onSolicitarRemocao()
          }}
          aria-label={`Remover ${item.nome_item} do pedido`}
          className="group flex size-11 shrink-0 items-center justify-center outline-none"
        >
          <span className="flex size-[30px] items-center justify-center rounded-mesa-sm text-mesa-text-secondary transition-colors group-hover:bg-mesa-error-50 group-hover:text-mesa-error-700 dark:group-hover:bg-mesa-error-500/15 dark:group-hover:text-mesa-error-500">
            <Trash className="size-4" aria-hidden />
          </span>
        </button>
      )}
    </li>
  )
}

export function DetalheComanda({
  pedido,
  barraca,
  marcados,
  onFechar,
  onAlternarLocal,
  onSolicitarRemocaoItem,
  onMoverParaPronto,
  onCancelar,
}: {
  pedido: PedidoComItens | null
  barraca: Barraca
  marcados: Set<string>
  onFechar: () => void
  onAlternarLocal: (itemId: string) => void
  onSolicitarRemocaoItem: (item: ItemDoPedido) => void
  onMoverParaPronto: (pedido: PedidoComItens) => void
  onCancelar: (pedido: PedidoComItens) => void
}) {
  const itensAtivos = pedido?.itens_do_pedido.filter((i) => !i.removido) ?? []
  const itensRemovidos = pedido?.itens_do_pedido.filter((i) => i.removido) ?? []
  const totalAtivos = itensAtivos.length
  const marcadosCount = itensAtivos.filter((i) => marcados.has(i.id)).length
  const progresso = totalAtivos > 0 ? (marcadosCount / totalAtivos) * 100 : 0

  const minutos = pedido ? minutosDecorridos(pedido) : 0
  const cor = pedido ? corSemaforo(minutos, barraca) : 'verde'

  return (
    <BottomSheet open={pedido !== null} onClose={onFechar} aria-label="Detalhes da comanda">
      {pedido && (
        <>
          <div className="flex items-center gap-3">
            <span className="text-3xl font-black leading-none text-mesa-text-tertiary">
              {pedido.senha}
            </span>
            {(pedido.viagem || pedido.mesa) && (
              <>
                <span className="text-mesa-border-default" aria-hidden>
                  |
                </span>
                <Badge variant="neutral">{pedido.viagem ? 'Viagem' : `Mesa ${pedido.mesa}`}</Badge>
              </>
            )}
            <span className={clsx('ml-auto flex items-center gap-1.5 text-sm font-semibold', TEXTO_COR[cor])}>
              <Clock className="size-4 shrink-0" aria-hidden />
              {formatarMinutos(minutos)} em preparo
            </span>
          </div>

          <p className="mt-4 text-sm text-mesa-text-secondary">Marque os itens conforme forem saindo</p>

          <ul className="mt-2">
            {itensAtivos.map((item) => (
              <LinhaItemDetalhe
                key={item.id}
                item={item}
                marcado={marcados.has(item.id)}
                onAlternar={() => onAlternarLocal(item.id)}
                onSolicitarRemocao={() => onSolicitarRemocaoItem(item)}
              />
            ))}
            {itensRemovidos.map((item) => (
              <LinhaItemDetalhe
                key={item.id}
                item={item}
                marcado={false}
                onAlternar={() => {}}
                onSolicitarRemocao={() => {}}
              />
            ))}
          </ul>

          {totalAtivos > 0 && (
            <div className="mt-2 flex items-center gap-3">
              <div className="h-2 flex-1 overflow-hidden rounded-mesa-full bg-mesa-neutral-100 dark:bg-mesa-neutral-700">
                <div
                  className="h-full rounded-mesa-full bg-mesa-teal-500 transition-[width] duration-[var(--mesa-duration-short)]"
                  style={{ width: `${progresso}%` }}
                />
              </div>
              <span className="shrink-0 text-sm font-medium text-mesa-text-secondary">
                {marcadosCount} de {totalAtivos}
              </span>
            </div>
          )}

          <div className="mt-6 flex flex-col gap-2">
            <Button
              variant="confirm"
              size="xl"
              className="w-full"
              onClick={() => onMoverParaPronto(pedido)}
            >
              Mover para Pronto
            </Button>
            <button
              type="button"
              onClick={() => onCancelar(pedido)}
              className="min-h-11 text-sm font-semibold text-mesa-error-500"
            >
              Cancelar comanda
            </button>
          </div>
        </>
      )}
    </BottomSheet>
  )
}
