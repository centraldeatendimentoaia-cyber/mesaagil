import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Store } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useBarracasDoUsuario } from '../hooks/useBarracasDoUsuario'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { BottomSheet } from '../components/ui/BottomSheet'

function gerarSlug(nome: string): string {
  return nome
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // remove acentos
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function CartaoBarraca({ nome, logoUrl, onClick }: { nome: string; logoUrl: string | null; onClick: () => void }) {
  return (
    <Card interactive onClick={onClick} className="flex min-h-16 items-center gap-3 text-left">
      {logoUrl ? (
        <img src={logoUrl} alt="" className="size-11 shrink-0 rounded-mesa-full object-cover" />
      ) : (
        <span className="flex size-11 shrink-0 items-center justify-center rounded-mesa-full bg-mesa-teal-50 text-lg font-bold text-mesa-teal-700 dark:bg-mesa-teal-500/15 dark:text-mesa-teal-300">
          {nome.charAt(0).toUpperCase()}
        </span>
      )}
      <span className="text-base font-semibold text-mesa-text-primary">{nome}</span>
    </Card>
  )
}

function BottomSheetNovaBarraca({
  open,
  onClose,
  onCriada,
}: {
  open: boolean
  onClose: () => void
  onCriada: (slug: string) => void
}) {
  const [nome, setNome] = useState('')
  const [slug, setSlug] = useState('')
  const [slugEditadoAMao, setSlugEditadoAMao] = useState(false)
  const [criando, setCriando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  function aoMudarNome(valor: string) {
    setNome(valor)
    if (!slugEditadoAMao) setSlug(gerarSlug(valor))
  }

  function aoMudarSlug(valor: string) {
    setSlugEditadoAMao(true)
    setSlug(gerarSlug(valor))
  }

  function fechar() {
    setNome('')
    setSlug('')
    setSlugEditadoAMao(false)
    setErro(null)
    onClose()
  }

  async function criar(e: FormEvent) {
    e.preventDefault()
    if (!nome.trim() || !slug || criando) return

    setCriando(true)
    setErro(null)

    const { data, error } = await supabase.rpc('criar_barraca', {
      p_nome: nome.trim(),
      p_slug: slug,
    })

    setCriando(false)

    if (error) {
      setErro(error.message.includes('endereço') || error.message.includes('vazio')
        ? error.message
        : 'Não foi possível criar a barraca. Tente novamente.')
      return
    }

    const novoSlug = (data as { slug: string }).slug
    fechar()
    onCriada(novoSlug)
  }

  return (
    <BottomSheet open={open} onClose={fechar} aria-label="Criar nova barraca">
      <h2 className="text-lg font-semibold text-mesa-text-primary">Nova barraca</h2>
      <p className="mt-1 text-sm text-mesa-text-secondary">
        Cada barraca tem seu próprio cardápio, comandas e relatórios — nada se mistura entre elas.
      </p>

      <form onSubmit={criar} className="mt-4 flex flex-col gap-4">
        <Input
          label="Nome da barraca"
          autoFocus
          required
          value={nome}
          onChange={(e) => aoMudarNome(e.target.value)}
        />

        <Input
          label="Endereço"
          required
          value={slug}
          onChange={(e) => aoMudarSlug(e.target.value)}
          helpText={slug ? `mesaagil.pages.dev/${slug}` : 'só letras minúsculas, números e hífen'}
        />

        {erro && <p className="text-sm font-medium text-mesa-error-500">{erro}</p>}

        <Button type="submit" size="xl" loading={criando} disabled={!nome.trim() || !slug} className="w-full">
          Criar barraca
        </Button>
      </form>
    </BottomSheet>
  )
}

export function SelecionarBarraca() {
  const navigate = useNavigate()
  const { usuario, sair } = useAuth()
  const { barracas, carregando, recarregar } = useBarracasDoUsuario(usuario)
  const [criandoBarraca, setCriandoBarraca] = useState(false)

  async function aoCriarBarraca(slug: string) {
    // Espera recarregar terminar antes de navegar: o cache de barracas do
    // usuário (compartilhado com RotaProtegida) só passa a incluir a
    // barraca recém-criada depois que essa busca resolve. Navegar antes
    // fazia RotaProtegida checar acesso com a lista antiga e mostrar
    // "você não tem acesso a esta barraca" por engano.
    await recarregar()
    navigate(`/${slug}`)
  }

  if (carregando) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-mesa-bg-base">
        <p className="text-sm text-mesa-text-secondary">Carregando...</p>
      </div>
    )
  }

  if (barracas.length === 0) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-mesa-bg-base p-6 text-center">
        <span className="flex size-16 items-center justify-center rounded-mesa-full bg-mesa-teal-50 dark:bg-mesa-teal-500/15">
          <Store className="size-7 text-mesa-teal-700 dark:text-mesa-teal-300" aria-hidden />
        </span>
        <div>
          <h1 className="text-xl font-bold text-mesa-text-primary">Vamos criar sua barraca</h1>
          <p className="mt-1 text-sm text-mesa-text-secondary">
            Sua conta ainda não tem nenhuma barraca vinculada.
          </p>
        </div>
        <Button size="xl" onClick={() => setCriandoBarraca(true)} className="w-full max-w-xs">
          Criar minha primeira barraca
        </Button>
        <Button
          variant="ghost"
          size="md"
          onClick={async () => {
            await sair()
            navigate('/login')
          }}
        >
          Sair
        </Button>

        <BottomSheetNovaBarraca
          open={criandoBarraca}
          onClose={() => setCriandoBarraca(false)}
          onCriada={aoCriarBarraca}
        />
      </div>
    )
  }

  return (
    <div className="flex min-h-dvh flex-col bg-mesa-bg-base p-6">
      <h1 className="text-2xl font-bold text-mesa-text-primary">Qual barraca?</h1>

      <div className="mt-6 flex flex-col gap-3">
        {barracas.map(({ barraca }) => (
          <CartaoBarraca
            key={barraca.id}
            nome={barraca.nome}
            logoUrl={barraca.logo_url}
            onClick={() => navigate(`/${barraca.slug}`)}
          />
        ))}

        <Button
          variant="ghost"
          size="lg"
          icon={<Plus className="size-4" aria-hidden />}
          onClick={() => setCriandoBarraca(true)}
          className="w-full"
        >
          Nova barraca
        </Button>
      </div>

      <Button
        variant="ghost"
        size="md"
        onClick={async () => {
          await sair()
          navigate('/login')
        }}
        className="mt-auto self-center"
      >
        Sair
      </Button>

      <BottomSheetNovaBarraca
        open={criandoBarraca}
        onClose={() => setCriandoBarraca(false)}
        onCriada={aoCriarBarraca}
      />
    </div>
  )
}
