import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ChevronLeft, FileText, Hash, Plane, type LucideIcon } from 'lucide-react'
import { useBarracaAtual } from '../layouts/contextoBarraca'
import { enfileirar } from '../lib/fila'
import { formatarPrecoBR } from '../lib/preco'
import {
  proximoNumeroProvisorio,
  type EntregaDiretaPorItem,
  type EstadoParaConfirmar,
  type EstadoParaEditar,
  type EstadoPedidoEnviado,
} from '../lib/carrinho'
import { METODOS_DISPONIVEIS } from '../lib/metodoPagamento'
import type { MetodoPagamento } from '../lib/metodoPagamento'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Checkbox } from '../components/ui/Checkbox'
import { SegmentedControl } from '../components/ui/SegmentedControl'
import type { Item } from '../types/database'

const METODOS_PADRAO: MetodoPagamento[] = ['dinheiro', 'debito', 'credito', 'pix']
const DURACAO_AVISO_NFE_MS = 3000

function LinhaItemConfirmar({
  item,
  quantidade,
  marcado,
  onAlternar,
}: {
  item: Item
  quantidade: number
  marcado: boolean
  onAlternar: () => void
}) {
  const temPreco = item.preco_centavos > 0
  const subtotal = item.preco_centavos * quantidade

  return (
    <div className="flex items-start gap-3 border-b border-dashed border-mesa-border-subtle py-3 last:border-b-0">
      <div className="pt-0.5">
        <Checkbox
          checked={marcado}
          onChange={onAlternar}
          aria-label={`Entregar ${item.nome} direto sem passar na cozinha`}
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-base font-semibold text-mesa-text-primary">
          {quantidade}× {item.nome}
        </p>
        <p className="mt-0.5 text-xs text-mesa-text-secondary">
          {temPreco ? `${formatarPrecoBR(item.preco_centavos)} cada` : 'Sem preço cadastrado'}
          {marcado && ' · Entregar direto sem passar na cozinha'}
        </p>
      </div>
      <p className="shrink-0 text-base font-semibold text-mesa-text-primary">
        {temPreco ? formatarPrecoBR(subtotal) : '—'}
      </p>
    </div>
  )
}

function LinhaMeta({
  icone: Icone,
  label,
  valor,
}: {
  icone: LucideIcon
  label: string
  valor: string
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-mesa-border-subtle py-3 last:border-b-0">
      <span className="flex items-center gap-2 text-sm text-mesa-text-secondary">
        <Icone className="size-4 shrink-0" aria-hidden />
        {label}
      </span>
      <span className="text-sm font-semibold text-mesa-text-primary">{valor}</span>
    </div>
  )
}

