import { useMemo } from 'react'
import type { ReactNode } from 'react'
import { useRelatorio } from '../hooks/useRelatorio'
import type { FiltroRelatorio } from '../hooks/useRelatorio'
import { calcularIntervalosRelatorio, METODOS_OU_NAO_INFORMADO } from '../lib/relatorio'
import type { DetalhamentoLiquido, MetodoOuNaoInformado } from '../lib/relatorio'
import { formatarPrecoBR } from '../lib/preco'
import { bpsParaPercentual } from '../lib/taxas'
import { METODOS_DISPONIVEIS } from '../lib/metodoPagamento'
import { MOTIVOS_CANCELAMENTO } from '../lib/cancelamento'
import { hojeISO } from '../lib/datas'
import type { Barraca } from '../types/database'

function tituloRelatorio(filtro: FiltroRelatorio): string {
  if (filtro.tipo === 'hoje') return 'Relatório de hoje'
  if (filtro.tipo === 'ontem') return 'Relatório de ontem'
  if (filtro.tipo === '7dias') return 'Relatório dos últimos 7 dias'

  const iso = filtro.data ?? hojeISO()
  const [ano, mes, dia] = iso.split('-').map(Number)
  const data = new Date(ano, mes - 1, dia)
  const texto = data.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })
  return `Relatório de ${texto}`
}

// já vem com a preposição certa embutida — "nos últimos 7 dias" não leva
// "em" na frente, "hoje"/"ontem" tampouco, só a data específica leva "em"
function fraseDoPeriodo(filtro: FiltroRelatorio): string {
  if (filtro.tipo === 'hoje') return 'hoje'
  if (filtro.tipo === 'ontem') return 'ontem'
  if (filtro.tipo === '7dias') return 'nos últimos 7 dias'

  const iso = filtro.data ?? hojeISO()
  const [ano, mes, dia] = iso.split('-').map(Number)
  const data = new Date(ano, mes - 1, dia)
  return `em ${data.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}`
}

function nomeDoDia(iso: string): string {
  const [ano, mes, dia] = iso.split('-').map(Number)
  const data = new Date(ano, mes - 1, dia)
  return data.toLocaleDateString('pt-BR', { weekday: 'long' })
}

function motivoEmMinusculo(chave: string): string {
  const rotulo = MOTIVOS_CANCELAMENTO.find((m) => m.valor === chave)?.rotulo ?? chave
  return rotulo.toLowerCase()
}

function iconeLabelMetodo(chave: MetodoOuNaoInformado): { icone: string; label: string } {
  if (chave === 'nao_informado') return { icone: '', label: 'Método não informado' }
  const metodo = METODOS_DISPONIVEIS.find((m) => m.chave === chave)
  return { icone: metodo?.icone ?? '', label: metodo?.label ?? chave }
}

function textoDetalhamentoLiquido(detalhamento: DetalhamentoLiquido[]): string {
  return detalhamento
    .map((d) => {
      const { label } = iconeLabelMetodo(d.metodo)
      const sufixo = d.taxaBps
        ? `após ${bpsParaPercentual(d.taxaBps)}%`
        : d.metodo === 'debito' || d.metodo === 'credito'
          ? 'taxa não configurada'
          : 'sem taxa'
      return `${label} ${formatarPrecoBR(d.totalLiquido)} (${sufixo})`
    })
    .join(' + ')
}

/** Monta "vs {label} passado: +R$ X (+Y%)" ou "sem comparação" — reusado tanto
 * pelo modo completo (total bruto) quanto pelo modo produto isolado (total
 * do produto), já que a mecânica de comparação é idêntica nos dois. */
function textoEcorComparacao(
  atualValor: number,
  comparacaoValor: number,
  labelComparacao: string,
): { texto: string; cor: string } {
  const diferenca = atualValor - comparacaoValor
  const percentual = comparacaoValor > 0 ? (diferenca / comparacaoValor) * 100 : null
  const sinal = diferenca >= 0 ? '+' : '-'

  const texto =
    comparacaoValor === 0
      ? 'sem comparação'
      : `vs ${labelComparacao}: ${sinal}${formatarPrecoBR(Math.abs(diferenca))} (${sinal}${Math.round(
          Math.abs(percentual ?? 0),
        )}%)`
  const cor =
    comparacaoValor > 0 && diferenca > 0 ? 'text-sinal-verde' : 'text-neutral-500 dark:text-neutral-400'

  return { texto, cor }
}

function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div className="mt-5 border-t border-neutral-200 pt-4 dark:border-neutral-800">
      <h3 className="text-xs font-bold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
        {titulo}
      </h3>
      {children}
    </div>
  )
}

