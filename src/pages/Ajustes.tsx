// TODO(produto): seção "Custo do dia" foi ao mockup mas ainda não
// é feature. Se virar requisito, adicionar entre Pagamento e
// Aparência.

import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Check, ChevronLeft, Moon, Plus, Sun, Trash, TriangleAlert } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useBarracaAtual } from '../layouts/contextoBarraca'
import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../hooks/useTheme'
import { centavosParaReais, reaisParaCentavos } from '../lib/preco'
import { ativarFaceId, desativarFaceId, faceIdAtivado, faceIdSuportado } from '../lib/faceId'
import { METODOS_DISPONIVEIS } from '../lib/metodoPagamento'
import { BPS_MAX, bpsParaPercentual, percentualParaBps } from '../lib/taxas'
import { ModalTrocarSenha } from '../components/ModalTrocarSenha'
import { GateSenhaAdmin } from '../components/GateSenhaAdmin'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Chip } from '../components/ui/Chip'
import { Input } from '../components/ui/Input'
import { Toggle } from '../components/ui/Toggle'
import { BottomSheet } from '../components/ui/BottomSheet'
import type { Barraca, Categoria, Item } from '../types/database'

function textoPrecoInicial(centavos: number): string {
  return centavos > 0 ? centavosParaReais(centavos).toFixed(2).replace('.', ',') : ''
}

function RotuloSecao({ children }: { children: ReactNode }) {
  return (
    <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.08em] text-mesa-text-secondary">
      {children}
    </h2>
  )
}

function AvisoInline({ children }: { children: ReactNode }) {
  return (
    <p className="mb-3 flex items-start gap-2 rounded-mesa-md border-l-[3px] border-mesa-orange-500 bg-mesa-orange-50 p-3 text-sm font-medium text-mesa-orange-700 dark:bg-mesa-orange-500/15 dark:text-mesa-orange-400">
      <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
      {children}
    </p>
  )
}

/**
 * Glifo de 30×30 como no mockup, mas com alvo de toque de 44×44 —
 * a regra dos 44px do CLAUDE.md vale mesmo quando o ícone é pequeno.
 */
function BotaoApagar({ onClick, rotulo }: { onClick: () => void; rotulo: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={rotulo}
      className="group flex size-11 shrink-0 items-center justify-center outline-none"
    >
      <span className="flex size-[30px] items-center justify-center rounded-mesa-sm text-mesa-text-secondary transition-colors duration-[var(--mesa-duration-micro)] group-hover:bg-mesa-error-50 group-hover:text-mesa-error-700 group-focus-visible:[box-shadow:var(--mesa-focus-ring-danger)] dark:group-hover:bg-mesa-error-500/15 dark:group-hover:text-mesa-error-500">
        <Trash className="size-4" aria-hidden />
      </span>
    </button>
  )
}

function IndicadorSalvo({ salvo }: { salvo: boolean }) {
  return (
    <span className="flex h-4 items-center gap-1 text-xs font-medium text-mesa-teal-600">
      {salvo && (
        <>
          <Check className="size-3.5" aria-hidden />
          Salvo
        </>
      )}
    </span>
  )
}

function InputPreco({ item }: { item: Item }) {
  const [texto, setTexto] = useState(() => textoPrecoInicial(item.preco_centavos))
  const [salvo, setSalvo] = useState(false)
  const debounceRef = useRef<number | null>(null)
  const salvoTimerRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (debounceRef.current !== null) window.clearTimeout(debounceRef.current)
      if (salvoTimerRef.current !== null) window.clearTimeout(salvoTimerRef.current)
    }
  }, [])

  function aoMudar(valor: string) {
    const limpo = valor.replace(/[^\d.,]/g, '')
    setTexto(limpo)

    if (debounceRef.current !== null) window.clearTimeout(debounceRef.current)
    debounceRef.current = window.setTimeout(async () => {
      const centavos = reaisParaCentavos(limpo)
      const { error } = await supabase
        .from('itens')
        .update({ preco_centavos: centavos })
        .eq('id', item.id)

      if (!error) {
        setSalvo(true)
        if (salvoTimerRef.current !== null) window.clearTimeout(salvoTimerRef.current)
        salvoTimerRef.current = window.setTimeout(() => setSalvo(false), 1000)
      }
    }, 500)
  }

  return (
    <div className="flex shrink-0 items-center gap-1">
      <Input
        type="currency"
        size="sm"
        inputMode="decimal"
        value={texto}
        onChange={(e) => aoMudar(e.target.value)}
        placeholder="0,00"
        aria-label={`Preço de ${item.nome}`}
        className="w-28"
      />
      <span className="flex w-4 shrink-0 items-center justify-center">
        {salvo && <Check className="size-4 text-mesa-teal-600" aria-label="Salvo" />}
      </span>
    </div>
  )
}

