import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowRight, Check, Minus, Plus, type LucideIcon } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useBarracaAtual, useSincronizacaoAtual } from '../layouts/contextoBarraca'
import { aoConcluirCriacaoPedido, enfileirar } from '../lib/fila'
import { formatarPrecoBR } from '../lib/preco'
import { ModalMetodoPagamento } from '../components/ModalMetodoPagamento'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Textarea } from '../components/ui/Textarea'
import { Toggle } from '../components/ui/Toggle'
import type { MetodoPagamento } from '../lib/metodoPagamento'
import type { Item } from '../types/database'

const METODOS_PADRAO: MetodoPagamento[] = ['dinheiro', 'debito', 'credito', 'pix']

type Carrinho = Record<string, number>

type SenhaConfirmada = {
  valor: number
  provisoria: boolean
  idFila?: string
}

function dataOperacaoAtual(): string {
  const agora = new Date()
  const ano = agora.getFullYear()
  const mes = String(agora.getMonth() + 1).padStart(2, '0')
  const dia = String(agora.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

/**
 * Número local, só para o operador ter o que falar/anotar enquanto o
 * pedido real ainda não sincronizou. Isolado por barraca e por dia,
 * mas NUNCA é escrito no banco nem comparado com a senha real — dois
 * dispositivos offline ao mesmo tempo podem gerar o mesmo número
 * provisório, e é por isso que a tela deixa isso muito claro.
 */
function proximoNumeroProvisorio(barracaId: string): number {
  const chave = `mesaagil:provisorio:${barracaId}:${dataOperacaoAtual()}`
  const atual = Number(window.localStorage.getItem(chave) ?? '0')
  const proximo = atual + 1
  window.localStorage.setItem(chave, String(proximo))
  return proximo
}

/**
 * Círculo visível de 40×40 (compacto o bastante pra caber lado a lado
 * num grid de 2 colunas), mas a área clicável real é 44×44 via padding
 * transparente — mesmo padrão do botão de apagar em Ajustes.tsx. A cor
 * de fundo mora só no <span> interno; o <button> em si é transparente.
 */
function BotaoStepper({
  icone: Icone,
  onClick,
  rotulo,
}: {
  icone: LucideIcon
  onClick: () => void
  rotulo: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={rotulo}
      className="flex size-11 shrink-0 items-center justify-center outline-none"
    >
      <span className="flex size-10 items-center justify-center rounded-mesa-full bg-mesa-teal-500 text-white transition-transform active:scale-90">
        <Icone className="size-4" aria-hidden />
      </span>
    </button>
  )
}

function CardItemCardapio({
  item,
  quantidade,
  onIncrementar,
  onDecrementar,
}: {
  item: Item
  quantidade: number
  onIncrementar: () => void
  onDecrementar: () => void
}) {
  const selecionado = quantidade > 0

  return (
    <Card className="flex flex-col">
      <p className="text-base font-semibold text-mesa-text-primary">{item.nome}</p>
      <p className="mt-0.5 text-sm text-mesa-text-secondary">
        {item.preco_centavos > 0 ? formatarPrecoBR(item.preco_centavos) : '—'}
      </p>

      <div className="mt-3">
        {selecionado ? (
          <>
            <div className="flex items-center justify-center gap-1 rounded-mesa-full bg-mesa-teal-50 py-1.5 dark:bg-mesa-teal-500/15">
              <BotaoStepper icone={Minus} onClick={onDecrementar} rotulo={`Remover uma unidade de ${item.nome}`} />
              <span className="min-w-[1.5ch] text-center text-base font-bold text-mesa-teal-700 dark:text-mesa-teal-300">
                {quantidade}
              </span>
              <BotaoStepper icone={Plus} onClick={onIncrementar} rotulo={`Adicionar uma unidade de ${item.nome}`} />
            </div>
            {item.preco_centavos > 0 && (
              <p className="mt-2 text-center text-sm font-semibold text-mesa-teal-700 dark:text-mesa-teal-400">
                Subtotal {formatarPrecoBR(item.preco_centavos * quantidade)}
              </p>
            )}
          </>
        ) : (
          <Button
            variant="confirm"
            size="md"
            icon={<Plus className="size-4" aria-hidden />}
            onClick={onIncrementar}
            className="w-full"
          >
            Adicionar
          </Button>
        )}
      </div>
    </Card>
  )
}

export function LancarPedido() {
  const barraca = useBarracaAtual()
  const { pendentes, online } = useSincronizacaoAtual()

  const [itens, setItens] = useState<Item[]>([])
  const [carregandoItens, setCarregandoItens] = useState(true)
  const [erroItens, setErroItens] = useState<string | null>(null)

  const [carrinho, setCarrinho] = useState<Carrinho>({})
  const [mesa, setMesa] = useState('')
  const [viagem, setViagem] = useState(false)
  const [observacao, setObservacao] = useState('')

  const [senha, setSenha] = useState<SenhaConfirmada | null>(null)

  const [mostrarModalMetodo, setMostrarModalMetodo] = useState(false)
  const [erroEnvio, setErroEnvio] = useState<string | null>(null)

  const enviandoRef = useRef(false)

  // cache local pode ser de antes desta migration e nao ter o campo ainda —
  // cai no mesmo default da coluna no banco, nunca bloqueia o envio por isso
  const metodosAtivos = barraca.metodos_pagamento_ativos ?? METODOS_PADRAO

  useEffect(() => {
    let cancelado = false
    setCarregandoItens(true)
    setErroItens(null)

    supabase
      .from('itens')
      .select('*')
      .eq('barraca_id', barraca.id)
      .eq('ativo', true)
      .order('ordem')
      .then(({ data, error }) => {
        if (cancelado) return
        if (error) {
          setErroItens(error.message)
          setCarregandoItens(false)
          return
        }
        setItens((data ?? []) as Item[])
        setCarregandoItens(false)
      })

    return () => {
      cancelado = true
    }
  }, [barraca.id])

  useEffect(() => {
    if (!senha?.provisoria || !senha.idFila) return

    return aoConcluirCriacaoPedido(senha.idFila, (resultado) => {
      setSenha({ valor: resultado.senha, provisoria: false })
    })
  }, [senha])

  const totalItens = useMemo(
    () => Object.values(carrinho).reduce((soma, quantidade) => soma + quantidade, 0),
    [carrinho],
  )

  const totalCentavos = useMemo(
    () =>
      Object.entries(carrinho).reduce((soma, [itemId, quantidade]) => {
        const item = itens.find((i) => i.id === itemId)
        if (!item || item.preco_centavos <= 0) return soma
        return soma + item.preco_centavos * quantidade
      }, 0),
    [carrinho, itens],
  )

  const itensSemPreco = useMemo(
    () =>
      Object.entries(carrinho).filter(([itemId, quantidade]) => {
        if (quantidade <= 0) return false
        const item = itens.find((i) => i.id === itemId)
        return item !== undefined && item.preco_centavos <= 0
      }).length,
    [carrinho, itens],
  )

  function incrementar(itemId: string) {
    setCarrinho((atual) => ({ ...atual, [itemId]: (atual[itemId] ?? 0) + 1 }))
  }

  function decrementar(itemId: string) {
    setCarrinho((atual) => {
      const quantidadeAtual = atual[itemId] ?? 0
      if (quantidadeAtual <= 1) {
        const copia = { ...atual }
        delete copia[itemId]
        return copia
      }
      return { ...atual, [itemId]: quantidadeAtual - 1 }
    })
  }

  function limparFormulario() {
    setCarrinho({})
    setMesa('')
    setViagem(false)
    setObservacao('')
  }

  function iniciarEnvio() {
    if (enviandoRef.current || totalItens === 0) return
    setErroEnvio(null)

    if (metodosAtivos.length === 0) {
      setErroEnvio('Configure ao menos um método de pagamento em Ajustes.')
      return
    }

    if (metodosAtivos.length === 1) {
      enviarComMetodo(metodosAtivos[0] as MetodoPagamento)
      return
    }

    setMostrarModalMetodo(true)
  }

  async function enviarComMetodo(metodo: MetodoPagamento) {
    if (enviandoRef.current) return
    enviandoRef.current = true
    setMostrarModalMetodo(false)

    const clientUuid = crypto.randomUUID()
    const itensPedido = Object.entries(carrinho)
      .filter(([, quantidade]) => quantidade > 0)
      .map(([itemId, quantidade]) => {
        const item = itens.find((i) => i.id === itemId)
        return {
          item_id: itemId,
          nome_item: item?.nome ?? '',
          quantidade,
          preco_centavos_unitario: item?.preco_centavos ?? 0,
        }
      })

    const operacao = await enfileirar('criar_pedido', {
      p_barraca_id: barraca.id,
      p_mesa: viagem ? null : mesa.trim() || null,
      p_viagem: viagem,
      p_observacao: observacao.trim() || null,
      p_client_uuid: clientUuid,
      p_itens: itensPedido,
      p_metodo_pagamento: metodo,
    })

    setSenha({ valor: proximoNumeroProvisorio(barraca.id), provisoria: true, idFila: operacao.id })
    limparFormulario()
    enviandoRef.current = false
  }

  // Confirmação pós-envio: sem mockup de referência nesta fase (só a tela de
  // seleção de itens tem). Linguagem visual emprestada da Chamada (overline
  // da marca, número herói), mas com o glow atmosférico normal — essa tela é
  // pro operador, não pro balcão, não precisa do contraste absoluto da Chamada.
  if (senha !== null) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
        <span className="text-xs font-semibold uppercase tracking-[0.08em] text-mesa-orange-500">
          {barraca.nome}
        </span>
        <span className="text-xs font-semibold uppercase tracking-[0.08em] text-mesa-text-secondary">
          Pedido enviado
        </span>
        <span
          className={`text-[96px] font-bold leading-[104px] tracking-tight ${
            senha.provisoria ? 'text-mesa-text-tertiary' : 'text-mesa-teal-700 dark:text-mesa-teal-400'
          }`}
        >
          {senha.valor}
        </span>

        {senha.provisoria ? (
          <span className="inline-flex items-center gap-2 rounded-mesa-full bg-mesa-neutral-100 px-4 py-2 dark:bg-mesa-neutral-800">
            <span
              className="size-2 animate-pulse rounded-mesa-full bg-mesa-neutral-400"
              aria-hidden
            />
            <span className="text-sm font-medium text-mesa-text-secondary">
              Provisória — confirmando pedido...
            </span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-2 rounded-mesa-full bg-mesa-teal-50 px-4 py-2 text-sm font-semibold text-mesa-teal-700 dark:bg-mesa-teal-500/15 dark:text-mesa-teal-400">
            <Check className="size-4 shrink-0" aria-hidden />
            Enviado para a cozinha
          </span>
        )}

        <Button
          size="xl"
          onClick={() => {
            limparFormulario()
            setSenha(null)
          }}
          className="mt-4 w-full max-w-xs"
        >
          Novo pedido
        </Button>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex items-start justify-between gap-3 px-6 pt-[calc(env(safe-area-inset-top)+20px)]">
        <h1 className="text-[32px] font-bold leading-[40px] text-mesa-teal-700 dark:text-mesa-teal-300">
          Lançar Pedido
        </h1>
        <div className="flex shrink-0 flex-col items-end gap-1.5 pt-1">
          <Badge variant={online ? 'success' : 'warning'} dot>
            {online ? 'Online' : 'Offline'}
          </Badge>
          {pendentes > 0 && (
            <Badge variant="neutral">
              {pendentes} pendente{pendentes === 1 ? '' : 's'}
            </Badge>
          )}
        </div>
      </div>

      {!online && (
        <p className="mx-6 mt-4 rounded-mesa-md border-l-[3px] border-mesa-orange-500 bg-mesa-orange-50 p-3 text-sm font-medium text-mesa-orange-700 dark:bg-mesa-orange-500/15 dark:text-mesa-orange-400">
          Sem conexão — os pedidos serão enviados quando a rede voltar
        </p>
      )}

      <div className="flex-1 overflow-y-auto px-6 pb-40 pt-5">
        <div className="flex items-stretch gap-3">
          <Input
            value={mesa}
            onChange={(e) => setMesa(e.target.value)}
            disabled={viagem}
            placeholder={viagem ? 'Viagem (sem mesa)' : 'Mesa (opcional)'}
            aria-label="Mesa"
            className="flex-1"
          />
          <div className="flex h-12 shrink-0 items-center rounded-mesa-sm border-[1.5px] border-mesa-border-default bg-mesa-surface px-4">
            <Toggle checked={viagem} onChange={setViagem} label="Viagem" />
          </div>
        </div>

        <Textarea
          value={observacao}
          onChange={(e) => setObservacao(e.target.value)}
          placeholder="Observação (opcional)"
          rows={2}
          className="mt-4"
        />

        <div className="mt-6 grid grid-cols-2 gap-3">
          {carregandoItens && (
            <p className="col-span-2 py-8 text-center text-sm text-mesa-text-secondary">
              Carregando cardápio...
            </p>
          )}

          {!carregandoItens && erroItens && (
            <p className="col-span-2 py-8 text-center text-sm text-mesa-error-500">
              Não foi possível carregar o cardápio.
            </p>
          )}

          {!carregandoItens && !erroItens && itens.length === 0 && (
            <p className="col-span-2 py-8 text-center text-sm text-mesa-text-secondary">
              Nenhum item cadastrado.
            </p>
          )}

          {!carregandoItens &&
            !erroItens &&
            itens.map((item) => (
              <CardItemCardapio
                key={item.id}
                item={item}
                quantidade={carrinho[item.id] ?? 0}
                onIncrementar={() => incrementar(item.id)}
                onDecrementar={() => decrementar(item.id)}
              />
            ))}
        </div>
      </div>

      {totalItens > 0 && (
        <div className="fixed inset-x-0 bottom-16 flex flex-col gap-2 px-4 pb-3">
          {itensSemPreco > 0 && (
            <p className="text-center text-xs font-medium text-mesa-text-secondary">
              {itensSemPreco === 1 ? '1 item sem preço' : `${itensSemPreco} itens sem preço`}
            </p>
          )}
          {erroEnvio && (
            <p className="text-center text-xs font-medium text-mesa-error-500">{erroEnvio}</p>
          )}

          <button
            type="button"
            onClick={iniciarEnvio}
            className="flex w-full items-center justify-between gap-3 rounded-mesa-2xl bg-mesa-teal-700 py-4 pl-5 pr-2 text-left text-white shadow-mesa-3 outline-none transition-transform active:scale-[0.99] dark:bg-mesa-teal-600"
          >
            <span>
              <span className="block text-sm text-white/80">
                {totalItens} {totalItens === 1 ? 'item selecionado' : 'itens selecionados'}
              </span>
              <span className="block text-2xl font-bold leading-tight">
                {formatarPrecoBR(totalCentavos)}
              </span>
            </span>
            {/* TODO(fase 4): esse botão hoje envia direto; virará porta para a
                tela Confirmar Pedido. Rótulo mantido honesto ("Enviar pedido")
                até essa tela existir, pra não sugerir uma revisão que ainda
                não acontece. */}
            <span className="flex shrink-0 items-center gap-1.5 rounded-mesa-full bg-mesa-teal-600 px-4 py-2.5 text-sm font-semibold dark:bg-mesa-teal-500">
              Enviar pedido
              <ArrowRight className="size-4 shrink-0" aria-hidden />
            </span>
          </button>

          <div className="flex justify-center">
            <Button variant="ghost" size="md" onClick={limparFormulario}>
              Limpar pedido
            </Button>
          </div>
        </div>
      )}

      {mostrarModalMetodo && (
        <ModalMetodoPagamento
          metodosAtivos={metodosAtivos}
          onCancelar={() => setMostrarModalMetodo(false)}
          onConfirmar={enviarComMetodo}
        />
      )}
    </div>
  )
}