function CartaoRelatorio({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900/60">
      {children}
    </div>
  )
}

function Carregando() {
  return (
    <CartaoRelatorio>
      <p className="text-center text-sm text-neutral-500 dark:text-neutral-400">
        Calculando relatório...
      </p>
    </CartaoRelatorio>
  )
}

function Erro() {
  return (
    <CartaoRelatorio>
      <p className="text-center text-sm text-red-600">Não foi possível calcular o relatório.</p>
    </CartaoRelatorio>
  )
}

export function PainelRelatorio({
  barraca,
  filtro,
  itemFiltradoId = null,
  nomeItemFiltrado = null,
}: {
  barraca: Barraca
  filtro: FiltroRelatorio
  itemFiltradoId?: string | null
  nomeItemFiltrado?: string | null
}) {
  const resultado = useRelatorio(barraca, filtro, itemFiltradoId)

  // mesmo motivo do useRelatorio: depende dos campos primitivos, não do
  // objeto filtro (que o Historico passa como literal inline)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const intervalos = useMemo(() => calcularIntervalosRelatorio(filtro), [filtro.tipo, filtro.data])

  if (resultado.carregando || !resultado.atual) return <Carregando />
  if (resultado.erro) return <Erro />

  const labelComparacao =
    filtro.tipo === '7dias' ? 'período anterior' : `${nomeDoDia(intervalos.comparacao.inicio)} passado`

  // ---- modo produto isolado: painel simplificado, uma unica secao ----
  if (resultado.modo === 'produto_isolado') {
    const { atual, comparacao } = resultado
    const totalComparacao = comparacao?.totalIsolado ?? 0
    const { texto: textoComparacao, cor: corComparacao } = textoEcorComparacao(
      atual.totalIsolado,
      totalComparacao,
      labelComparacao,
    )

    return (
      <CartaoRelatorio>
        <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
          Relatório de {nomeItemFiltrado ?? 'produto'} {fraseDoPeriodo(filtro)}
        </h2>

        <div className="mt-3">
          <h3 className="text-xs font-bold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
            O que passou pelo sistema
          </h3>
          <p className="mt-1 text-4xl font-black text-neutral-900 dark:text-neutral-100">
            {formatarPrecoBR(atual.totalIsolado)}
          </p>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {atual.unidadesVendidas} unidade{atual.unidadesVendidas === 1 ? '' : 's'} vendida
            {atual.unidadesVendidas === 1 ? '' : 's'}
          </p>
          <p className={`mt-1 text-sm font-medium ${corComparacao}`}>{textoComparacao}</p>
        </div>
      </CartaoRelatorio>
    )
  }

  // ---- modo completo (Fase 3.1 + Mais vendidos + Ritmo) ----
  const { atual, comparacao } = resultado
  const { texto: textoComparacao, cor: corComparacao } = textoEcorComparacao(
    atual.totalBruto,
    comparacao?.totalBruto ?? 0,
    labelComparacao,
  )

  const metodosComValor = METODOS_OU_NAO_INFORMADO.filter(
    (chave) => atual.divisaoPorMetodo[chave].quantidade > 0,
  )

  const { cancelados, entregaDireta, itensSemPreco, itensRemovidos } = atual.pontosAtencao
  const mostraEntregaDireta = filtro.tipo === 'hoje' || filtro.tipo === 'ontem'
  const mostraRitmo = filtro.tipo === 'hoje' || filtro.tipo === 'ontem'

  const linhasAtencao: { texto: string; subtitulo?: string }[] = []

  if (cancelados.quantidade > 0) {
    const motivosTexto = Object.entries(cancelados.motivos)
      .map(([chave, qtd]) => `${qtd} ${motivoEmMinusculo(chave)}`)
      .join(', ')
    linhasAtencao.push({
      texto: `${cancelados.quantidade} pedido${cancelados.quantidade === 1 ? '' : 's'} cancelado${
        cancelados.quantidade === 1 ? '' : 's'
      } (${formatarPrecoBR(cancelados.valor)} não faturados)`,
      subtitulo: `Motivos: ${motivosTexto}`,
    })
  }

  if (mostraEntregaDireta && entregaDireta.quantidade > 0) {
    linhasAtencao.push({
      texto: `${entregaDireta.quantidade} pedido${
        entregaDireta.quantidade === 1 ? '' : 's'
      } com entrega direta`,
    })
  }

  if (itensSemPreco.pedidos > 0) {
    const sufixo =
      itensSemPreco.valorEstimado > 0
        ? ` — pode ter subestimado em ~${formatarPrecoBR(itensSemPreco.valorEstimado)}`
        : ''
    linhasAtencao.push({
      texto: `${itensSemPreco.pedidos} pedido${
        itensSemPreco.pedidos === 1 ? '' : 's'
      } com item sem preço cadastrado${sufixo}`,
    })
  }

  if (itensRemovidos.quantidade > 0) {
    linhasAtencao.push({
      texto: `${itensRemovidos.quantidade} ${
        itensRemovidos.quantidade === 1 ? 'item removido' : 'itens removidos'
      } de comandas ao longo do período`,
    })
  }

  return (
    <CartaoRelatorio>
      <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
        {tituloRelatorio(filtro)}
      </h2>

      <div className="mt-3">
        <h3 className="text-xs font-bold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
          O que passou pelo sistema
        </h3>
        <p className="mt-1 text-4xl font-black text-neutral-900 dark:text-neutral-100">
          {formatarPrecoBR(atual.totalBruto)}
        </p>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          {atual.quantidadePedidos} comanda{atual.quantidadePedidos === 1 ? '' : 's'}
        </p>
        <p className={`mt-1 text-sm font-medium ${corComparacao}`}>{textoComparacao}</p>
      </div>

      {atual.quantidadePedidos > 0 && (
        <Secao titulo="Por método de pagamento">
          <ul className="mt-2 flex flex-col gap-1.5">
            {metodosComValor.map((chave) => {
              const { icone, label } = iconeLabelMetodo(chave)
              const d = atual.divisaoPorMetodo[chave]
              return (
                <li key={chave} className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-neutral-800 dark:text-neutral-200">
                    {icone ? `${icone} ` : ''}
                    {label}
                  </span>
                  <span className="shrink-0 font-semibold text-neutral-900 dark:text-neutral-100">
                    {formatarPrecoBR(d.total)} ({Math.round(d.percentual)}%)
                  </span>
                </li>
              )
            })}
          </ul>
        </Secao>
      )}

      {atual.estimativaLiquida && (
        <Secao titulo="Estimativa recebida">
          <p className="mt-1 text-3xl font-black text-neutral-900 dark:text-neutral-100">
            {formatarPrecoBR(atual.estimativaLiquida.totalLiquido)}
          </p>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            {textoDetalhamentoLiquido(atual.estimativaLiquida.detalhamento)}
          </p>
          <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
            Estimativa. Pode divergir do extrato por descontos, cortesias, fiado etc.
          </p>
        </Secao>
      )}

      <Secao titulo="Mais vendidos">
        {atual.maisVendidos.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">Sem dados no período</p>
        ) : (
          <ol className="mt-2 flex flex-col gap-1.5">
            {atual.maisVendidos.map((item, indice) => (
              <li
                key={item.item_id ?? item.nome_item}
                className="text-sm text-neutral-800 dark:text-neutral-200"
              >
                {indice + 1}. {item.nome_item} — {item.quantidade_total} unidade
                {item.quantidade_total === 1 ? '' : 's'}
                {item.valor_total > 0 ? ` (${formatarPrecoBR(item.valor_total)})` : ''}
              </li>
            ))}
          </ol>
        )}
      </Secao>

      {mostraRitmo && (
        <Secao titulo="Ritmo">
          {atual.ritmoDoDia.horarioPico === null ? (
            <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
              Ainda sem dados suficientes
            </p>
          ) : (
            <div className="mt-2 flex flex-col gap-1 text-sm text-neutral-800 dark:text-neutral-200">
              {atual.ritmoDoDia.tempoMedioPreparoMin !== null && (
                <p>Tempo médio de preparo: {atual.ritmoDoDia.tempoMedioPreparoMin} min</p>
              )}
              <p>
                Horário mais movimentado: {atual.ritmoDoDia.horarioPico.hora}h–
                {atual.ritmoDoDia.horarioPico.hora + 1}h ({atual.ritmoDoDia.horarioPico.quantidade}{' '}
                comandas)
              </p>
            </div>
          )}
        </Secao>
      )}

      <Secao titulo="Pontos de atenção">
        {linhasAtencao.length === 0 ? (
          <p className="mt-2 text-sm font-medium text-sinal-verde">Nenhum ponto de atenção 👍</p>
        ) : (
          <ul className="mt-2 flex flex-col gap-2">
            {linhasAtencao.map((linha, indice) => (
              <li key={indice} className="flex items-start gap-2">
                <span aria-hidden className="leading-tight">
                  ⚠️
                </span>
                <div>
                  <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                    {linha.texto}
                  </p>
                  {linha.subtitulo && (
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      {linha.subtitulo}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Secao>
    </CartaoRelatorio>
  )
}
