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
}

export type DadosRecibo = {
  nomeBarraca: string
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
    }
  `
  document.head.appendChild(style)
}

function linhaDivisoria(): string {
  return '<hr style="border:none; border-top:1px dashed #000; margin:8px 0;" />'
}

function montarHtmlRecibo(dados: DadosRecibo): string {
  const dataFormatada = dados.horario.toLocaleDateString('pt-BR')
  const horaFormatada = dados.horario.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })

  const linhasItens = dados.itens
    .map((item) => {
      const nome = escaparHtml(item.nome)
      const totalItem =
        item.precoCentavosUnitario > 0
          ? formatarPrecoBR(item.precoCentavosUnitario * item.quantidade)
          : '—'
      return `<div style="display:flex; justify-content:space-between; gap:8px;">
        <span>${item.quantidade}x ${nome}</span>
        <span>${totalItem}</span>
      </div>`
    })
    .join('')

  const linhaMesaOuViagem = dados.viagem
    ? '<p style="margin:2px 0;">Viagem</p>'
    : dados.mesa
      ? `<p style="margin:2px 0;">Mesa ${escaparHtml(dados.mesa)}</p>`
      : ''

  const linhaObs = dados.observacao
    ? `<p style="margin:6px 0 0; font-style:italic;">Obs: ${escaparHtml(dados.observacao)}</p>`
    : ''

  return `
    <div style="text-align:center;">
      <p style="margin:0; font-weight:bold; font-size:14px;">${escaparHtml(dados.nomeBarraca)}</p>
      <p style="margin:8px 0 0; font-size:28px; font-weight:bold;">${String(dados.senha).padStart(3, '0')}</p>
      <p style="margin:0; font-size:10px; letter-spacing:0.1em;">SENHA</p>
    </div>
    ${linhaDivisoria()}
    <p style="margin:0;">${dataFormatada} ${horaFormatada}</p>
    ${linhaMesaOuViagem}
    ${linhaDivisoria()}
    ${linhasItens}
    ${linhaDivisoria()}
    <div style="display:flex; justify-content:space-between; font-weight:bold;">
      <span>Total</span>
      <span>${formatarPrecoBR(dados.totalCentavos)}</span>
    </div>
    <p style="margin:4px 0 0;">Pagamento: ${escaparHtml(dados.formaPagamento)}</p>
    ${linhaObs}
    <p style="text-align:center; margin:12px 0 0; font-size:10px;">Obrigado, volte sempre!</p>
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
