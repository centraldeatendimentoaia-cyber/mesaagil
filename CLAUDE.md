# MesaAgil

Sistema de comanda digital para barracas de feira e food service.
Primeiro cliente: Sabor Kawashima (comida japonesa). Segundo cliente
em prospecção: restaurante de PF.

## O que o sistema é
Substituto do papel espetado no espeto de ferro. Operador lança o
pedido, a cozinha vê em kanban, o cliente é chamado pela senha.

## O que o sistema NÃO é (hoje)
Não é PDV. Não controla estoque. Não processa pagamento do pedido em
comanda — a maquininha do cliente já faz isso melhor nesse fluxo
(operador lança, cozinha prepara, cliente é chamado). Nunca sugira
PDV ou controle de estoque — isso continua fora de escopo. O
pagamento tem uma ressalva: ver "Roadmap de produto" abaixo, já
existe uma direção decidida que muda essa regra mais pra frente.

Impressão de comprovante/nota NÃO está fora de escopo — decisão
revertida em 2026-09-17 (ver Roadmap de produto): todo restaurante
precisa desse impresso. O botão "Imprimir NFe" em ConfirmarPedido.tsx
é hoje só um placeholder visual ("Em breve"); antes de implementar de
verdade, confirme com o dono do produto se é (a) um comprovante/cupom
simples de impressão térmica, sem exigência fiscal, ou (b) Nota
Fiscal Eletrônica de verdade — a segunda opção envolve certificado
digital e integração com a SEFAZ, é um projeto bem maior que só
"imprimir", e muda completamente o escopo técnico.

## Regras de produto
- Senha sequencial por pedido, reinicia todo dia
- Mesa é campo opcional; toggle "Viagem" desabilita a mesa
- Observação é POR PEDIDO (texto livre), não por item
- Kanban com 2 colunas: A Fazer e Pronto
- Ordem FIFO: pedido mais antigo no topo
- Cor por tempo desde a entrada do pedido. Congela ao entrar em
  Pronto.
- Em Pronto, botões explícitos "Voltar" e "Entregue"
- Itens podem ser removidos de comanda já lançada por REMOÇÃO
  LÓGICA: a linha permanece no banco marcada como removida, nunca
  DELETE. Exceção confirmada: "Apagar período" em Histórico é uma
  ação de admin pra purgar histórico antigo por completo (DELETE
  físico mesmo) — não é a mesma coisa que remover um item de uma
  comanda ativa, e foi confirmada como intencional pelo dono do
  produto em 2026-09-17.
- Multi-tenant: toda tabela tem barraca_id, toda query filtra por
  ele

## Regras de tema
- Cor de marca é fixa do MesaAgil (laranja para comando, teal para
  confirmação). Cada barraca define apenas logo, nome e modo
  claro/escuro. Cor primária por barraca foi eliminada — não sugerir
  customização de cor.
- Tema aplicado por CSS custom properties em runtime
- Nenhuma cor escrita direto no componente, apenas variáveis CSS
- As cores do kanban (verde/amarelo/vermelho) NUNCA são
  personalizáveis — são sinal operacional
- A cor da marca nunca aparece dentro da tela da Cozinha

## Roadmap de produto (decidido, mas não é pra agora)
Direção combinada com o dono do produto em 2026-09-17 — não iniciar
nenhum item daqui sozinho, só quando for pedido explicitamente.
- Cadastro self-service e múltiplas barracas por conta: já
  implementado (v2) — qualquer usuário autenticado pode criar sua
  própria barraca e trocar entre as que tem acesso.
- Impressão de comprovante/nota (impressora térmica, Web Bluetooth —
  ver Fase 5 do roadmap original): quando implementar, o botão
  "Imprimir NFe" de ConfirmarPedido.tsx some como botão separado —
  vira parte dos botões "Entregar" e "Confirmar e enviar" (cada um já
  dispara a impressão ao confirmar, sem passo extra).
- Cobrança de assinatura do MesaAgil (o dono da barraca paga pelo
  uso do app): só depois que o produto estiver 100% pronto/estável.
  Isso é billing SaaS MesaAgil→cliente, problema completamente
  diferente do pagamento de pedido cliente-final→barraca citado
  acima — não misturar os dois ao planejar.
- Cardápio por barraca com fotos, descrição, tempo de preparo e
  preço, permitindo que o cliente final peça e pague via Pix sem
  enfrentar fila: essa fase VAI exigir processar pagamento de
  pedido, contradizendo a regra "não processa pagamento" acima —
  isso é intencional, uma decisão consciente do dono do produto, não
  um erro a corrigir de volta pra regra antiga quando chegar a vez
  de implementar.

## Regras técnicas invioláveis
- Telas de lançar pedido e cozinha funcionam offline
- Enviar pedido é idempotente (duplo toque não cria dois pedidos)
- Nada bloqueia a operação esperando rede
- Áreas de toque de no mínimo 44px

## Stack
React + Vite + TypeScript, Tailwind CSS v4 (configuração via @theme
block no CSS, não há tailwind.config.js), Supabase (Postgres, Auth,
Realtime), deploy em Cloudflare Pages.

## Estilo
Referência: apps nativos da Apple. Fonte do sistema, cantos 16px,
sombras quase imperceptíveis, muito espaço em branco, barra de abas
na base no celular. Mobile-first — o uso real é em celular, em pé,
com uma mão só.
