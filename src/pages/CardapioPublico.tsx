import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router'
import { supabase } from '../lib/supabase'
import { formatarPrecoBR } from '../lib/preco'
import { Button } from '../components/ui/Button'
import { BottomSheet } from '../components/ui/BottomSheet'
import { Chip } from '../components/ui/Chip'
import { Icone } from '../components/ui/Icone'
import { Input } from '../components/ui/Input'

type LinhaCardapioPublico = {
  barraca_nome: string
  barraca_logo_url: string | null
  item_id: string
  item_nome: string
  item_descricao: string | null
  item_foto_url: string | null
  item_preco_centavos: number
  categoria_nome: string | null
  pedidos_30d: number
}

type Estado =
  | { status: 'carregando' }
  | { status: 'erro' }
  | { status: 'pronto'; linhas: LinhaCardapioPublico[] }

const MAXIMO_MAIS_PEDIDOS = 8

function BottomSheetEmBreve({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <BottomSheet open={open} onClose={onClose} aria-label="Pedido pelo cardápio em breve">
      <h2 className="text-lg font-semibold text-mesa-text-primary">Em breve</h2>
      <p className="mt-1 text-sm text-mesa-text-secondary">
        Por enquanto este cardápio é só pra você dar uma olhada. Fale seu pedido com quem está no
        balcão — logo, logo você vai poder montar o pedido direto por aqui.
      </p>
      <Button variant="ghost" size="md" onClick={onClose} className="mt-6 w-full">
        Entendi
      </Button>
    </BottomSheet>
  )
}

