import { formatarPrecoBR } from './preco'

/**
 * Cupom impresso via a caixa de impressão nativa do navegador
 * (window.print), não Web Bluetooth direto — funciona com qualquer
 * impressora térmica instalada como impressora do sistema no aparelho
 * (Bluetooth Clássico, LE ou USB, tanto faz: quem fala com a impressora de
 * verdade é o sistema operacional, não o navegador). Decisão tomada com o
 * dono do produto em 2026-09-17 depois de mapear que Web Bluetooth só
 * fala com impressoras BLE, e a maioria das térmicas baratas usa
 * Bluetooth Clássico (SPP) — via impressão nativa isso deixa de importar.
 */

export type ItemRecibo = {
  nome: string
  quantidade: number
  precoCentavosUnitario: number
  observacao?: string | null
}

export type DadosRecibo = {
  nomeBarraca: string
  logoUrl: string | null
  senha: number
  horario: Date
  mesa: string | null
  viagem: boolean
  observacao: string | null
  itens: ItemRecibo[]
  totalCentavos: number
  formaPagamento: string
}

const ESTILO_RECIBO_ID = 'mesaagil-estilo-recibo'
const CONTAINER_RECIBO_ID = 'mesaagil-recibo-impressao'

/** Escapa texto livre (observação, nome de item, nome da barraca) antes de
 * injetar em innerHTML — esses campos vêm de digitação do usuário. */
function escaparHtml(texto: string): string {
  const div = document.createElement('div')
  div.textContent = texto
  return div.innerHTML
}

/** Como escaparHtml, mas também escapa aspas — necessário pra usar o valor
 * dentro de um atributo HTML (ex.: src="..."), não só em texto solto. */
function escaparAtributo(texto: string): string {
  return escaparHtml(texto).replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

function garantirEstiloRecibo(): void {
  if (document.getElementById(ESTILO_RECIBO_ID)) return

  const style = document.createElement('style')
  style.id = ESTILO_RECIBO_ID
  style.textContent = `
    #${CONTAINER_RECIBO_ID} {
      display: none;
    }
    @media print {
      @page {
        size: 80mm auto;
        margin: 0;
      }
      body * {
        visibility: hidden;
      }
      #${CONTAINER_RECIBO_ID}, #${CONTAINER_RECIBO_ID} * {
        visibility: visible;
      }
      #${CONTAINER_RECIBO_ID} {
        display: block;
        position: absolute;
        top: 0;
        left: 0;
        width: 80mm;
        padding: 3mm;
        font-family: 'Courier New', Courier, monospace;
        font-size: 11px;
        line-height: 1.4;
        color: #000;
      }
      #${CONTAINER_RECIBO_ID}, #${CONTAINER_RECIBO_ID} * {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
  `
  document.head.appendChild(style)
}

function linhaDivisoria(): string {
  return '<hr style="border:none; border-top:1px dashed #000; margin:8px 0;" />'
}

function linhaDivisoriaForte(): string {
  return '<hr style="border:none; border-top:2px solid #000; margin:10px 0 6px;" />'
}

function montarHtmlRecibo(dados: DadosRecibo): string {
  const dataFormatada = dados.horario.toLocaleDateString('pt-BR')
  const horaFormatada = dados.horario.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })

  const logo = dados.logoUrl
    ? `<img src="${escaparAtributo(dados.logoUrl)}" alt="" style="max-height:48px; max-width:60mm; margin:0 auto 6px; display:block;" />`
    : ''

  const linhasItens = dados.itens
    .map((item) => {
      const nome = escaparHtml(item.nome)
      const totalItem =
        item.precoCentavosUnitario > 0
          ? formatarPrecoBR(item.precoCentavosUnitario * item.quantidade)
          : '—'
      const linhaUnitario =
        item.quantidade > 1 && item.precoCentavosUnitario > 0
          ? `<div style="font-size:10px; color:#333;">${formatarPrecoBR(item.precoCentavosUnitario)} cada</div>`
          : ''
      const linhaObsItem = item.observacao
        ? `<div style="font-size:10px; font-style:italic; color:#333;">Obs: ${escaparHtml(item.observacao)}</div>`
        : ''
      return `<div style="display:flex; justify-content:space-between; gap:8px; margin:4px 0;">
        <div>
          <span style="font-weight:bold;">${item.quantidade}x</span> ${nome}
          ${linhaUnitario}
          ${linhaObsItem}
        </div>
        <span style="white-space:nowrap;">${totalItem}</span>
      </div>`
    })
    .join('')

  const linhaMesaOuViagem = dados.viagem
    ? '<p style="margin:2px 0;">Viagem</p>'
    : dados.mesa
      ? `<p style="margin:2px 0;">Mesa ${escaparHtml(dados.mesa)}</p>`
      : ''

  const linhaObs = dados.observacao
    ? `${linhaDivisoria()}<p style="margin:0; font-style:italic;">Obs: ${escaparHtml(dados.observacao)}</p>`
    : ''

  return `
    <div style="text-align:center;">
      ${logo}
      <p style="margin:0; font-weight:bold; font-size:16px; text-transform:uppercase;">${escaparHtml(dados.nomeBarraca)}</p>
    </div>
    ${linhaDivisoria()}
    <div style="text-align:center; background:#000; color:#fff; padding:10px 0; font-family: Arial, Helvetica, sans-serif;">
      <p style="margin:0; font-size:10px; letter-spacing:0.2em;">SENHA</p>
      <p style="margin:2px 0 0; font-size:40px; font-weight:800; line-height:1;">${String(dados.senha).padStart(3, '0')}</p>
    </div>
    ${linhaDivisoria()}
    <p style="margin:0;">${dataFormatada} às ${horaFormatada}</p>
    ${linhaMesaOuViagem}
    ${linhaDivisoria()}
    ${linhasItens}
    ${linhaDivisoriaForte()}
    <div style="display:flex; justify-content:space-between; font-weight:bold; font-size:15px;">
      <span>TOTAL</span>
      <span>${formatarPrecoBR(dados.totalCentavos)}</span>
    </div>
    <p style="margin:4px 0 0;">Pagamento: ${escaparHtml(dados.formaPagamento)}</p>
    ${linhaObs}
    <div style="text-align:center; margin-top:14px;">
      <p style="margin:0; font-size:12px;">Obrigado, volte sempre!</p>
      <p style="margin:6px 0 0; font-size:9px; color:#555;">MesaAgil</p>
    </div>
  `
}