function SecaoCardapio({ barracaId }: { barracaId: string }) {
  const [itens, setItens] = useState<Item[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const [criandoItem, setCriandoItem] = useState(false)
  const [novoNome, setNovoNome] = useState('')
  const [novoPreco, setNovoPreco] = useState('')
  const [salvandoNovo, setSalvandoNovo] = useState(false)

  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [nomeEdicao, setNomeEdicao] = useState('')

  const [itemParaExcluir, setItemParaExcluir] = useState<Item | null>(null)
  const [nomeExclusao, setNomeExclusao] = useState('')
  const [excluindo, setExcluindo] = useState(false)
  const [aviso, setAviso] = useState<string | null>(null)

  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [novaCategoriaId, setNovaCategoriaId] = useState<string | null>(null)
  const [gerenciandoCategorias, setGerenciandoCategorias] = useState(false)
  const [itemEscolhendoCategoria, setItemEscolhendoCategoria] = useState<Item | 'novo' | null>(
    null,
  )
  const [novaCategoriaNome, setNovaCategoriaNome] = useState('')
  const [criandoCategoria, setCriandoCategoria] = useState(false)
  const [editandoCategoriaId, setEditandoCategoriaId] = useState<string | null>(null)
  const [nomeEdicaoCategoria, setNomeEdicaoCategoria] = useState('')

  const arrastandoIdRef = useRef<string | null>(null)

  useEffect(() => {
    let cancelado = false

    supabase
      .from('itens')
      .select('*')
      .eq('barraca_id', barracaId)
      .order('ordem')
      .then(({ data, error }) => {
        if (cancelado) return
        if (error) setErro(error.message)
        else setItens((data ?? []) as Item[])
        setCarregando(false)
      })

    return () => {
      cancelado = true
    }
  }, [barracaId])

  useEffect(() => {
    let cancelado = false

    supabase
      .from('categorias')
      .select('*')
      .eq('barraca_id', barracaId)
      .order('ordem')
      .then(({ data, error }) => {
        if (cancelado) return
        if (!error) setCategorias((data ?? []) as Categoria[])
      })

    return () => {
      cancelado = true
    }
  }, [barracaId])

  function nomeCategoria(categoriaId: string | null): string {
    if (!categoriaId) return 'Sem categoria'
    return categorias.find((c) => c.id === categoriaId)?.nome ?? 'Sem categoria'
  }

  async function criarCategoria() {
    const nome = novaCategoriaNome.trim()
    if (!nome) return

    setCriandoCategoria(true)
    const proximaOrdem =
      categorias.length > 0 ? Math.max(...categorias.map((c) => c.ordem)) + 1 : 1

    const { data, error } = await supabase
      .from('categorias')
      .insert({ barraca_id: barracaId, nome, ordem: proximaOrdem })
      .select()
      .single()

    setCriandoCategoria(false)

    if (!error && data) {
      setCategorias((atual) => [...atual, data as Categoria])
      setNovaCategoriaNome('')
    }
  }

  function iniciarEdicaoCategoria(categoria: Categoria) {
    setEditandoCategoriaId(categoria.id)
    setNomeEdicaoCategoria(categoria.nome)
  }

  async function salvarEdicaoCategoria(categoria: Categoria) {
    const nome = nomeEdicaoCategoria.trim()
    setEditandoCategoriaId(null)
    if (!nome || nome === categoria.nome) return

    setCategorias((atual) => atual.map((c) => (c.id === categoria.id ? { ...c, nome } : c)))
    const { error } = await supabase.from('categorias').update({ nome }).eq('id', categoria.id)

    if (error) {
      setCategorias((atual) =>
        atual.map((c) => (c.id === categoria.id ? { ...c, nome: categoria.nome } : c)),
      )
    }
  }

  function moverCategoria(id: string, direcao: -1 | 1) {
    const indice = categorias.findIndex((c) => c.id === id)
    const novoIndice = indice + direcao
    if (indice === -1 || novoIndice < 0 || novoIndice >= categorias.length) return

    const copia = [...categorias]
    const [categoria] = copia.splice(indice, 1)
    copia.splice(novoIndice, 0, categoria)

    const comOrdem = copia.map((c, i) => ({ ...c, ordem: i + 1 }))
    setCategorias(comOrdem)
    Promise.all(
      comOrdem.map((c, i) => supabase.from('categorias').update({ ordem: i + 1 }).eq('id', c.id)),
    )
  }

  async function excluirCategoria(categoria: Categoria) {
    setCategorias((atual) => atual.filter((c) => c.id !== categoria.id))
    setItens((atual) =>
      atual.map((i) => (i.categoria_id === categoria.id ? { ...i, categoria_id: null } : i)),
    )
    await supabase.from('categorias').delete().eq('id', categoria.id)
  }

  async function escolherCategoria(categoriaId: string | null) {
    const alvo = itemEscolhendoCategoria
    setItemEscolhendoCategoria(null)
    if (!alvo) return

    if (alvo === 'novo') {
      setNovaCategoriaId(categoriaId)
      return
    }

    setItens((atual) =>
      atual.map((i) => (i.id === alvo.id ? { ...i, categoria_id: categoriaId } : i)),
    )
    const { error } = await supabase
      .from('itens')
      .update({ categoria_id: categoriaId })
      .eq('id', alvo.id)

    if (error) {
      setItens((atual) =>
        atual.map((i) => (i.id === alvo.id ? { ...i, categoria_id: alvo.categoria_id } : i)),
      )
    }
  }

  async function persistirOrdem(lista: Item[]) {
    await Promise.all(
      lista.map((item, indice) =>
        supabase.from('itens').update({ ordem: indice + 1 }).eq('id', item.id),
      ),
    )
  }

  function moverItem(id: string, direcao: -1 | 1) {
    const indice = itens.findIndex((i) => i.id === id)
    const novoIndice = indice + direcao
    if (indice === -1 || novoIndice < 0 || novoIndice >= itens.length) return

    const copia = [...itens]
    const [item] = copia.splice(indice, 1)
    copia.splice(novoIndice, 0, item)

    const comOrdem = copia.map((it, i) => ({ ...it, ordem: i + 1 }))
    setItens(comOrdem)
    persistirOrdem(comOrdem)
  }

  function aoSoltar(idAlvo: string) {
    const idOrigem = arrastandoIdRef.current
    arrastandoIdRef.current = null
    if (!idOrigem || idOrigem === idAlvo) return

    const indiceOrigem = itens.findIndex((i) => i.id === idOrigem)
    const indiceAlvo = itens.findIndex((i) => i.id === idAlvo)
    if (indiceOrigem === -1 || indiceAlvo === -1) return

    const copia = [...itens]
    const [movido] = copia.splice(indiceOrigem, 1)
    copia.splice(indiceAlvo, 0, movido)

    const comOrdem = copia.map((item, i) => ({ ...item, ordem: i + 1 }))
    setItens(comOrdem)
    persistirOrdem(comOrdem)
  }

  async function criarItem() {
    const nome = novoNome.trim()
    if (!nome) return

    setSalvandoNovo(true)
    const proximaOrdem = itens.length > 0 ? Math.max(...itens.map((i) => i.ordem)) + 1 : 1
    const precoCentavos = reaisParaCentavos(novoPreco)

    const { data, error } = await supabase
      .from('itens')
      .insert({
        barraca_id: barracaId,
        nome,
        ativo: true,
        ordem: proximaOrdem,
        preco_centavos: precoCentavos,
        categoria_id: novaCategoriaId,
      })
      .select()
      .single()

    setSalvandoNovo(false)

    if (!error && data) {
      setItens((atual) => [...atual, data as Item])
      setNovoNome('')
      setNovoPreco('')
      setNovaCategoriaId(null)
      setCriandoItem(false)
    }
  }

  function iniciarEdicao(item: Item) {
    setEditandoId(item.id)
    setNomeEdicao(item.nome)
  }

  async function salvarEdicao(item: Item) {
    const nome = nomeEdicao.trim()
    setEditandoId(null)
    if (!nome || nome === item.nome) return

    setItens((atual) => atual.map((i) => (i.id === item.id ? { ...i, nome } : i)))
    const { error } = await supabase.from('itens').update({ nome }).eq('id', item.id)

    if (error) {
      setItens((atual) => atual.map((i) => (i.id === item.id ? { ...i, nome: item.nome } : i)))
    }
  }

  async function alternarAtivo(item: Item) {
    const novoAtivo = !item.ativo
    setItens((atual) => atual.map((i) => (i.id === item.id ? { ...i, ativo: novoAtivo } : i)))
    const { error } = await supabase.from('itens').update({ ativo: novoAtivo }).eq('id', item.id)

    if (error) {
      setItens((atual) => atual.map((i) => (i.id === item.id ? { ...i, ativo: item.ativo } : i)))
    }
  }

  function pedirExclusao(item: Item) {
    setItemParaExcluir(item)
    setNomeExclusao(item.nome)
  }

  // Comportamento preservado: tenta DELETE de verdade e só cai para
  // ativo:false quando o banco recusa (item já usado em pedidos).
  async function confirmarExclusao() {
    if (!itemParaExcluir) return
    const item = itemParaExcluir
    setExcluindo(true)

    const { error } = await supabase.from('itens').delete().eq('id', item.id)

    if (!error) {
      setItens((atual) => atual.filter((i) => i.id !== item.id))
      setExcluindo(false)
      setItemParaExcluir(null)
      return
    }

    const { error: erroDesativar } = await supabase
      .from('itens')
      .update({ ativo: false })
      .eq('id', item.id)

    if (!erroDesativar) {
      setItens((atual) => atual.map((i) => (i.id === item.id ? { ...i, ativo: false } : i)))
      setAviso(`"${item.nome}" já foi usado em pedidos e não pode ser excluído — foi desativado.`)
    }

    setExcluindo(false)
    setItemParaExcluir(null)
  }

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <RotuloSecao>Cardápio</RotuloSecao>
        <button
          type="button"
          onClick={() => setGerenciandoCategorias(true)}
          className="min-h-11 text-sm font-medium text-mesa-teal-700 dark:text-mesa-teal-300"
        >
          Categorias
        </button>
      </div>
      <Card>
        {carregando && <p className="text-sm text-mesa-text-secondary">Carregando...</p>}
        {!carregando && erro && (
          <p className="text-sm text-mesa-error-500">Não foi possível carregar os itens.</p>
        )}

        {!carregando && !erro && (
          <>
            {aviso && <AvisoInline>{aviso}</AvisoInline>}

            {itens.length === 0 && (
              <p className="text-sm text-mesa-text-secondary">Nenhum item cadastrado.</p>
            )}

            <ul className="divide-y divide-mesa-border-subtle">
              {itens.map((item, indice) => (
                <li
                  key={item.id}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => aoSoltar(item.id)}
                  className={`flex flex-col gap-1 py-2 ${item.ativo ? '' : 'opacity-50'}`}
                >
                  <div className="flex items-center gap-2">
                    {editandoId === item.id ? (
                      <Input
                        autoFocus
                        size="sm"
                        value={nomeEdicao}
                        onChange={(e) => setNomeEdicao(e.target.value)}
                        onBlur={() => salvarEdicao(item)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') e.currentTarget.blur()
                          if (e.key === 'Escape') setEditandoId(null)
                        }}
                        aria-label={`Nome do item ${item.nome}`}
                        className="min-w-0 flex-1"
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => iniciarEdicao(item)}
                        className="min-h-11 min-w-0 flex-1 truncate text-left text-base text-mesa-text-primary"
                      >
                        {item.nome}
                      </button>
                    )}

                    <InputPreco item={item} />
                    <BotaoApagar onClick={() => pedirExclusao(item)} rotulo={`Apagar ${item.nome}`} />
                  </div>

                  <div className="flex flex-wrap items-center gap-1 pl-1">
                    <Chip
                      variant="plain"
                      onClick={() => setItemEscolhendoCategoria(item)}
                      aria-label={`Categoria de ${item.nome}: ${nomeCategoria(item.categoria_id)}`}
                    >
                      {nomeCategoria(item.categoria_id)}
                    </Chip>
                    <span
                      draggable
                      onDragStart={() => {
                        arrastandoIdRef.current = item.id
                      }}
                      aria-hidden
                      className="hidden cursor-grab select-none px-1 text-base text-mesa-text-tertiary sm:inline"
                    >
                      ⠿
                    </span>
                    <button
                      type="button"
                      onClick={() => moverItem(item.id, -1)}
                      disabled={indice === 0}
                      aria-label={`Mover ${item.nome} para cima`}
                      className="flex h-11 w-8 items-center justify-center text-sm text-mesa-text-tertiary disabled:opacity-30"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      onClick={() => moverItem(item.id, 1)}
                      disabled={indice === itens.length - 1}
                      aria-label={`Mover ${item.nome} para baixo`}
                      className="flex h-11 w-8 items-center justify-center text-sm text-mesa-text-tertiary disabled:opacity-30"
                    >
                      ▼
                    </button>

                    <span className="ml-auto flex items-center gap-2">
                      <span className="text-xs text-mesa-text-secondary">
                        {item.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                      <Toggle
                        checked={item.ativo}
                        onChange={() => alternarAtivo(item)}
                        aria-label={`${item.nome} ativo no cardápio`}
                      />
                    </span>
                  </div>
                </li>
              ))}
            </ul>

            {criandoItem ? (
              <div className="mt-3 flex flex-wrap items-end gap-2">
                <Input
                  autoFocus
                  size="sm"
                  value={novoNome}
                  onChange={(e) => setNovoNome(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && criarItem()}
                  placeholder="Nome do item"
                  aria-label="Nome do novo item"
                  className="min-w-0 flex-1"
                />
                <Input
                  type="currency"
                  size="sm"
                  inputMode="decimal"
                  value={novoPreco}
                  onChange={(e) => setNovoPreco(e.target.value.replace(/[^\d.,]/g, ''))}
                  onKeyDown={(e) => e.key === 'Enter' && criarItem()}
                  placeholder="0,00"
                  aria-label="Preço do novo item"
                  className="w-28"
                />
                <Chip
                  variant="plain"
                  onClick={() => setItemEscolhendoCategoria('novo')}
                  aria-label={`Categoria do novo item: ${nomeCategoria(novaCategoriaId)}`}
                >
                  {nomeCategoria(novaCategoriaId)}
                </Chip>
                <Button
                  size="sm"
                  onClick={criarItem}
                  disabled={!novoNome.trim()}
                  loading={salvandoNovo}
                >
                  Adicionar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setCriandoItem(false)
                    setNovoNome('')
                    setNovoPreco('')
                    setNovaCategoriaId(null)
                  }}
                >
                  Cancelar
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="md"
                icon={<Plus className="size-4" aria-hidden />}
                onClick={() => setCriandoItem(true)}
                className="mt-2 w-full"
              >
                Novo item
              </Button>
            )}
          </>
        )}
      </Card>

      <BottomSheet
        open={itemParaExcluir !== null}
        onClose={() => setItemParaExcluir(null)}
        aria-label="Confirmar exclusão de item"
      >
        <h2 className="text-lg font-semibold text-mesa-text-primary">Apagar {nomeExclusao}?</h2>
        <p className="mt-1 text-sm text-mesa-text-secondary">Essa ação não pode ser desfeita.</p>
        <div className="mt-6 flex flex-col gap-2">
          <Button
            variant="destructive"
            size="xl"
            loading={excluindo}
            onClick={confirmarExclusao}
            className="w-full"
          >
            Apagar
          </Button>
          <Button
            variant="ghost"
            size="md"
            onClick={() => setItemParaExcluir(null)}
            className="w-full"
          >
            Cancelar
          </Button>
        </div>
      </BottomSheet>

      <BottomSheet
        open={itemEscolhendoCategoria !== null}
        onClose={() => setItemEscolhendoCategoria(null)}
        aria-label="Selecionar categoria"
      >
        <h2 className="text-lg font-semibold text-mesa-text-primary">Categoria</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          <Chip
            variant={
              (itemEscolhendoCategoria === 'novo'
                ? novaCategoriaId
                : (itemEscolhendoCategoria?.categoria_id ?? null)) === null
                ? 'teal'
                : 'plain'
            }
            checked={
              (itemEscolhendoCategoria === 'novo'
                ? novaCategoriaId
                : (itemEscolhendoCategoria?.categoria_id ?? null)) === null
            }
            onClick={() => escolherCategoria(null)}
          >
            Sem categoria
          </Chip>
          {categorias.map((categoria) => {
            const atual =
              itemEscolhendoCategoria === 'novo'
                ? novaCategoriaId
                : (itemEscolhendoCategoria?.categoria_id ?? null)
            return (
              <Chip
                key={categoria.id}
                variant={atual === categoria.id ? 'teal' : 'plain'}
                checked={atual === categoria.id}
                onClick={() => escolherCategoria(categoria.id)}
              >
                {categoria.nome}
              </Chip>
            )
          })}
        </div>
        {categorias.length === 0 && (
          <p className="mt-3 text-sm text-mesa-text-secondary">
            Nenhuma categoria ainda. Toque em "Categorias" no topo do cardápio pra criar uma.
          </p>
        )}
        <Button
          variant="ghost"
          size="md"
          onClick={() => setItemEscolhendoCategoria(null)}
          className="mt-6 w-full"
        >
          Fechar
        </Button>
      </BottomSheet>

      <BottomSheet
        open={gerenciandoCategorias}
        onClose={() => setGerenciandoCategorias(false)}
        aria-label="Gerenciar categorias"
      >
        <h2 className="text-lg font-semibold text-mesa-text-primary">Categorias</h2>
        <p className="mt-1 text-sm text-mesa-text-secondary">
          Agrupe os itens do cardápio pra facilitar quem lança o pedido.
        </p>

        {categorias.length === 0 && (
          <p className="mt-4 text-sm text-mesa-text-secondary">Nenhuma categoria cadastrada.</p>
        )}

        <ul className="mt-3 divide-y divide-mesa-border-subtle">
          {categorias.map((categoria, indice) => (
            <li key={categoria.id} className="flex items-center gap-2 py-2">
              {editandoCategoriaId === categoria.id ? (
                <Input
                  autoFocus
                  size="sm"
                  value={nomeEdicaoCategoria}
                  onChange={(e) => setNomeEdicaoCategoria(e.target.value)}
                  onBlur={() => salvarEdicaoCategoria(categoria)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') e.currentTarget.blur()
                    if (e.key === 'Escape') setEditandoCategoriaId(null)
                  }}
                  aria-label={`Nome da categoria ${categoria.nome}`}
                  className="min-w-0 flex-1"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => iniciarEdicaoCategoria(categoria)}
                  className="min-h-11 min-w-0 flex-1 truncate text-left text-base text-mesa-text-primary"
                >
                  {categoria.nome}
                </button>
              )}

              <button
                type="button"
                onClick={() => moverCategoria(categoria.id, -1)}
                disabled={indice === 0}
                aria-label={`Mover ${categoria.nome} para cima`}
                className="flex h-11 w-8 shrink-0 items-center justify-center text-sm text-mesa-text-tertiary disabled:opacity-30"
              >
                ▲
              </button>
              <button
                type="button"
                onClick={() => moverCategoria(categoria.id, 1)}
                disabled={indice === categorias.length - 1}
                aria-label={`Mover ${categoria.nome} para baixo`}
                className="flex h-11 w-8 shrink-0 items-center justify-center text-sm text-mesa-text-tertiary disabled:opacity-30"
              >
                ▼
              </button>
              <BotaoApagar onClick={() => excluirCategoria(categoria)} rotulo={`Apagar ${categoria.nome}`} />
            </li>
          ))}
        </ul>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Input
            size="sm"
            value={novaCategoriaNome}
            onChange={(e) => setNovaCategoriaNome(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && criarCategoria()}
            placeholder="Nova categoria"
            aria-label="Nome da nova categoria"
            className="min-w-0 flex-1"
          />
          <Button
            size="sm"
            onClick={criarCategoria}
            disabled={!novaCategoriaNome.trim()}
            loading={criandoCategoria}
          >
            Adicionar
          </Button>
        </div>

        <Button
          variant="ghost"
          size="md"
          onClick={() => setGerenciandoCategorias(false)}
          className="mt-6 w-full"
        >
          Fechar
        </Button>
      </BottomSheet>
    </section>
  )
}

