import type { Item } from '../types/database'

/**
 * Contrato de estado passado via `navigate(..., { state })` entre
 * LancarPedido e ConfirmarPedido (Fase 4). Preferido a Context/store porque
 * o carrinho só existe enquanto esse fluxo de duas telas está em andamento
 * — não precisa sobreviver a reload nem ser lido de mais lugares.
 */
export type Carrinho = Record<string, number>
export type EntregaDiretaPorItem = Record<string, boolean>

/** LancarPedido → ConfirmarPedido, ao clicar "Ver nota". */
export type EstadoParaConfirmar = {
  carrinho: Carrinho
  itens: Item[]
  mesa: string
  viagem: boolean
  observacao: string
  entregaDireta?: EntregaDiretaPorItem
}

/** ConfirmarPedido → LancarPedido, ao clicar "Voltar e editar". */
export type EstadoParaEditar = {
  carrinho: Carrinho
  mesa: string
  viagem: boolean
  observacao: string
  entregaDireta?: EntregaDiretaPorItem
}

/** ConfirmarPedido → LancarPedido, depois de enviar com sucesso — LancarPedido
 * usa isso pra pular direto pra tela de senha (herói), sem passar pelo form. */
export type EstadoPedidoEnviado = {
  senhaEnviada: {
    valor: number
    provisoria: boolean
    idFila?: string
  }
}

function dataOperacaoAtual(): string {
  const agora = new Date()
  const ano = agora.getFullYear()
  const mes = String(agora.getMonth() + 1).padStart(2, '0')
  const dia = String(agora.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

/**
 * Número local, só para o operador ter o que falar/anotar enquanto o
 * pedido real ainda não sincronizou. Isolado por barraca e por dia,
 * mas NUNCA é escrito no banco nem comparado com a senha real — dois
 * dispositivos offline ao mesmo tempo podem gerar o mesmo número
 * provisório, e é por isso que a tela deixa isso muito claro.
 */
export function proximoNumeroProvisorio(barracaId: string): number {
  const chave = `mesaagil:provisorio:${barracaId}:${dataOperacaoAtual()}`
  const atual = Number(window.localStorage.getItem(chave) ?? '0')
  const proximo = atual + 1
  window.localStorage.setItem(chave, String(proximo))
  return proximo
}