export function imprimirRecibo(dados: DadosRecibo): void {
  garantirEstiloRecibo()

  let container = document.getElementById(CONTAINER_RECIBO_ID)
  if (!container) {
    container = document.createElement('div')
    container.id = CONTAINER_RECIBO_ID
    document.body.appendChild(container)
  }

  container.innerHTML = montarHtmlRecibo(dados)

  window.print()
}

const CHAVE_ULTIMO_RECIBO_PREFIXO = 'mesaagil:ultimo-recibo:'

type DadosReciboSerializavel = Omit<DadosRecibo, 'horario'> & { horario: string }

/** Guarda o cupom mais recente por barraca — usado pelo atalho "Reimprimir
 * último cupom" no Hub. Best-effort: se localStorage falhar (modo privado,
 * cota cheia), só perde a reimpressão, nunca o cupom original já disparado. */
export function salvarUltimoRecibo(barracaId: string, dados: DadosRecibo): void {
  try {
    const serializavel: DadosReciboSerializavel = { ...dados, horario: dados.horario.toISOString() }
    localStorage.setItem(CHAVE_ULTIMO_RECIBO_PREFIXO + barracaId, JSON.stringify(serializavel))
  } catch {
    // ignora — ver comentário acima
  }
}

export function obterUltimoRecibo(barracaId: string): DadosRecibo | null {
  try {
    const bruto = localStorage.getItem(CHAVE_ULTIMO_RECIBO_PREFIXO + barracaId)
    if (!bruto) return null
    const serializavel = JSON.parse(bruto) as DadosReciboSerializavel
    return { ...serializavel, horario: new Date(serializavel.horario) }
  } catch {
    return null
  }
}

export function reimprimirUltimoRecibo(barracaId: string): boolean {
  const dados = obterUltimoRecibo(barracaId)
  if (!dados) return false
  imprimirRecibo(dados)
  return true
}
