import { useState } from 'react'
import { Clock, X } from 'lucide-react'
import clsx from 'clsx'
import { BottomSheet } from './ui/BottomSheet'
import { Badge } from './ui/Badge'
import { Button } from './ui/Button'
import { Radio } from './ui/Radio'
import { MOTIVOS_CANCELAMENTO } from '../lib/cancelamento'
import type { MotivoCancelamento } from '../lib/cancelamento'
import type { Barraca, PedidoComItens } from '../types/database'

// Mesma lógica de cor por tempo do Cozinha/DetalheComanda — inclui o
// congelamento ao entrar em Pronto, já que esse sheet pode ser aberto a
// partir de um card de qualquer uma das duas colunas.
function minutosDecorridos(pedido: PedidoComItens): number {
  const inicio = new Date(pedido.criado_em).getTime()
  const fim = pedido.status === 'pronto' && pedido.pronto_em
    ? new Date(pedido.pronto_em).getTime()
    : Date.now()
  return Math.max(0, Math.floor((fim - inicio) / 60000))
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

export function ModalCancelamento({
  pedido,
  barraca,
  cancelando,
  onFechar,
  onConfirmar,
}: {
  pedido: PedidoComItens
  barraca: Barraca
  cancelando: boolean
  onFechar: () => void
  onConfirmar: (motivo: MotivoCancelamento) => void
}) {
  const [motivo, setMotivo] = useState<MotivoCancelamento | ''>('')

  const minutos = minutosDecorridos(pedido)
  const cor = corSemaforo(minutos, barraca)
  const rotuloTempo = pedido.status === 'pronto' ? 'parado' : 'em preparo'

  return (
    <BottomSheet open onClose={onFechar} aria-label="Cancelar comanda">
      <div className="flex items-center gap-3">
        <span className="font-mesa-mono text-3xl font-black leading-none text-mesa-text-tertiary">
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
        <span
          className={clsx(
            'ml-auto flex items-center gap-1.5 font-mesa-mono text-sm font-semibold',
            TEXTO_COR[cor],
          )}
        >
          <Clock className="size-4 shrink-0" aria-hidden />
          {formatarMinutos(minutos)} {rotuloTempo}
        </span>
      </div>

      <h2 className="mt-5 text-center text-xl font-bold text-mesa-text-primary">
        Você quer mesmo cancelar comanda?
      </h2>

      <div className="mt-5 flex flex-col gap-1">
        {MOTIVOS_CANCELAMENTO.map((opcao) => (
          <Radio
            key={opcao.valor}
            name="motivo-cancelamento"
            value={opcao.valor}
            checked={motivo === opcao.valor}
            onChange={(valor) => setMotivo(valor as MotivoCancelamento)}
            label={opcao.rotulo}
          />
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-2">
        <Button
          variant="destructive"
          size="xl"
          icon={<X className="size-5" aria-hidden />}
          disabled={!motivo}
          loading={cancelando}
          onClick={() => motivo && onConfirmar(motivo)}
          className="w-full"
        >
          Cancelar comanda
        </Button>
        <button
          type="button"
          onClick={onFechar}
          className="min-h-11 text-sm font-semibold text-mesa-error-500"
        >
          Cancelar
        </button>
      </div>
    </BottomSheet>
  )
}