function SecaoFaixas({ barraca }: { barraca: Barraca }) {
  const [verdeAte, setVerdeAte] = useState(String(barraca.verde_ate))
  const [amareloAte, setAmareloAte] = useState(String(barraca.amarelo_ate))
  const [salvando, setSalvando] = useState(false)
  const [salvo, setSalvo] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const verdeNum = Number(verdeAte)
  const amareloNum = Number(amareloAte)
  const valido =
    Number.isFinite(verdeNum) &&
    Number.isFinite(amareloNum) &&
    verdeNum > 0 &&
    amareloNum > verdeNum

  async function salvar() {
    if (!valido) return
    setSalvando(true)
    setErro(null)

    const { error } = await supabase
      .from('barracas')
      .update({ verde_ate: verdeNum, amarelo_ate: amareloNum })
      .eq('id', barraca.id)

    setSalvando(false)

    if (error) {
      setErro('Não foi possível salvar. Tente novamente.')
      return
    }

    setSalvo(true)
    window.setTimeout(() => setSalvo(false), 3000)
  }

  return (
    <section>
      <RotuloSecao>Faixas de tempo</RotuloSecao>
      <Card>
        <ul className="divide-y divide-mesa-border-subtle">
          <li className="flex items-center justify-between gap-3 py-2">
            <span className="flex items-center gap-2 text-base text-mesa-text-primary">
              <span className="size-2.5 shrink-0 rounded-mesa-full bg-mesa-kanban-green" aria-hidden />
              Verde até
            </span>
            <span className="flex items-center gap-1.5">
              <Input
                type="number"
                size="sm"
                min={1}
                value={verdeAte}
                onChange={(e) => setVerdeAte(e.target.value)}
                aria-label="Verde até (minutos)"
                className="w-20"
              />
              <span className="text-sm text-mesa-text-secondary">min</span>
            </span>
          </li>

          <li className="flex items-center justify-between gap-3 py-2">
            <span className="flex items-center gap-2 text-base text-mesa-text-primary">
              <span
                className="size-2.5 shrink-0 rounded-mesa-full bg-mesa-kanban-yellow"
                aria-hidden
              />
              Amarelo até
            </span>
            <span className="flex items-center gap-1.5">
              <Input
                type="number"
                size="sm"
                min={1}
                value={amareloAte}
                onChange={(e) => setAmareloAte(e.target.value)}
                aria-label="Amarelo até (minutos)"
                className="w-20"
              />
              <span className="text-sm text-mesa-text-secondary">min</span>
            </span>
          </li>

          <li className="flex items-center justify-between gap-3 py-3">
            <span className="flex items-center gap-2 text-base text-mesa-text-primary">
              <span className="size-2.5 shrink-0 rounded-mesa-full bg-mesa-kanban-red" aria-hidden />
              Acima disso
            </span>
            <span className="text-sm font-semibold text-mesa-kanban-red">vermelho</span>
          </li>
        </ul>

        {!valido && (
          <p className="mt-3 text-sm text-mesa-error-500">
            O tempo do amarelo precisa ser maior que o do verde.
          </p>
        )}
        {erro && <p className="mt-3 text-sm text-mesa-error-500">{erro}</p>}

        <div className="mt-3 flex items-center gap-3">
          <Button size="sm" onClick={salvar} disabled={!valido} loading={salvando}>
            {salvo ? 'Salvo!' : 'Salvar faixas'}
          </Button>
        </div>
      </Card>
      <p className="mt-2 text-xs text-mesa-text-secondary">
        Definem quando o card muda de cor na Cozinha
      </p>
    </section>
  )
}