function CardItemPublico({
  item,
  posicaoPopular,
}: {
  item: LinhaCardapioPublico
  posicaoPopular: number | null
}) {
  const [mostrarEmBreve, setMostrarEmBreve] = useState(false)

  return (
    <>
      <div className="relative flex gap-3 rounded-mesa-lg border border-mesa-border-subtle bg-mesa-surface p-3 shadow-mesa-1">
        <span className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-mesa-md bg-mesa-neutral-100 text-mesa-text-tertiary dark:bg-mesa-neutral-700">
          {item.item_foto_url ? (
            <img src={item.item_foto_url} alt="" className="size-full object-cover" />
          ) : (
            <Icone nome="image" size={20} />
          )}
          {posicaoPopular !== null && (
            <span className="absolute left-0.5 top-0.5 flex items-center gap-0.5 whitespace-nowrap rounded-mesa-full bg-mesa-orange-500 px-1.5 py-0.5 text-[9px] font-bold text-mesa-neutral-900 shadow-mesa-1">
              <Icone nome="star" size={8} preenchido />
              {posicaoPopular === 0 ? 'Top 1' : 'Popular'}
            </span>
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-base font-semibold text-mesa-text-primary">{item.item_nome}</p>
          {item.item_descricao && (
            <p className="mt-0.5 line-clamp-2 text-xs text-mesa-text-secondary">
              {item.item_descricao}
            </p>
          )}
          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="font-mesa-display text-sm font-semibold text-mesa-text-primary">
              {item.item_preco_centavos > 0 ? formatarPrecoBR(item.item_preco_centavos) : 'Sob consulta'}
            </span>
            <Button
              variant="outline"
              size="sm"
              icon={<Icone nome="add" size={16} />}
              onClick={() => setMostrarEmBreve(true)}
            >
              Adicionar
            </Button>
          </div>
        </div>
      </div>

      <BottomSheetEmBreve open={mostrarEmBreve} onClose={() => setMostrarEmBreve(false)} />
    </>
  )
}

function CardDestaque({ item }: { item: LinhaCardapioPublico }) {
  const [mostrarEmBreve, setMostrarEmBreve] = useState(false)

  return (
    <>
      <div className="overflow-hidden rounded-mesa-lg border border-mesa-border-subtle bg-mesa-surface shadow-mesa-2">
        <div className="relative aspect-[16/10] w-full bg-mesa-neutral-100 dark:bg-mesa-neutral-700">
          {item.item_foto_url ? (
            <img src={item.item_foto_url} alt="" className="size-full object-cover" />
          ) : (
            <span className="flex size-full items-center justify-center text-mesa-text-tertiary">
              <Icone nome="image" size={32} />
            </span>
          )}
          <span className="absolute left-3 top-3 flex items-center gap-1 whitespace-nowrap rounded-mesa-full bg-mesa-orange-500 px-2.5 py-1 text-xs font-bold text-mesa-neutral-900 shadow-mesa-1">
            <Icone nome="trophy" size={14} preenchido />
            Mais pedido do cardápio
          </span>
        </div>
        <div className="p-4">
          <p className="text-lg font-bold text-mesa-text-primary">{item.item_nome}</p>
          {item.item_descricao && (
            <p className="mt-1 text-sm text-mesa-text-secondary">{item.item_descricao}</p>
          )}
          <div className="mt-3 flex items-center justify-between gap-2">
            <span className="font-mesa-display text-xl font-bold text-mesa-text-primary">
              {item.item_preco_centavos > 0 ? formatarPrecoBR(item.item_preco_centavos) : 'Sob consulta'}
            </span>
            <Button
              variant="confirm"
              size="md"
              icon={<Icone nome="add" size={16} />}
              onClick={() => setMostrarEmBreve(true)}
            >
              Adicionar
            </Button>
          </div>
        </div>
      </div>

      <BottomSheetEmBreve open={mostrarEmBreve} onClose={() => setMostrarEmBreve(false)} />
    </>
  )
}

export function CardapioPublico() {
  const { slug } = useParams<{ slug: string }>()
  const [estado, setEstado] = useState<Estado>(() =>
    slug ? { status: 'carregando' } : { status: 'erro' },
  )
  const [busca, setBusca] = useState('')
  const [filtroAtivo, setFiltroAtivo] = useState<string | null>(null)

  useEffect(() => {
    if (!slug) return

    let cancelado = false
    supabase
      .rpc('cardapio_publico', { p_slug: slug })
      .then(({ data, error }) => {
        if (cancelado) return
        if (error || !data || (data as LinhaCardapioPublico[]).length === 0) {
          setEstado({ status: 'erro' })
          return
        }
        setEstado({ status: 'pronto', linhas: data as LinhaCardapioPublico[] })
      })

    return () => {
      cancelado = true
    }
  }, [slug])

  const linhas = useMemo(() => (estado.status === 'pronto' ? estado.linhas : []), [estado])

  const categorias = useMemo(() => {
    const grupos: { nome: string; itens: LinhaCardapioPublico[] }[] = []
    for (const linha of linhas) {
      const nomeCategoria = linha.categoria_nome ?? 'Outros'
      const grupo = grupos.find((c) => c.nome === nomeCategoria)
      if (grupo) grupo.itens.push(linha)
      else grupos.push({ nome: nomeCategoria, itens: [linha] })
    }
    return grupos
  }, [linhas])

  const itensMaisPedidos = useMemo(
    () =>
      linhas
        .filter((l) => l.pedidos_30d > 0)
        .sort((a, b) => b.pedidos_30d - a.pedidos_30d)
        .slice(0, MAXIMO_MAIS_PEDIDOS),
    [linhas],
  )

  // Mesmo padrão de Lançar Pedido: prioriza "Mais Pedidos" quando existe
  // histórico, senão cai na primeira categoria — computado direto do dado,
  // sem sincronizar em efeito.
  const filtroEfetivo =
    filtroAtivo ?? (itensMaisPedidos.length > 0 ? 'mais-pedidos' : (categorias[0]?.nome ?? null))

  const itensDoFiltro =
    filtroEfetivo === 'todos'
      ? linhas
      : filtroEfetivo === 'mais-pedidos'
        ? itensMaisPedidos
        : (categorias.find((c) => c.nome === filtroEfetivo)?.itens ?? [])

  const itemDestaque = itensMaisPedidos[0] ?? null

  const buscaNormalizada = busca.trim().toLowerCase()
  const itensExibidos = buscaNormalizada
    ? itensDoFiltro.filter(
        (i) =>
          i.item_nome.toLowerCase().includes(buscaNormalizada) ||
          (i.item_descricao ?? '').toLowerCase().includes(buscaNormalizada),
      )
    : // O item destaque já aparece no card grande acima — tira ele da lista
      // pra não repetir o mesmo prato duas vezes na tela.
      itensDoFiltro.filter((i) => i.item_id !== itemDestaque?.item_id)

  if (estado.status === 'carregando') {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-mesa-bg-base">
        <p className="text-mesa-text-secondary">Carregando cardápio...</p>
      </div>
    )
  }

  if (estado.status === 'erro') {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-2 bg-mesa-bg-base p-6 text-center">
        <Icone nome="restaurant" size={32} className="text-mesa-text-tertiary" />
        <p className="text-base font-semibold text-mesa-text-primary">Cardápio não encontrado</p>
        <p className="text-sm text-mesa-text-secondary">
          Confira se o link está certo ou pergunte pra barraca se o cardápio já está publicado.
        </p>
      </div>
    )
  }

  const nomeBarraca = linhas[0].barraca_nome
  const logoUrl = linhas[0].barraca_logo_url

  return (
    <div className="min-h-dvh bg-mesa-bg-base pb-12">
      <div className="flex flex-col items-center gap-3 px-6 pb-5 pt-[calc(env(safe-area-inset-top)+32px)] text-center">
        <span className="flex size-16 items-center justify-center overflow-hidden rounded-mesa-full bg-mesa-surface shadow-mesa-1">
          {logoUrl ? (
            <img src={logoUrl} alt="" className="size-full object-cover" />
          ) : (
            <Icone nome="restaurant" size={24} className="text-mesa-text-tertiary" />
          )}
        </span>
        <div>
          <h1 className="text-2xl font-bold leading-tight text-mesa-text-primary">{nomeBarraca}</h1>
          <p className="mt-0.5 text-sm text-mesa-text-secondary">
            Dá uma olhada no cardápio antes de pedir no balcão
          </p>
        </div>
      </div>

      {itemDestaque && !busca.trim() && (
        <div className="mb-5 px-6">
          <CardDestaque item={itemDestaque} />
        </div>
      )}

      <div className="px-6">
        <Input
          type="search"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          onClear={() => setBusca('')}
          placeholder="Buscar item do cardápio"
          aria-label="Buscar item do cardápio"
          icon={<Icone nome="search" size={16} />}
        />
      </div>

      <div className="mt-3 flex gap-2 overflow-x-auto px-6 pb-1">
        <Chip
          variant={filtroEfetivo === 'todos' ? 'teal' : 'plain'}
          checked={filtroEfetivo === 'todos'}
          onClick={() => setFiltroAtivo('todos')}
        >
          Todos
        </Chip>
        {itensMaisPedidos.length > 0 && (
          <Chip
            variant={filtroEfetivo === 'mais-pedidos' ? 'teal' : 'plain'}
            checked={filtroEfetivo === 'mais-pedidos'}
            onClick={() => setFiltroAtivo('mais-pedidos')}
          >
            <Icone nome="star" size={14} /> Mais Pedidos
          </Chip>
        )}
        {categorias.map((categoria) => (
          <Chip
            key={categoria.nome}
            variant={filtroEfetivo === categoria.nome ? 'teal' : 'plain'}
            checked={filtroEfetivo === categoria.nome}
            onClick={() => setFiltroAtivo(categoria.nome)}
          >
            {categoria.nome} · {categoria.itens.length}
          </Chip>
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-3 px-6">
        {itensExibidos.length === 0 ? (
          <p className="py-8 text-center text-sm text-mesa-text-secondary">
            Nenhum item encontrado.
          </p>
        ) : (
          itensExibidos.map((item) => {
            // Mesmo padrão de Lançar Pedido: o selo aparece em qualquer
            // categoria/filtro em que o item esteja, não só na aba "Mais
            // Pedidos" — é isso que ajuda o cliente a se direcionar.
            const indicePopular = itensMaisPedidos.indexOf(item)
            return (
              <CardItemPublico
                key={item.item_id}
                item={item}
                posicaoPopular={indicePopular === -1 ? null : indicePopular}
              />
            )
          })
        )}
      </div>

      <p className="mt-8 text-center text-xs text-mesa-text-tertiary">
        Feito com Sai aê
      </p>
    </div>
  )
}
