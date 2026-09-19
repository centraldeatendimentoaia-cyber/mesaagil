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
revertida em 2026-09-17: todo restaurante precisa desse impresso.
Já implementado de verdade (src/lib/impressao.ts): cupom simples via
impressão nativa do navegador (window.print), sem exigência fiscal —
não é Nota Fiscal Eletrônica (isso continua fora de escopo, exigiria
certificado digital e integração com a SEFAZ). Confirmar e enviar /
Entregar já disparam a impressão sozinhos, sem botão separado. O
Hub também tem "Reimprimir último cupom" (guardado em localStorage
por barraca).

## Regras de produto
- Senha sequencial por pedido, reinicia todo dia
- Mesa é campo opcional; toggle "Viagem" desabilita a mesa
- Observação existe em DOIS níveis (regra mudou em 2026-09-18,
  decisão do dono do produto): `pedidos.observacao` é o recado geral
  do pedido inteiro (ex.: "cliente com pressa"), e
  `itens_do_pedido.observacao` é específica de um item (ex.: "sem
  cebola") — cada item do carrinho em Lançar Pedido tem seu próprio
  campo de observação, mostrado depois em Confirmar Pedido, Cozinha
  (como alerta de atenção) e no cupom impresso
- Item do cardápio pode ter foto e descrição (`itens.foto_url`,
  `itens.descricao`) — cadastradas em Ajustes, mostradas em Lançar
  Pedido. Foto sobe pro bucket de Storage `cardapio-fotos` (público
  pra leitura, redimensionada/comprimida no navegador antes do
  upload). Mesmos campos previstos pra reaproveitar no cardápio
  digital do roadmap
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
- Cor de marca é fixa do MesaAgil — desde o redesign "Speed Bento
  POS" (2026-09-18) é âmbar para comando (`mesa-orange-*`, antes
  laranja) e esmeralda para confirmação (`mesa-teal-*`, antes teal).
  Mesmos papéis semânticos de sempre, só a cor mudou — os nomes de
  token (`mesa-orange-*`/`mesa-teal-*`) ficaram os mesmos de
  propósito, pra não precisar tocar em cada componente. Cada barraca
  define apenas logo, nome e modo claro/escuro — cor primária por
  barraca continua eliminada, não sugerir customização de cor.
- Tema aplicado por CSS custom properties em runtime
  (src/styles/tokens.css) — nenhuma cor escrita direto no componente
- As cores do kanban (verde/amarelo/vermelho) NUNCA são
  personalizáveis — são sinal operacional. Realinhadas no redesign
  pras mesmas cores de emerald/amber/red usadas no resto do app
- A cor da marca nunca aparece dentro da tela da Cozinha
- Tipografia (redesign 2026-09-18): Hanken Grotesk no corpo, Space
  Grotesk em h1/h2/h3, carregadas via Google Fonts (index.html) com
  runtimeCaching no service worker pra funcionar offline. Isso
  substitui a referência antiga de "fonte do sistema" — ver Estilo
  abaixo
- Redesign fonte: pasta `redesign_ux_ui_app/` na raiz do projeto tem
  os mockups (.svg) e specs de design (DESIGN.md) que guiam o v3 —
  ela também tem elementos que NÃO entram no MesaAgil por decisão do
  dono do produto em 2026-09-18: controle de estoque, atalho de
  Suprimento/Sangria de caixa e leitor de código de barras (todos
  PDV-adjacentes, fora de escopo — ver "O que o sistema NÃO é"
  acima). Não implementar esses três a partir dos mockups mesmo que
  apareçam lá

## Roadmap de produto (decidido, mas não é pra agora)
Direção combinada com o dono do produto em 2026-09-17 — não iniciar
nenhum item daqui sozinho, só quando for pedido explicitamente.
- Cadastro self-service e múltiplas barracas por conta: já
  implementado (v2) — qualquer usuário autenticado pode criar sua
  própria barraca e trocar entre as que tem acesso.
- Impressão de comprovante/nota: já implementado — ver "O que o
  sistema NÃO é (hoje)" no topo deste arquivo.
- Cobrança de assinatura do MesaAgil (o dono da barraca paga pelo
  uso do app): só depois que o produto estiver 100% pronto/estável.
  Isso é billing SaaS MesaAgil→cliente, problema completamente
  diferente do pagamento de pedido cliente-final→barraca citado
  acima — não misturar os dois ao planejar.
- Cardápio Digital: tela pública (fora do app, sem login, um link
  por barraca) onde o cliente final navega o cardápio da mesa — usa
  os mesmos itens.foto_url/descricao já cadastrados em Ajustes.
  Em construção em fases, por decisão do dono do produto em
  2026-09-18:
  - Fase 1 (atual): só navegação/visualização do cardápio. O botão
    de adicionar item NÃO tem função ainda — de propósito, não é bug
    esquecido.
  - Fase 2 (futura): cliente monta pedido e ele cai direto na
    Cozinha, mas o pagamento continua fora do app (maquininha/Pix na
    mesa, como já funciona hoje) — só tira a fila de atendimento,
    não mexe em pagamento ainda.
  - Fase 3 (futura): integração de pagamento online — só depois de
    confirmado o pagamento o pedido vai pra cozinha. Essa fase VAI
    exigir processar pagamento de pedido, contradizendo a regra "não
    processa pagamento" acima — intencional, decisão consciente do
    dono do produto, não um erro a corrigir de volta quando chegar a
    vez de implementar.

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
Desde o redesign "Speed Bento POS" (2026-09-18): âmbar/esmeralda/
slate, Hanken Grotesk + Space Grotesk (ver Regras de tema), sombras
tonais rasas (não mais "quase imperceptíveis" — cards têm borda
nítida de 1px + sombra leve, botões sólidos têm um realce tátil sutil
no topo). Cantos ~16px continuam. Mobile-first — o uso real é em
celular, em pé, com uma mão só — isso não mudou.
