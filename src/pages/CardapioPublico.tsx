import { useEffect, useState } from 'react'
import { useParams } from 'react-router'
import { Image, Plus, UtensilsCrossed } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { formatarPrecoBR } from '../lib/preco'
import { Button } from '../components/ui/Button'
import { BottomSheet } from '../components/ui/BottomSheet'

type LinhaCardapioPublico = {
  barraca_nome: string
  barraca_logo_url: string | null
  item_id: string
  item_nome: string
  item_descricao: string | null
  item_foto_url: string | null
  item_preco_centavos: number
  categoria_nome: string | null
}

type Estado =
  | { status: 'carregando' }
  | { status: 'erro' }
  | { status: 'pronto'; linhas: LinhaCardapioPublico[] }

function CardItemPublico({ item }: { item: LinhaCardapioPublico }) {
  const [mostrarEmBreve, setMostrarEmBreve] = useState(false)

  return (
    <>
      <div className="flex gap-3 rounded-mesa-lg border border-mesa-border-subtle bg-mesa-surface p-3 shadow-mesa-1">
        <span className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-mesa-md bg-mesa-neutral-100 text-mesa-text-tertiary dark:bg-mesa-neutral-700">
          {item.item_foto_url ? (
            <img src={item.item_foto_url} alt="" className="size-full object-cover" />
          ) : (
            <Image className="size-5" aria-hidden />
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
            <span className="font-mesa-mono text-sm font-semibold text-mesa-text-primary">
              {item.item_preco_centavos > 0 ? formatarPrecoBR(item.item_preco_centavos) : 'Sob consulta'}
            </span>
            <Button
              variant="outline"
              size="sm"
              icon={<Plus className="size-4" aria-hidden />}
              onClick={() => setMostrarEmBreve(true)}
            >
              Adicionar
            </Button>
          </div>
        </div>
      </div>

      <BottomSheet
        open={mostrarEmBreve}
        onClose={() => setMostrarEmBreve(false)}
        aria-label="Pedido pelo cardápio em breve"
      >
        <h2 className="text-lg font-semibold text-mesa-text-primary">Em breve</h2>
        <p className="mt-1 text-sm text-mesa-text-secondary">
          Por enquanto este cardápio é só pra você dar uma olhada. Fale seu pedido com quem está no
          balcão — logo, logo você vai poder montar o pedido direto por aqui.
        </p>
        <Button variant="ghost" size="md" onClick={() => setMostrarEmBreve(false)} className="mt-6 w-full">
          Entendi
        </Button>
      </BottomSheet>
    </>
  )
}

export function CardapioPublico() {
  const { slug } = useParams<{ slug: string }>()
  const [estado, setEstado] = useState<Estado>(() =>
    slug ? { status: 'carregando' } : { status: 'erro' },
  )

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
        <UtensilsCrossed className="size-8 text-mesa-text-tertiary" aria-hidden />
        <p className="text-base font-semibold text-mesa-text-primary">Cardápio não encontrado</p>
        <p className="text-sm text-mesa-text-secondary">
          Confira se o link está certo ou pergunte pra barraca se o cardápio já está publicado.
        </p>
      </div>
    )
  }

  const { linhas } = estado
  const nomeBarraca = linhas[0].barraca_nome
  const logoUrl = linhas[0].barraca_logo_url

  const categorias: { nome: string; itens: LinhaCardapioPublico[] }[] = []
  for (const linha of linhas) {
    const nomeCategoria = linha.categoria_nome ?? 'Outros'
    const grupo = categorias.find((c) => c.nome === nomeCategoria)
    if (grupo) grupo.itens.push(linha)
    else categorias.push({ nome: nomeCategoria, itens: [linha] })
  }

  return (
    <div className="min-h-dvh bg-mesa-bg-base pb-12">
      <div className="flex flex-col items-center gap-3 px-6 pb-6 pt-[calc(env(safe-area-inset-top)+32px)] text-center">
        <span className="flex size-16 items-center justify-center overflow-hidden rounded-mesa-full bg-mesa-surface shadow-mesa-1">
          {logoUrl ? (
            <img src={logoUrl} alt="" className="size-full object-cover" />
          ) : (
            <UtensilsCrossed className="size-6 text-mesa-text-tertiary" aria-hidden />
          )}
        </span>
        <div>
          <h1 className="text-2xl font-bold leading-tight text-mesa-text-primary">{nomeBarraca}</h1>
          <p className="mt-0.5 text-sm text-mesa-text-secondary">Cardápio</p>
        </div>
      </div>

      <div className="flex flex-col gap-6 px-6">
        {categorias.map((categoria) => (
          <section key={categoria.nome}>
            <h2 className="mb-3 font-mesa-mono text-xs font-semibold uppercase tracking-wider text-mesa-text-secondary">
              {categoria.nome}
            </h2>
            <div className="flex flex-col gap-3">
              {categoria.itens.map((item) => (
                <CardItemPublico key={item.item_id} item={item} />
              ))}
            </div>
          </section>
        ))}
      </div>

      <p className="mt-8 text-center font-mesa-mono text-xs text-mesa-text-tertiary">
        Feito com MesaAgil
      </p>
    </div>
  )
}
