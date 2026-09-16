import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChefHat, History, Moon, Settings, ShoppingBag, Sun, Volume2, type LucideIcon } from 'lucide-react'
import { useBarracaAtual, useSincronizacaoAtual } from '../layouts/contextoBarraca'
import { usePedidosAtual } from '../layouts/contextoPedidos'
import { useTheme } from '../hooks/useTheme'
import { formatarDataExtenso } from '../lib/datas'
import { formatarPrecoBR } from '../lib/preco'
import { calcularTotalBruto } from '../lib/relatorio'
import { Badge } from '../components/ui/Badge'
import { Card } from '../components/ui/Card'

function formatarSenha(senha: number): string {
  return String(senha).padStart(3, '0')
}

function IconeCard({ icone: Icone }: { icone: LucideIcon }) {
  return (
    <span className="flex size-11 items-center justify-center rounded-mesa-md bg-mesa-teal-50 text-mesa-teal-700 dark:bg-mesa-teal-500/15 dark:text-mesa-teal-400">
      <Icone className="size-5" aria-hidden />
    </span>
  )
}

function CardDashboard({
  icone,
  titulo,
  subtitulo,
  badge,
  onClick,
}: {
  icone: LucideIcon
  titulo: string
  subtitulo: string
  badge?: number
  onClick: () => void
}) {
  return (
    <Card interactive onClick={onClick} className="relative flex flex-col items-start gap-3">
      <IconeCard icone={icone} />
      {!!badge && (
        <span
          aria-hidden
          className="absolute right-3 top-3 flex h-6 min-w-6 items-center justify-center rounded-mesa-full bg-mesa-orange-500 px-1.5 text-xs font-bold leading-none text-white"
        >
          {badge > 9 ? '9+' : badge}
        </span>
      )}
      <div>
        <p className="text-lg font-bold text-mesa-text-primary">{titulo}</p>
        <p className="mt-0.5 text-sm text-mesa-text-secondary">{subtitulo}</p>
      </div>
    </Card>
  )
}

export function Dashboard() {
  const barraca = useBarracaAtual()
  const navigate = useNavigate()
  const { online } = useSincronizacaoAtual()
  const { pedidos, contagemAFazer } = usePedidosAtual()
  const { tema, alternarTema } = useTheme()
  const escuro = tema === 'escuro'

  // Mesmas fontes já assinadas em tempo real por LayoutBarraca (nenhuma
  // busca nova): contagemAFazer já vem pronta do contexto, a última senha
  // chamada é a mesma derivação client-side que TelaChamada já faz, e o
  // total do dia usa calcularTotalBruto sobre os pedidos do dia que
  // useRealtimePedidos já carrega inteiros (todos os status, não só os
  // ativos) — três métricas "de graça", sem nenhum fetch extra na tela.
  const ultimaChamada = useMemo(
    () =>
      pedidos
        .filter((p) => p.status === 'pronto')
        .sort((a, b) => {
          const tempoA = a.pronto_em ? new Date(a.pronto_em).getTime() : 0
          const tempoB = b.pronto_em ? new Date(b.pronto_em).getTime() : 0
          return tempoB - tempoA
        })[0] ?? null,
    [pedidos],
  )

  const totalHojeCentavos = useMemo(() => calcularTotalBruto(pedidos), [pedidos])
  const dataFormatada = useMemo(() => formatarDataExtenso(new Date()), [])

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex items-start justify-between gap-3 px-6 pt-[calc(env(safe-area-inset-top)+20px)]">
        <div className="min-w-0">
          <h1 className="text-[28px] font-bold leading-[36px] text-mesa-text-primary">
            Bem-vindo, {barraca.nome}
          </h1>
          <p className="mt-1 text-sm text-mesa-text-secondary">{dataFormatada}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2 pt-1">
          <Badge variant={online ? 'success' : 'warning'} dot>
            {online ? 'Online' : 'Offline'}
          </Badge>
          <button
            type="button"
            onClick={alternarTema}
            aria-label={escuro ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
            className="flex size-11 items-center justify-center rounded-mesa-full bg-mesa-surface text-mesa-text-primary shadow-mesa-1 outline-none"
          >
            {escuro ? <Sun className="size-5" aria-hidden /> : <Moon className="size-5" aria-hidden />}
          </button>
          <Link
            to={`/${barraca.slug}/ajustes`}
            aria-label="Ajustes"
            className="flex size-11 items-center justify-center rounded-mesa-full bg-mesa-surface text-mesa-text-primary shadow-mesa-1 outline-none"
          >
            <Settings className="size-5" aria-hidden />
          </Link>
        </div>
      </div>

      <p className="px-6 pt-6 text-base text-mesa-text-secondary">O que você vai fazer agora?</p>

      <div className="grid grid-cols-2 gap-3 px-6 pb-10 pt-4">
        <CardDashboard
          icone={ShoppingBag}
          titulo="Caixa"
          subtitulo="Lançar pedidos"
          onClick={() => navigate(`/${barraca.slug}/lancar`)}
        />
        <CardDashboard
          icone={ChefHat}
          titulo="Cozinha"
          subtitulo={`${contagemAFazer} pedido${contagemAFazer === 1 ? '' : 's'} em preparo`}
          badge={contagemAFazer}
          onClick={() => navigate(`/${barraca.slug}/cozinha`)}
        />
        <CardDashboard
          icone={Volume2}
          titulo="Chamada"
          subtitulo={
            ultimaChamada ? `Última: senha ${formatarSenha(ultimaChamada.senha)}` : 'Nenhuma senha ainda'
          }
          onClick={() => navigate(`/${barraca.slug}/chamada`)}
        />
        <CardDashboard
          icone={History}
          titulo="Histórico"
          subtitulo={`${formatarPrecoBR(totalHojeCentavos)} hoje`}
          onClick={() => navigate(`/${barraca.slug}/historico`)}
        />
      </div>
    </div>
  )
}
