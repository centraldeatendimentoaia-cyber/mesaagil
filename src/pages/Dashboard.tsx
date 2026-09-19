import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ChefHat,
  ChevronDown,
  Clock,
  History,
  ListOrdered,
  LogOut,
  Moon,
  Settings,
  ShoppingBag,
  Sun,
  Volume2,
  type LucideIcon,
} from 'lucide-react'
import { useBarracaAtual, useSincronizacaoAtual } from '../layouts/contextoBarraca'
import { usePedidosAtual } from '../layouts/contextoPedidos'
import { classesBotaoIcone } from '../lib/estiloBotaoIcone'
import { useAuth } from '../hooks/useAuth'
import { useBarracasDoUsuario } from '../hooks/useBarracasDoUsuario'
import { useTheme } from '../hooks/useTheme'
import { formatarDataExtenso, turnoAtual } from '../lib/datas'
import { formatarPrecoBR } from '../lib/preco'
import { calcularTotalBruto } from '../lib/relatorio'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { BottomSheet } from '../components/ui/BottomSheet'

function formatarSenha(senha: number): string {
  return String(senha).padStart(3, '0')
}

function calcularEsperaMediaMinutos(emFila: { criado_em: string }[]): number | null {
  if (emFila.length === 0) return null
  const agora = Date.now()
  const somaMinutos = emFila.reduce(
    (soma, p) => soma + (agora - new Date(p.criado_em).getTime()) / 60000,
    0,
  )
  return Math.round(somaMinutos / emFila.length)
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
  const { usuario, sair } = useAuth()
  const { barracas: barracasDoUsuario } = useBarracasDoUsuario(usuario)
  const escuro = tema === 'escuro'
  const [confirmandoSaida, setConfirmandoSaida] = useState(false)
  const [mostrarMenuConta, setMostrarMenuConta] = useState(false)

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
  const turno = useMemo(() => turnoAtual(), [])

  const vendasHojeCount = useMemo(
    () => pedidos.filter((p) => p.status !== 'cancelado').length,
    [pedidos],
  )

  const esperaMediaMinutos = useMemo(
    () => calcularEsperaMediaMinutos(pedidos.filter((p) => p.status === 'a_fazer')),
    [pedidos],
  )

  return (
    <div className="flex min-h-dvh flex-col">
      <div className="flex items-start justify-between gap-3 px-6 pt-[calc(env(safe-area-inset-top)+20px)]">
        <div className="min-w-0">
          {barracasDoUsuario.length > 1 ? (
            <button
              type="button"
              onClick={() => navigate('/selecionar-barraca')}
              className="flex w-full min-w-0 min-h-11 items-center gap-1 text-left outline-none"
              aria-label={`Trocar de barraca (atual: ${barraca.nome})`}
            >
              <h1 className="min-w-0 truncate text-[28px] font-bold leading-[36px] text-mesa-text-primary">
                {barraca.nome}
              </h1>
              <ChevronDown className="size-5 shrink-0 text-mesa-text-secondary" aria-hidden />
            </button>
          ) : (
            <h1 className="text-[28px] font-bold leading-[36px] text-mesa-text-primary">
              Bem-vindo, {barraca.nome}
            </h1>
          )}
          <p className="mt-1 text-sm text-mesa-text-secondary">
            {dataFormatada} <span aria-hidden>·</span> {turno}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2 pt-1">
          <Badge variant={online ? 'success' : 'warning'} dot>
            {online ? 'Online' : 'Offline'}
          </Badge>
          <button
            type="button"
            onClick={alternarTema}
            aria-label={escuro ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
            className={classesBotaoIcone()}
          >
            {escuro ? <Sun className="size-5" aria-hidden /> : <Moon className="size-5" aria-hidden />}
          </button>
          <Link
            to={`/${barraca.slug}/ajustes`}
            aria-label="Ajustes"
            className={classesBotaoIcone()}
          >
            <Settings className="size-5" aria-hidden />
          </Link>
          <button
            type="button"
            onClick={() => setMostrarMenuConta(true)}
            aria-label="Conta"
            className={classesBotaoIcone('danger')}
          >
            <LogOut className="size-5" aria-hidden />
          </button>
        </div>
      </div>

      <div className="px-6 pt-6">
        <p className="text-base font-semibold text-mesa-text-primary">O que você vai fazer agora?</p>
        <p className="mt-0.5 text-sm text-mesa-text-secondary">
          Selecione o módulo de trabalho ou acompanhe o ritmo da loja
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 px-6 pb-4 pt-4">
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
          subtitulo={`${vendasHojeCount} venda${vendasHojeCount === 1 ? '' : 's'} · ${formatarPrecoBR(totalHojeCentavos)} hoje`}
          onClick={() => navigate(`/${barraca.slug}/historico`)}
        />
      </div>

      <div className="px-6 pb-4">
        <Card className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm font-semibold text-mesa-text-primary">
              <span className="size-2 rounded-mesa-full bg-mesa-teal-500" aria-hidden />
              Ritmo da Operação
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-mesa-md bg-mesa-surface-alt p-3">
              <p className="flex items-center gap-1 font-mesa-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-mesa-text-tertiary">
                <Clock className="size-3" aria-hidden />
                Espera média
              </p>
              <p className="mt-1 font-mesa-mono text-lg font-bold text-mesa-text-primary">
                {esperaMediaMinutos === null ? '—' : `${esperaMediaMinutos} min`}
              </p>
            </div>
            <div className="rounded-mesa-md bg-mesa-surface-alt p-3">
              <p className="flex items-center gap-1 font-mesa-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-mesa-text-tertiary">
                <ListOrdered className="size-3" aria-hidden />
                Em fila
              </p>
              <p className="mt-1 font-mesa-mono text-lg font-bold text-mesa-text-primary">
                {contagemAFazer} comanda{contagemAFazer === 1 ? '' : 's'}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <BottomSheet open={mostrarMenuConta} onClose={() => setMostrarMenuConta(false)} aria-label="Conta">
        <h2 className="text-lg font-semibold text-mesa-text-primary">Conta</h2>
        {usuario?.email && (
          <p className="mt-1 truncate text-sm text-mesa-text-secondary">{usuario.email}</p>
        )}
        <div className="mt-6 flex flex-col gap-1">
          <Button
            variant="ghost"
            size="md"
            className="w-full"
            onClick={() => {
              setMostrarMenuConta(false)
              navigate('/selecionar-barraca')
            }}
          >
            Trocar ou adicionar barraca
          </Button>
          <Button
            variant="textDanger"
            size="md"
            className="w-full"
            onClick={() => {
              setMostrarMenuConta(false)
              setConfirmandoSaida(true)
            }}
          >
            Sair da conta
          </Button>
        </div>
      </BottomSheet>

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
            icon={<LogOut className="size-5" aria-hidden />}
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
    </div>
  )
}