function SecaoPagamento({ barraca }: { barraca: Barraca }) {
  const [ativos, setAtivos] = useState<string[]>(
    barraca.metodos_pagamento_ativos ?? ['dinheiro', 'debito', 'credito', 'pix'],
  )
  const [aviso, setAviso] = useState<string | null>(null)
  const [salvoMetodos, setSalvoMetodos] = useState(false)
  const debounceRef = useRef<number | null>(null)
  const salvoTimerRef = useRef<number | null>(null)

  const [textoDebito, setTextoDebito] = useState(() =>
    bpsParaPercentual(barraca.taxa_debito_bps ?? null),
  )
  const [textoCredito, setTextoCredito] = useState(() =>
    bpsParaPercentual(barraca.taxa_credito_bps ?? null),
  )
  const [invalidoDebito, setInvalidoDebito] = useState(false)
  const [invalidoCredito, setInvalidoCredito] = useState(false)
  const [salvoDebito, setSalvoDebito] = useState(false)
  const [salvoCredito, setSalvoCredito] = useState(false)

  const debounceDebitoRef = useRef<number | null>(null)
  const debounceCreditoRef = useRef<number | null>(null)
  const salvoDebitoTimerRef = useRef<number | null>(null)
  const salvoCreditoTimerRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (debounceRef.current !== null) window.clearTimeout(debounceRef.current)
      if (salvoTimerRef.current !== null) window.clearTimeout(salvoTimerRef.current)
      if (debounceDebitoRef.current !== null) window.clearTimeout(debounceDebitoRef.current)
      if (debounceCreditoRef.current !== null) window.clearTimeout(debounceCreditoRef.current)
      if (salvoDebitoTimerRef.current !== null) window.clearTimeout(salvoDebitoTimerRef.current)
      if (salvoCreditoTimerRef.current !== null) window.clearTimeout(salvoCreditoTimerRef.current)
    }
  }, [])

  // useBarraca mostra a barraca em cache (localStorage) na hora e só troca
  // pela versão de verdade quando a busca de rede volta — sem isso, um
  // metodos_pagamento_ativos desatualizado do cache fica preso na tela até
  // um segundo reload. Só resincroniza se não há edição pendente (debounce
  // em voo), pra não sobrescrever um toque recém-feito pelo dono.
  useEffect(() => {
    if (debounceRef.current === null && barraca.metodos_pagamento_ativos) {
      setAtivos(barraca.metodos_pagamento_ativos)
    }
  }, [barraca.metodos_pagamento_ativos])

  // mesmo problema de cache desatualizado: resincroniza quando o valor de
  // verdade chega, mas nunca durante uma edição em voo (debounce pendente).
  useEffect(() => {
    if (debounceDebitoRef.current === null) {
      setTextoDebito(bpsParaPercentual(barraca.taxa_debito_bps ?? null))
      setInvalidoDebito(false)
    }
  }, [barraca.taxa_debito_bps])

  useEffect(() => {
    if (debounceCreditoRef.current === null) {
      setTextoCredito(bpsParaPercentual(barraca.taxa_credito_bps ?? null))
      setInvalidoCredito(false)
    }
  }, [barraca.taxa_credito_bps])

  function persistir(lista: string[]) {
    if (debounceRef.current !== null) window.clearTimeout(debounceRef.current)
    debounceRef.current = window.setTimeout(async () => {
      const { error } = await supabase
        .from('barracas')
        .update({ metodos_pagamento_ativos: lista })
        .eq('id', barraca.id)

      if (!error) {
        setSalvoMetodos(true)
        if (salvoTimerRef.current !== null) window.clearTimeout(salvoTimerRef.current)
        salvoTimerRef.current = window.setTimeout(() => setSalvoMetodos(false), 1000)
      }
    }, 500)
  }

  function alternar(chave: string) {
    const estaAtivo = ativos.includes(chave)

    if (estaAtivo && ativos.length === 1) {
      setAviso('Você precisa ter ao menos um método de pagamento ativo.')
      return
    }

    setAviso(null)
    const novaLista = estaAtivo ? ativos.filter((m) => m !== chave) : [...ativos, chave]
    setAtivos(novaLista)
    persistir(novaLista)
  }

  function aoMudarDebito(valor: string) {
    setTextoDebito(valor)

    const temCaracterInvalido = /[^\d.,\s-]/.test(valor)
    const bps = percentualParaBps(valor)
    const foraDoIntervalo = bps !== null && (bps < 0 || bps > BPS_MAX)
    const invalido = temCaracterInvalido || foraDoIntervalo
    setInvalidoDebito(invalido)

    if (debounceDebitoRef.current !== null) {
      window.clearTimeout(debounceDebitoRef.current)
      debounceDebitoRef.current = null
    }
    if (invalido) return

    debounceDebitoRef.current = window.setTimeout(async () => {
      debounceDebitoRef.current = null
      const { error } = await supabase
        .from('barracas')
        .update({ taxa_debito_bps: bps })
        .eq('id', barraca.id)

      if (!error) {
        setSalvoDebito(true)
        if (salvoDebitoTimerRef.current !== null) window.clearTimeout(salvoDebitoTimerRef.current)
        salvoDebitoTimerRef.current = window.setTimeout(() => setSalvoDebito(false), 1000)
      }
    }, 500)
  }

  function aoMudarCredito(valor: string) {
    setTextoCredito(valor)

    const temCaracterInvalido = /[^\d.,\s-]/.test(valor)
    const bps = percentualParaBps(valor)
    const foraDoIntervalo = bps !== null && (bps < 0 || bps > BPS_MAX)
    const invalido = temCaracterInvalido || foraDoIntervalo
    setInvalidoCredito(invalido)

    if (debounceCreditoRef.current !== null) {
      window.clearTimeout(debounceCreditoRef.current)
      debounceCreditoRef.current = null
    }
    if (invalido) return

    debounceCreditoRef.current = window.setTimeout(async () => {
      debounceCreditoRef.current = null
      const { error } = await supabase
        .from('barracas')
        .update({ taxa_credito_bps: bps })
        .eq('id', barraca.id)

      if (!error) {
        setSalvoCredito(true)
        if (salvoCreditoTimerRef.current !== null) window.clearTimeout(salvoCreditoTimerRef.current)
        salvoCreditoTimerRef.current = window.setTimeout(() => setSalvoCredito(false), 1000)
      }
    }, 500)
  }

  return (
    <section>
      <RotuloSecao>Pagamento e taxas</RotuloSecao>
      <Card>
        {aviso && <AvisoInline>{aviso}</AvisoInline>}

        <ul className="divide-y divide-mesa-border-subtle">
          {METODOS_DISPONIVEIS.map((metodo) => (
            <li key={metodo.chave}>
              <label
                htmlFor={`metodo-${metodo.chave}`}
                className="flex cursor-pointer items-center justify-between gap-3 py-3"
              >
                <span className="text-base text-mesa-text-primary">
                  {metodo.icone} {metodo.label}
                </span>
                <Toggle
                  id={`metodo-${metodo.chave}`}
                  checked={ativos.includes(metodo.chave)}
                  onChange={() => alternar(metodo.chave)}
                  aria-label={metodo.label}
                />
              </label>
            </li>
          ))}
        </ul>

        <IndicadorSalvo salvo={salvoMetodos} />

        <p className="mt-4 text-sm text-mesa-text-secondary">
          Taxas que a maquininha cobra por transação. Usadas só para estimar o valor líquido no
          relatório.
        </p>

        <div className="mt-3 flex flex-wrap gap-4">
          <div className="min-w-[140px] flex-1">
            <span className="text-sm text-mesa-text-secondary">Débito</span>
            <Input
              type="percentage"
              size="sm"
              inputMode="decimal"
              value={textoDebito}
              onChange={(e) => aoMudarDebito(e.target.value)}
              placeholder="0,00"
              aria-label="Taxa de débito"
              error={invalidoDebito ? 'Entre 0 e 50%' : undefined}
              className="mt-1"
            />
            <IndicadorSalvo salvo={salvoDebito} />
          </div>

          <div className="min-w-[140px] flex-1">
            <span className="text-sm text-mesa-text-secondary">Crédito</span>
            <Input
              type="percentage"
              size="sm"
              inputMode="decimal"
              value={textoCredito}
              onChange={(e) => aoMudarCredito(e.target.value)}
              placeholder="0,00"
              aria-label="Taxa de crédito"
              error={invalidoCredito ? 'Entre 0 e 50%' : undefined}
              className="mt-1"
            />
            <IndicadorSalvo salvo={salvoCredito} />
          </div>
        </div>
      </Card>
    </section>
  )
}