export function ConfirmarPedido() {
  const barraca = useBarracaAtual()
  const navigate = useNavigate()
  const location = useLocation()

  const estado = (location.state as EstadoParaConfirmar | null) ?? null

  // Guarda de rota: sem carrinho no state (entrou direto na URL, atualizou a
  // página, etc.), não tem o que confirmar — volta pro Lançar Pedido sem
  // quebrar. O redirect roda em efeito porque navigate() não é setState.
  useEffect(() => {
    if (!estado || Object.keys(estado.carrinho).length === 0) {
      navigate(`/${barraca.slug}`, { replace: true })
    }
  }, [estado, barraca.slug, navigate])

  const metodosAtivos = barraca.metodos_pagamento_ativos ?? METODOS_PADRAO
  const opcoesPagamento = METODOS_DISPONIVEIS.filter((m) => metodosAtivos.includes(m.chave))

  const [entregaDireta, setEntregaDireta] = useState<EntregaDiretaPorItem>(
    () => estado?.entregaDireta ?? {},
  )
  const [metodoSelecionado, setMetodoSelecionado] = useState<MetodoPagamento | null>(() =>
    opcoesPagamento.length === 1 ? opcoesPagamento[0].chave : null,
  )
  const [enviando, setEnviando] = useState(false)
  const [avisoNFe, setAvisoNFe] = useState(false)
  const enviandoRef = useRef(false)
  const avisoNFeTimerRef = useRef<number | null>(null)
  const clientUuidRef = useRef(crypto.randomUUID())

  useEffect(() => {
    return () => {
      if (avisoNFeTimerRef.current !== null) window.clearTimeout(avisoNFeTimerRef.current)
    }
  }, [])

  if (!estado || Object.keys(estado.carrinho).length === 0) {
    return null
  }

  const { carrinho, itens, mesa, viagem, observacao } = estado

  const linhas = Object.entries(carrinho)
    .filter(([, quantidade]) => quantidade > 0)
    .map(([itemId, quantidade]) => ({
      item: itens.find((i) => i.id === itemId),
      itemId,
      quantidade,
    }))
    .filter((linha): linha is { item: Item; itemId: string; quantidade: number } => Boolean(linha.item))

  const totalCentavos = linhas.reduce(
    (soma, { item, quantidade }) => soma + (item.preco_centavos > 0 ? item.preco_centavos * quantidade : 0),
    0,
  )

  function alternarEntregaDireta(itemId: string) {
    setEntregaDireta((atual) => ({ ...atual, [itemId]: !atual[itemId] }))
  }

  function voltarEEditar() {
    navigate(`/${barraca.slug}`, {
      replace: true,
      state: {
        carrinho,
        mesa,
        viagem,
        observacao,
        entregaDireta,
      } satisfies EstadoParaEditar,
    })
  }

  async function enviarPedido(forcarEntregaDiretaEmTudo: boolean) {
    if (enviandoRef.current || !metodoSelecionado) return
    enviandoRef.current = true
    setEnviando(true)

    const itensPedido = linhas.map(({ item, itemId, quantidade }) => ({
      item_id: itemId,
      nome_item: item.nome,
      quantidade,
      preco_centavos_unitario: item.preco_centavos,
      entrega_direta: forcarEntregaDiretaEmTudo ? true : (entregaDireta[itemId] ?? false),
    }))

    const operacao = await enfileirar('criar_pedido', {
      p_barraca_id: barraca.id,
      p_mesa: viagem ? null : mesa.trim() || null,
      p_viagem: viagem,
      p_observacao: observacao.trim() || null,
      p_client_uuid: clientUuidRef.current,
      p_metodo_pagamento: metodoSelecionado,
      p_itens: itensPedido,
    })

    navigate(`/${barraca.slug}`, {
      replace: true,
      state: {
        senhaEnviada: {
          valor: proximoNumeroProvisorio(barraca.id),
          provisoria: true,
          idFila: operacao.id,
        },
      } satisfies EstadoPedidoEnviado,
    })
  }

  function aoClicarImprimirNFe() {
    // TODO(fase 5): impressão real de NFe. Por enquanto o botão é só
    // visual — fica com aparência desabilitada, mas o clique mostra este
    // aviso em vez de silenciosamente não fazer nada.
    setAvisoNFe(true)
    if (avisoNFeTimerRef.current !== null) window.clearTimeout(avisoNFeTimerRef.current)
    avisoNFeTimerRef.current = window.setTimeout(() => setAvisoNFe(false), DURACAO_AVISO_NFE_MS)
  }

  const podeEnviar = metodoSelecionado !== null && !enviando

  return (
    <div className="flex min-h-screen flex-col">
      <div className="px-6 pt-[calc(env(safe-area-inset-top)+20px)]">
        <button
          type="button"
          onClick={voltarEEditar}
          className="inline-flex items-center gap-2 text-mesa-teal-700 outline-none dark:text-mesa-teal-300"
        >
          <ChevronLeft className="size-7 shrink-0" aria-hidden />
          <h1 className="text-[32px] font-bold leading-[40px]">Confirmar pedido</h1>
        </button>
        <p className="mt-1 text-sm text-mesa-text-secondary">
          A senha é gerada só depois de confirmar
        </p>
      </div>

      <div className="flex-1 px-6 pb-10 pt-5">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.08em] text-mesa-text-secondary">
          Itens do pedido
        </h2>
        <Card>
          {linhas.map(({ item, itemId, quantidade }) => (
            <LinhaItemConfirmar
              key={itemId}
              item={item}
              quantidade={quantidade}
              marcado={entregaDireta[itemId] ?? false}
              onAlternar={() => alternarEntregaDireta(itemId)}
            />
          ))}
        </Card>

        {(mesa.trim() || viagem || observacao.trim()) && (
          <Card className="mt-4">
            {viagem ? (
              <LinhaMeta icone={Plane} label="Viagem" valor="sim" />
            ) : mesa.trim() ? (
              <LinhaMeta icone={Hash} label="Mesa" valor={mesa.trim()} />
            ) : null}
            {observacao.trim() && <LinhaMeta icone={FileText} label="Obs" valor={observacao.trim()} />}
          </Card>
        )}

        <div className="mt-4 flex items-center justify-between rounded-mesa-lg bg-mesa-teal-50 px-5 py-4 dark:bg-mesa-teal-500/15">
          <span className="text-base font-semibold text-mesa-text-primary">Total</span>
          <span className="text-2xl font-bold text-mesa-teal-700 dark:text-mesa-teal-400">
            {formatarPrecoBR(totalCentavos)}
          </span>
        </div>

        <h2 className="mb-3 mt-6 text-xs font-semibold uppercase tracking-[0.08em] text-mesa-text-secondary">
          Forma de pagamento
        </h2>
        {opcoesPagamento.length === 0 ? (
          <p className="rounded-mesa-md border-l-[3px] border-mesa-error-500 bg-mesa-error-50 p-3 text-sm font-medium text-mesa-error-700 dark:bg-mesa-error-500/15 dark:text-mesa-error-400">
            Configure ao menos um método de pagamento em Ajustes.
          </p>
        ) : (
          <SegmentedControl
            aria-label="Forma de pagamento"
            items={opcoesPagamento.map((m) => ({ label: m.label }))}
            activeIndex={
              metodoSelecionado ? opcoesPagamento.findIndex((m) => m.chave === metodoSelecionado) : -1
            }
            onChange={(indice) => setMetodoSelecionado(opcoesPagamento[indice].chave)}
          />
        )}

        <div className="mt-8 flex flex-col gap-3">
          <Button
            variant="primary"
            size="xl"
            disabled={!podeEnviar}
            loading={enviando}
            onClick={() => enviarPedido(false)}
            className="w-full"
          >
            Confirmar e enviar
          </Button>
          <Button
            variant="confirm"
            size="xl"
            disabled={!podeEnviar}
            loading={enviando}
            onClick={() => enviarPedido(true)}
            className="w-full"
          >
            Entregar
          </Button>
          <Button
            variant="outline"
            size="xl"
            onClick={aoClicarImprimirNFe}
            className="w-full opacity-40"
          >
            Imprimir NFe
          </Button>
          <p role="status" className="text-center text-xs text-mesa-text-secondary">
            {avisoNFe ? 'Em breve' : ' '}
          </p>

          <button
            type="button"
            onClick={voltarEEditar}
            className="min-h-11 text-center text-sm font-semibold text-mesa-teal-700 dark:text-mesa-teal-300"
          >
            Voltar e editar
          </button>
        </div>
      </div>
    </div>
  )
}
