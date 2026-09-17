import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Check } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { centavosParaReais, formatarPrecoBR, reaisParaCentavos } from '../lib/preco'
import type { IntervaloData } from '../lib/relatorio'
import { Input } from './ui/Input'
import type { Barraca, CustoDiario } from '../types/database'

function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div className="mt-5 border-t border-mesa-border-subtle pt-4">
      <h3 className="text-xs font-bold uppercase tracking-wide text-mesa-text-secondary">{titulo}</h3>
      {children}
    </div>
  )
}

function textoPrecoInicial(centavos: number): string {
  return centavos > 0 ? centavosParaReais(centavos).toFixed(2).replace('.', ',') : ''
}

function diasNoIntervalo(intervalo: IntervaloData): number {
  const [anoI, mesI, diaI] = intervalo.inicio.split('-').map(Number)
  const [anoF, mesF, diaF] = intervalo.fim.split('-').map(Number)
  return (
    Math.round(
      (new Date(anoF, mesF - 1, diaF).getTime() - new Date(anoI, mesI - 1, diaI).getTime()) / 86400000,
    ) + 1
  )
}

/** Campo de custo do dia (editável) — só faz sentido pra período de um dia
 * só, então recebe `key={intervalo.inicio}` do chamador pra remontar (e
 * resincronizar o texto inicial) toda vez que o dia muda. */
function CampoCustoDoDia({
  valorInicial,
  onSalvar,
}: {
  valorInicial: number
  onSalvar: (centavos: number) => void
}) {
  const [texto, setTexto] = useState(() => textoPrecoInicial(valorInicial))
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
    debounceRef.current = window.setTimeout(() => {
      onSalvar(reaisParaCentavos(limpo))
      setSalvo(true)
      if (salvoTimerRef.current !== null) window.clearTimeout(salvoTimerRef.current)
      salvoTimerRef.current = window.setTimeout(() => setSalvo(false), 1000)
    }, 500)
  }

  return (
    <div className="mt-2 flex items-center gap-2">
      <Input
        type="currency"
        size="sm"
        inputMode="decimal"
        value={texto}
        onChange={(e) => aoMudar(e.target.value)}
        placeholder="0,00"
        aria-label="Custo do dia"
        className="w-32"
      />
      <span className="text-sm text-mesa-text-secondary">custo do dia (gás, ingredientes...)</span>
      <span className="flex w-4 shrink-0 items-center justify-center">
        {salvo && <Check className="size-4 text-mesa-teal-600" aria-label="Salvo" />}
      </span>
    </div>
  )
}

/** Custo é um número único lançado à mão por dia — não é controle de
 * estoque, só o suficiente pra comparar contra a receita e mostrar lucro
 * líquido. Editável quando o período é um dia só; em períodos maiores só
 * soma o que já foi lançado dia a dia (lançar retroativo pra vários dias de
 * uma vez fica pra outra hora). */
export function SecaoCustoLucro({
  barraca,
  intervalo,
  receitaLiquidaCentavos,
}: {
  barraca: Barraca
  intervalo: IntervaloData
  receitaLiquidaCentavos: number
}) {
  const [custos, setCustos] = useState<CustoDiario[]>([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    let cancelado = false
    setCarregando(true)

    supabase
      .from('custos_diarios')
      .select('*')
      .eq('barraca_id', barraca.id)
      .gte('data', intervalo.inicio)
      .lte('data', intervalo.fim)
      .then(({ data, error }) => {
        if (cancelado) return
        if (!error) setCustos((data ?? []) as CustoDiario[])
        setCarregando(false)
      })

    return () => {
      cancelado = true
    }
  }, [barraca.id, intervalo.inicio, intervalo.fim])

  if (carregando) return null

  const periodoDeUmDiaSo = intervalo.inicio === intervalo.fim
  const custoTotalCentavos = custos.reduce((soma, c) => soma + c.valor_centavos, 0)
  const diasComRegistro = custos.filter((c) => c.valor_centavos > 0).length
  const lucroLiquidoCentavos = receitaLiquidaCentavos - custoTotalCentavos

  function salvarCustoDoDia(centavos: number) {
    setCustos([{ id: '', barraca_id: barraca.id, data: intervalo.inicio, valor_centavos: centavos }])

    supabase
      .from('custos_diarios')
      .upsert(
        { barraca_id: barraca.id, data: intervalo.inicio, valor_centavos: centavos },
        { onConflict: 'barraca_id,data' },
      )
      .select()
      .single()
      .then(({ data, error }) => {
        if (!error && data) setCustos([data as CustoDiario])
      })
  }

  return (
    <Secao titulo="Custo e lucro">
      {periodoDeUmDiaSo ? (
        <CampoCustoDoDia key={intervalo.inicio} valorInicial={custoTotalCentavos} onSalvar={salvarCustoDoDia} />
      ) : (
        <p className="mt-2 text-sm text-mesa-text-secondary">
          Custo registrado no período: {formatarPrecoBR(custoTotalCentavos)} ({diasComRegistro} de{' '}
          {diasNoIntervalo(intervalo)} dia{diasNoIntervalo(intervalo) === 1 ? '' : 's'} lançados)
        </p>
      )}

      {custoTotalCentavos > 0 && (
        <p className="mt-2">
          <span
            className={`text-2xl font-black ${
              lucroLiquidoCentavos >= 0 ? 'text-mesa-teal-600' : 'text-mesa-error-500'
            }`}
          >
            {formatarPrecoBR(lucroLiquidoCentavos)}
          </span>{' '}
          <span className="text-sm font-medium text-mesa-text-secondary">lucro líquido</span>
        </p>
      )}
    </Secao>
  )
}