function SecaoAparencia() {
  const { tema, alternarTema } = useTheme()
  const escuro = tema === 'escuro'

  return (
    <section>
      <RotuloSecao>Aparência</RotuloSecao>
      <Card>
        <div className="flex items-center justify-between gap-3">
          <span className="text-base text-mesa-text-primary">Tema</span>
          <button
            type="button"
            onClick={alternarTema}
            aria-label={escuro ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
            className="flex size-11 items-center justify-center rounded-mesa-full bg-mesa-neutral-100 text-mesa-text-primary outline-none transition-colors duration-[var(--mesa-duration-micro)] focus-visible:[box-shadow:var(--mesa-focus-ring-primary)] dark:bg-mesa-neutral-700"
          >
            {escuro ? <Sun className="size-5" aria-hidden /> : <Moon className="size-5" aria-hidden />}
          </button>
        </div>
      </Card>
    </section>
  )
}

function Rodape() {
  const navigate = useNavigate()
  const { usuario, sair } = useAuth()
  const [mostrarModal, setMostrarModal] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [confirmandoSaida, setConfirmandoSaida] = useState(false)

  const [suportaFaceId, setSuportaFaceId] = useState(false)
  const [faceIdLigado, setFaceIdLigado] = useState(() => faceIdAtivado())
  const [processandoFaceId, setProcessandoFaceId] = useState(false)
  const [erroFaceId, setErroFaceId] = useState<string | null>(null)

  const email = usuario?.email ?? null

  useEffect(() => {
    let cancelado = false
    faceIdSuportado().then((suportado) => {
      if (!cancelado) setSuportaFaceId(suportado)
    })
    return () => {
      cancelado = true
    }
  }, [])

  function aoTrocarComSucesso() {
    setMostrarModal(false)
    setSucesso(true)
    window.setTimeout(() => setSucesso(false), 3000)
  }

  async function alternarFaceId() {
    setErroFaceId(null)

    if (faceIdLigado) {
      desativarFaceId()
      setFaceIdLigado(false)
      return
    }

    if (!usuario?.email) return

    setProcessandoFaceId(true)
    try {
      await ativarFaceId({ id: usuario.id, email: usuario.email })
      setFaceIdLigado(true)
    } catch {
      setErroFaceId('Não foi possível ativar o Face ID neste aparelho. Tente de novo.')
    }
    setProcessandoFaceId(false)
  }

  return (
    <section className="flex flex-col gap-1">
      {suportaFaceId && (
        <>
          <Button
            variant="ghost"
            size="md"
            onClick={alternarFaceId}
            loading={processandoFaceId}
            className="w-full"
          >
            {faceIdLigado ? 'Desativar Face ID neste aparelho' : 'Ativar Face ID neste aparelho'}
          </Button>
          {erroFaceId && (
            <p className="text-center text-sm font-medium text-mesa-error-500">{erroFaceId}</p>
          )}
        </>
      )}

      <Button variant="ghost" size="md" onClick={() => setMostrarModal(true)} className="w-full">
        Trocar senha
      </Button>

      {sucesso && (
        <p className="text-center text-sm font-medium text-mesa-teal-600">
          Senha alterada com sucesso
        </p>
      )}

      <Button
        variant="textDanger"
        size="md"
        onClick={() => setConfirmandoSaida(true)}
        className="w-full"
      >
        Sair
      </Button>

      {mostrarModal && email && (
        <ModalTrocarSenha
          email={email}
          onFechar={() => setMostrarModal(false)}
          onSucesso={aoTrocarComSucesso}
        />
      )}

      <BottomSheet
        open={confirmandoSaida}
        onClose={() => setConfirmandoSaida(false)}
        aria-label="Confirmar saída"
      >
        <h2 className="text-lg font-semibold text-mesa-text-primary">Você quer mesmo sair?</h2>
        <p className="mt-1 text-sm text-mesa-text-secondary">
          Vai precisar entrar com e-mail e senha de novo.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <Button
            variant="destructive"
            size="xl"
            className="w-full"
            onClick={async () => {
              await sair()
              navigate('/login')
            }}
          >
            Sair
          </Button>
          <Button
            variant="ghost"
            size="md"
            className="w-full"
            onClick={() => setConfirmandoSaida(false)}
          >
            Cancelar
          </Button>
        </div>
      </BottomSheet>
    </section>
  )
}

export function Ajustes() {
  const barraca = useBarracaAtual()

  return (
    <GateSenhaAdmin key={barraca.id} barracaId={barraca.id} slug={barraca.slug}>
      <div className="min-h-dvh">
        <div className="sticky top-0 z-[var(--mesa-z-sticky)] bg-[var(--mesa-color-surface-blur)] px-6 py-5 [backdrop-filter:blur(var(--mesa-surface-blur-strength))]">
          <Link
            to={`/${barraca.slug}`}
            aria-label="Voltar para o início"
            className="inline-flex items-center gap-2 text-mesa-teal-700 dark:text-mesa-teal-300"
          >
            <ChevronLeft className="size-7 shrink-0" aria-hidden />
            <h1 className="text-[32px] font-bold leading-[40px]">Ajustes</h1>
          </Link>
        </div>

        <div className="flex flex-col gap-8 px-6 pb-28 pt-2">
          <SecaoCardapio barracaId={barraca.id} />
          <SecaoFaixas barraca={barraca} />
          <SecaoPagamento barraca={barraca} />
          <SecaoAparencia />
          <Rodape />
        </div>
      </div>
    </GateSenhaAdmin>
  )
}
