# Design System — MesaAgil

Documento técnico de referência. Todas as decisões abaixo estão amarradas a evidência visual (protótipo atual + referências enviadas: Zentro POS, Link AI/Urbanist) ou a regras operacionais do produto explicitadas pelo dono. Onde uma decisão foi tomada por julgamento, está marcada como **[Julgamento]** com a justificativa.

Consumo esperado: Claude Code lê este documento junto com `tokens.css` e `tokens.json` e implementa a interface sem precisar tomar decisões estéticas por conta própria.

---

## 1. Identidade visual

### 1.1 Personalidade

MesaAgil é um sistema de comanda em kanban para food service pequeno e médio (barraca de feira, restaurante popular, delivery próprio). A identidade é **premium acolhedor**: séria o suficiente para o dono confiar dinheiro nela, quente o suficiente para não parecer software corporativo frio. Evidência: as referências enviadas (Zentro em especial) trabalham essa exata tensão — dashboard denso de informação convivendo com fotografia de comida quente e glow de fundo cor de pêssego.

### 1.2 Princípios de design

Cinco princípios ordenam qualquer conflito de decisão durante a implementação.

**Número é protagonista.** Em PDV, o dono precisa ler valor e senha em milissegundos. Números maiores, mais pesados e com mais respiro que qualquer outro texto ao redor. Isso já está no protótipo atual (senha `042` heróica na Chamada, `R$ 1.240` gigante nos Relatórios) e a referência Zentro reforça (`$67,829` / `$12,254` como âncoras do dashboard).

**Semáforo é sinal, não estilo.** Verde, amarelo e vermelho da tela Cozinha comunicam tempo de preparo. São inviolavelmente puros — nunca são temáveis pela marca do cliente, nunca dividem espaço com gradiente colorido, nunca competem com CTA. Regra explícita do produto.

**Calor sem confusão.** Gradientes laranja e blur atmosférico aparecem no fundo das telas de gestão (Caixa, Lançar Pedido, Login, Relatórios, Ajustes, Histórico, Chamada, Confirmar Pedido). Nunca no fundo da Cozinha, pelo motivo acima.

**Toque grande antes de bonito.** O produto é usado com dedo em cima de balcão, sob luz de barraca de feira ou pressa de horário de pico. Alvos de toque nunca abaixo de 44×44 pt. Espaçamento entre botões de decisão irreversível (confirmar/cancelar) sempre generoso.

**Contido, não expressivo.** Motion tátil e curto (150–400 ms). Nada de bounce dramático, nada de partículas. O aplicativo tem que parecer premium, não brinquedo.

### 1.3 Tom de escrita da interface

Segunda pessoa direta em português. "Confirmar entrega" e não "Confirmação de entrega". "Sair" e não "Encerrar sessão do usuário". Números concretos antes de rótulos abstratos (`R$ 1.240 · 15% vs sábado passado`). Confirmação destrutiva sempre com pergunta ("Você quer mesmo cancelar comanda?") e nunca com jargão ("Deseja proceder com o cancelamento?").

---

## 2. Fundações

### 2.1 Cores

O sistema tem três camadas de cor: **marca** (laranja + teal, com divisão funcional), **semânticas** (feedback), e **operacionais** (semáforo da Cozinha, inviolável). A escala 50–900 do protótipo atual está preservada porque já foi trabalhada e balanceada.

#### 2.1.1 Marca — divisão funcional

A regra que impede a colisão de dois protagonistas: **laranja comanda, teal confirma**. Isso se traduz em cada componente:

| Uso                                                 | Cor         | Token                     |
| --------------------------------------------------- | ----------- | ------------------------- |
| Botão CTA primário ("Enviar Pedido", "+ Adicionar") | Laranja 500 | `color-action-primary`    |
| Aba ativa em segmentos (pill de fundo)              | Branco + sombra sobre trilho neutro; label em Laranja 700 quando ativo | `color-tab-active-*`     |
| Foco de teclado / hover em ação primária            | Laranja 600 | `color-action-primary-hover` |
| Badge de novidade ("NOVO")                          | Laranja 500 sobre Laranja 50 | `color-badge-brand-*`  |
| Logo e marca                                        | Laranja 500 | `color-brand`             |
| Destaque financeiro positivo (Faturamento, Lucro)   | Teal 700 (evidência: números verdes escuros do dashboard atual) | `color-financial-positive` |
| Botão de confirmação positiva ("Confirmar entrega", "Mover para Pronto", "Entregar direto") | Teal 500 | `color-action-confirm` |
| Success state (toast, alert, ícone de check)        | Teal 500 / Teal 700 | `color-success-*` |
| Toggle ligado                                       | Teal 500    | `color-switch-on`         |
| Check marcado (checkbox e radio)                    | Teal 500    | `color-check-active`      |
| Barra de progresso                                  | Teal 500    | `color-progress-fill`     |
| Indicador "Online" / "Tempo real"                   | Teal 500 (ponto) + Teal 700 (label) | `color-status-live-*` |

**Base laranja: `#F58B00`** (Laranja 500 — preservada do protótipo).
**Base teal: `#00B894`** (Teal 500 — preservada do protótipo).

Escalas de 9 tons já definidas no protótipo permanecem sem alteração.

#### 2.1.2 Neutros

Escala neutra preservada do protótipo (Neutral 50 `#F5F5F6` → Neutral 900 `#0D0D0F`). Uso semântico:

| Papel                       | Light                                  | Dark                                   |
| --------------------------- | -------------------------------------- | -------------------------------------- |
| Fundo base da tela          | Neutral 50 (`#F5F5F6`) + glow laranja  | Neutral 900 (`#0D0D0F`) + glow âmbar   |
| Fundo da Cozinha            | Neutral 50 puro (sem glow)             | Neutral 900 puro (sem glow)            |
| Superfície de card          | Branco puro (`#FFFFFF`)                | Neutral 800 (`#1A1A1E`)                |
| Superfície elevada (modal, popover) | Branco puro + sombra 3               | Neutral 700 (`#242A30`) + sombra 3     |
| Divisor / borda sutil       | Neutral 100 (`#E8E9EA`)                | Neutral 700 (`#242A30`)                |
| Texto primário              | Neutral 900 (`#0D0D0F`)                | Branco puro (`#FFFFFF`)                |
| Texto secundário            | Neutral 500 (`#55555E`)                | Neutral 300 (`#A9A8B0`)                |
| Texto desabilitado          | Neutral 300 (`#A9A8B0`)                | Neutral 500 (`#55555E`)                |
| Placeholder                 | Neutral 400 (`#7C7CB5` do protótipo)   | Neutral 400                            |

#### 2.1.3 Semânticas

| Papel        | Cor base                          | Uso                                                 |
| ------------ | --------------------------------- | --------------------------------------------------- |
| Success      | Teal 500 `#00B894`                | Toast de confirmação, badge de status positivo      |
| Warning      | Laranja 500 `#F58B00`             | Aviso de configuração pendente, alerta de estoque baixo |
| Error        | Vermelho `#E74C3C`                | Erro de validação, botão destrutivo ("Cancelar comanda", "Sair") |
| Info         | Azul `#3498DB`                    | Dica neutra, notificação informativa                |

Cada uma tem versão de fundo suave (`bg-success-soft`, `bg-warning-soft` etc.) para badges e alerts. Regra: `soft` é o hex principal com opacidade 10–15% ou o tom 50 correspondente.

#### 2.1.4 Semáforo operacional (inviolável)

Cores exclusivas da Cozinha, nunca reutilizadas em outros contextos. Aparecem em barra lateral colorida no card e no ponto do rótulo de tempo.

| Faixa   | Cor       | Uso                              |
| ------- | --------- | -------------------------------- |
| Verde   | `#00B894` (mesmo teal 500, mas rotulado como `color-kanban-green` para deixar claro que é sinal) | Card dentro do tempo confortável (≤ verde configurado em Ajustes) |
| Amarelo | `#F5A623` | Card em atenção (entre verde e limite) |
| Vermelho| `#E74C3C` | Card atrasado (acima do amarelo) |

Regra: quando o card entra em "Pronto", cronômetro congela e cor não muda mais (comportamento existente, mantido).

#### 2.1.5 Métodos de pagamento

Cores de etiqueta preservadas do sistema atual, agora com token nomeado:

| Método   | Cor de fundo (light)             | Token                        |
| -------- | -------------------------------- | ---------------------------- |
| Dinheiro | Verde suave (teal 50/100)        | `color-payment-cash`         |
| Débito   | Azul suave                       | `color-payment-debit`        |
| Crédito  | Roxo suave                       | `color-payment-credit`       |
| Pix      | Turquesa (`#00B8A9`)             | `color-payment-pix`          |
| Não informado | Cinza neutro (Neutral 200)  | `color-payment-unknown`      |

### 2.2 Gradiente atmosférico

A assinatura visual que traz o "vibe" das referências. **Não é gradiente linear chapado.** É um glow radial suave que "vaza" de um canto e se dissolve no fundo neutro. Aparece sempre no fundo da tela, camada 0, atrás de tudo.

**Light mode.** Radial gradient com origem no canto superior direito, cor de partida `#FFEBD8` (Laranja 50/100) com 60% de opacidade, dissolvendo em `#F5F5F6` (Neutral 50) até 60% do raio da tela. Do canto oposto (inferior esquerdo), um segundo glow mais fraco em `#FFF3E5` a 30% de opacidade, dissolvendo em `#F5F5F6` até 40%.

**Dark mode.** Mesma estrutura, mas cor de partida `#3A2410` (âmbar profundo) a 40% de opacidade dissolvendo em `#0D0D0F` (Neutral 900). Glow secundário `#2A1810` a 20%.

**Regra de aplicação.** Todas as telas de gestão. **Nunca na Cozinha** (a cor atrapalha a leitura do semáforo). **Nunca em modais ou drawers** (a superfície elevada é neutra, o glow fica só na tela por trás).

### 2.3 Blur e vidro (glassmorphism sutil)

Segunda assinatura das referências. Regra: **halo, não card de vidro pesado.**

Usos permitidos:
- **Overlay de modal e bottom sheet.** Camada de fundo escurecida (`rgba(0,0,0,0.4)` em light; `rgba(0,0,0,0.6)` em dark) com `backdrop-filter: blur(8px)`. Isso deixa a tela por trás "borrada e ligada", não apagada.
- **Header sticky com transparência.** Quando o usuário rola a tela e o header fixa no topo, ele ganha `background: rgba(255,255,255,0.75)` (light) ou `rgba(13,13,15,0.75)` (dark) com `backdrop-filter: blur(12px)`. Isso deixa o conteúdo "passar" por trás sem cobrir de branco chapado.
- **Bottom nav em superfícies com scroll.** Mesmo tratamento do header sticky.

Usos proibidos:
- Cards de conteúdo com fundo blur (fica ilegível em texto denso).
- Botões com fundo de vidro (perdem afordância).
- Cozinha (a leitura precisa ser 100% nítida).

### 2.4 Tipografia

**Família: Inter** (preservada do protótipo). Motivo declarado: legibilidade em interfaces digitais e alta densidade informacional. As referências (Zentro, Urbanist) usam grotescas similares — Inter atende sem retrabalho.

Escala preservada e expandida com dois níveis heróicos para números protagonistas (Chamada, tela de confirmação de pedido lançado):

| Nível         | Tamanho / Line-height | Peso            | Uso                                             |
| ------------- | --------------------- | --------------- | ----------------------------------------------- |
| Hero Number   | 96 / 104              | Bold (700)      | Senha na tela de Chamada, senha na confirmação  |
| Display Number| 60 / 72               | Bold (700)      | Faturamento gigante em telas dedicadas          |
| Display       | 32 / 40               | Bold (700)      | Título de tela ("Relatórios", "Ajustes", "Olá, Ernesto") |
| Heading 1     | 24 / 32               | Bold (700)      | Cabeçalho de seção principal ("Total do dia")   |
| Heading 2     | 20 / 28               | Semi Bold (600) | Subseção ("Pedidos recentes", "CARDÁPIO")       |
| Heading 3     | 16 / 24               | Semi Bold (600) | Título de card ("Vendas por hora", "Mais vendidos") |
| Number Highlight | 28 / 36            | Bold (700)      | Valor de destaque em card de métrica            |
| Number Compact | 20 / 28              | Bold (700)      | Preço em botão CTA, subtotal                    |
| Body          | 14 / 20               | Regular (400)   | Texto corrido, descrições                       |
| Body Medium   | 14 / 20               | Medium (500)    | Texto de botão, label de item                   |
| Small         | 12 / 16               | Regular (400)   | Rótulo secundário, timestamp                    |
| Overline      | 12 / 16               | Semi Bold (600), letter-spacing 0.08em, MAIÚSCULA | Rótulo de seção ("CARDÁPIO", "FAIXAS DE TEMPO", "SABOR KAWASHIMA") |
| Caption       | 11 / 14               | Regular (400)   | Rodapé, disclaimer                              |

**Números tabulares.** Sempre que aparecerem em coluna alinhada (tabela de mais vendidos, lista de preços), aplicar `font-variant-numeric: tabular-nums`. Sem isso, as colunas de R$ dançam.

**Rótulo do número.** Regra do protótipo mantida: número grande em cima, rótulo pequeno embaixo em Body Regular ou Small Regular. Nunca rótulo maior que o número que descreve.

### 2.5 Espaçamento

Escala base 4. Tokens `space-0` a `space-24`. Nomes ancorados em valor para o Claude Code mapear sem interpretar.

| Token       | Valor | Uso típico                                             |
| ----------- | ----- | ------------------------------------------------------ |
| `space-0`   | 0     | Reset                                                  |
| `space-1`   | 4     | Gap entre ícone e label pequeno                        |
| `space-2`   | 8     | Padding interno de badge/pill                          |
| `space-3`   | 12    | Gap entre item de lista compacta                       |
| `space-4`   | 16    | Padding padrão de card, gap entre campos de form       |
| `space-5`   | 20    | Padding vertical de botão médio                        |
| `space-6`   | 24    | Padding padrão de container mobile, gap entre cards    |
| `space-8`   | 32    | Margin entre seções em uma tela                        |
| `space-10`  | 40    | Padding vertical em headers grandes                    |
| `space-12`  | 48    | Bloco vazio entre grupos temáticos                     |
| `space-16`  | 64    | Margin entre tela e rodapé em telas curtas             |
| `space-20`  | 80    | Espaço em torno do número herói (Chamada)              |
| `space-24`  | 96    | Reserva vertical em empty states                       |

**Padding lateral de tela mobile:** `space-6` (24px) em ambos os lados. Preserva o respiro visto no protótipo.

**Grid de cards em dashboard:** 2 colunas mobile, gap `space-4` (16px), padding lateral `space-6`.

### 2.6 Radius (arredondamento)

Escala expandida. Referências mostram cards com radius alto (16–24px), o que dá o vibe premium acolhedor. Botões CTA em pill full.

| Token       | Valor | Uso                                                    |
| ----------- | ----- | ------------------------------------------------------ |
| `radius-0`  | 0     | Reset                                                  |
| `radius-xs` | 4     | Badge pequeno, checkbox                                |
| `radius-sm` | 8     | Input, select, pill de aba                             |
| `radius-md` | 12    | Botão médio, chip de item selecionado no cardápio      |
| `radius-lg` | 16    | Card padrão de conteúdo, card de métrica               |
| `radius-xl` | 20    | Card grande de destaque, card do dashboard (Caixa)     |
| `radius-2xl`| 24    | Modal, bottom sheet, drawer                            |
| `radius-full`| 9999 | Botão CTA (pill full), avatar circular, badge de senha (`039`, `042`) |

**Regra do card:** o card de conteúdo padrão usa `radius-lg` (16px). O card do dashboard (imagem 10) e o card grande de métrica em Relatórios usam `radius-xl` (20px). O card da Cozinha usa `radius-lg` (16px) mas com a barra colorida do semáforo indo até a borda esquerda (a barra respeita o radius).

**Regra do botão:** botão CTA principal (Enviar Pedido, Confirmar entrega, Adicionar) usa `radius-full` (pill). Botão secundário ghost e outline usam `radius-md`. Botão em bottom sheet segue o CTA principal (pill).

### 2.7 Sombras e elevação

Cinco níveis. Sombras sempre suaves e "levantadas" (offset y positivo pequeno, blur alto, opacidade baixa) — o card não tem borda dura, ele flutua sobre o fundo.

| Nível        | Uso                                    | Light                                        | Dark                                          |
| ------------ | -------------------------------------- | -------------------------------------------- | --------------------------------------------- |
| `shadow-0`   | Flat / rente ao fundo                  | none                                         | none                                          |
| `shadow-1`   | Card padrão                            | `0 1px 2px rgba(15,15,20,0.04), 0 4px 12px rgba(15,15,20,0.06)` | `0 1px 2px rgba(0,0,0,0.4), 0 4px 12px rgba(0,0,0,0.3)` |
| `shadow-2`   | Card interativo (hover), dropdown      | `0 4px 8px rgba(15,15,20,0.06), 0 12px 24px rgba(15,15,20,0.08)` | `0 4px 8px rgba(0,0,0,0.45), 0 12px 24px rgba(0,0,0,0.35)` |
| `shadow-3`   | Modal, bottom sheet, popover           | `0 12px 24px rgba(15,15,20,0.10), 0 32px 64px rgba(15,15,20,0.12)` | `0 12px 24px rgba(0,0,0,0.5), 0 32px 64px rgba(0,0,0,0.4)` |
| `shadow-glow`| CTA especial, hero number com aura     | `0 0 40px rgba(245,139,0,0.25)` (light) — usar com moderação | `0 0 48px rgba(245,139,0,0.35)` (dark)          |

**Regra:** em dark mode, a sombra é maior e mais opaca porque preto sobre preto exige contraste extra. Sem isso, o card "some" no fundo.

### 2.8 Motion

Durações e curvas alinhadas ao princípio "contido, não expressivo".

| Token           | Duração | Uso                                           |
| --------------- | ------- | --------------------------------------------- |
| `motion-instant`| 0ms     | Reset, mudança de estado sem transição        |
| `motion-micro`  | 150ms   | Hover de botão, foco de input, toggle         |
| `motion-short`  | 250ms   | Fade in de tooltip, expand/collapse pequeno   |
| `motion-medium` | 400ms   | Bottom sheet entrando, modal, drawer          |
| `motion-long`   | 600ms   | Skeleton pulse, transição de tela             |

**Curvas.**

| Token                   | cubic-bezier                    | Uso                                    |
| ----------------------- | ------------------------------- | -------------------------------------- |
| `easing-standard`       | `cubic-bezier(0.2, 0, 0, 1)`    | Padrão para tudo que entra na tela     |
| `easing-decelerate`     | `cubic-bezier(0, 0, 0.2, 1)`    | Elemento aparecendo (bottom sheet subindo, toast entrando) |
| `easing-accelerate`     | `cubic-bezier(0.4, 0, 1, 1)`    | Elemento saindo (modal fechando)       |
| `easing-spring-soft`    | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Check marcando, botão confirmado com pulso sutil |

**Padrões de motion nomeados** (o Claude Code implementa como preset):

- **Fade-and-shift.** Elemento entra com opacidade 0→1 + translateY 8px→0. Duração `motion-short`, `easing-decelerate`. Usado em: item de lista aparecendo, card carregando.
- **Sheet-in.** Bottom sheet sobe de baixo. `translateY(100%) → translateY(0)`, duração `motion-medium`, `easing-decelerate`. Overlay entra em paralelo com fade 0→0.4.
- **Modal-in.** Modal centralizado entra com opacidade 0→1 + scale 0.96→1. Duração `motion-short`, `easing-decelerate`.
- **Toast-in.** Toast desliza do topo com translateY(-100%)→translateY(0) + fade. Duração `motion-short`, `easing-decelerate`. Sai em `motion-short`, `easing-accelerate`.
- **Check-pulse.** Ao marcar checkbox de item entregue: scale 1→1.15→1 no ícone de check em `motion-short` com `easing-spring-soft`.
- **Semaphore-blink.** Card virando vermelho na Cozinha: barra lateral pulsa opacidade 1→0.7→1 uma única vez em `motion-medium`, então fica estática. Sinaliza a virada sem virar distração.
- **Skeleton-pulse.** Fundo do skeleton alterna opacidade 0.6→1→0.6 em `motion-long` infinito, linear.

**Regra geral.** Todo elemento que entra na tela usa `motion-short` + `easing-decelerate` como default. Só desvia se estiver na lista acima.

### 2.9 Ícones

**Biblioteca sugerida: Lucide.** Estilo line, peso 1.5–2px, cantos arredondados. Alinhado com o que já aparece no protótipo (ícone de carrinho, cozinha, alto-falante, gráfico no bottom nav).

Tamanhos:

| Token          | Valor | Uso                                          |
| -------------- | ----- | -------------------------------------------- |
| `icon-xs`      | 14    | Ícone inline em texto pequeno                |
| `icon-sm`      | 16    | Ícone em botão pequeno, badge com ícone      |
| `icon-md`      | 20    | Ícone padrão de botão, item de menu          |
| `icon-lg`      | 24    | Ícone de bottom nav, header de tela          |
| `icon-xl`      | 32    | Ícone de card de dashboard (Caixa, Cozinha, Chamada, Relatórios) |
| `icon-2xl`     | 48    | Ilustração de empty state                    |

**Regra da cor do ícone:** herda `currentColor` do container. Ícone em botão primário laranja fica branco. Ícone em card neutro fica Neutral 700. Ícone em bottom nav ativo fica Teal 700 (imagem 13 do protótipo).

### 2.10 Imagens e fotografia

O produto usa imagens em três lugares: **logo da barraca do cliente** (Ajustes → Perfil), **foto opcional de item de cardápio** (futuro, ainda não implementado — reservado no design system), e **avatar do dono** (Ajustes / Login).

Regra da foto de item: quando existir, aparece como thumb 64×64 com `radius-md` (12px) à esquerda do nome do item. Se não existir, um placeholder cinza claro (Neutral 100) com ícone genérico de prato aparece no mesmo espaço. O botão "+ Adicionar" nunca depende da foto.

Regra da logo do cliente: aparece como circle 64×64 na tela de Login (imagem 9) acima do nome do produto, e como marca circular pequena (32×32) no rodapé de telas standalone (Chamada). Fundo do container da logo: Branco puro em light, Neutral 800 em dark.

---

## 3. Componentes

Para cada componente: variantes, estados, tokens de referência. Onde há evidência direta no protótipo enviado, ela é citada.

### 3.1 Botão

**Variantes.**

| Variante   | Cor de fundo         | Cor de texto      | Radius        | Uso                                                       |
| ---------- | -------------------- | ----------------- | ------------- | --------------------------------------------------------- |
| Primary    | Laranja 500          | Branco puro       | `radius-full` | Ação de comando principal: "+ Adicionar", "Enviar Pedido", "Confirmar e enviar", "Entrar" (login) |
| Confirm    | Teal 500             | Branco puro       | `radius-full` | Confirmação positiva: "Confirmar entrega", "Mover para Pronto", "Entregar direto", "Entregar" |
| Destructive| Vermelho `#E74C3C`   | Branco puro       | `radius-full` | Ação destrutiva: "Cancelar comanda"                       |
| Outline    | transparente + borda 1.5px Teal 500 | Teal 500 | `radius-full` | Ação secundária positiva em contexto de card: "Voltar" (em card da Cozinha), "Imprimir NFe" |
| Ghost      | transparente         | Neutral 900 (light) / Branco (dark) | `radius-md` | Ação neutra: "Voltar e editar", "Cancelar" (dentro de modal) |
| Text Danger| transparente         | Vermelho `#E74C3C` | `radius-md`   | Ação destrutiva secundária em texto puro: "Cancelar comanda" no rodapé do card (imagem 13), "Sair" (Ajustes), "Encerrar sessão" (dashboard) |

**Tamanhos.**

| Tamanho | Altura | Padding horizontal | Tipografia         | Uso                                       |
| ------- | ------ | ------------------ | ------------------ | ----------------------------------------- |
| sm      | 36     | `space-4` (16)     | Body Medium (14/500) | Botão dentro de card compacto             |
| md      | 44     | `space-5` (20)     | Body Medium (14/500) | Padrão                                    |
| lg      | 52     | `space-6` (24)     | Body Medium (16/500) | CTA principal de tela (Enviar Pedido, Entrar) |
| xl      | 60     | `space-6` (24)     | Heading 3 (16/600) | Botão em bottom sheet, CTA hero           |

**Estados.**

- **Default:** cor de fundo base.
- **Hover:** fundo escurece um tom (Laranja 500 → Laranja 600 para Primary; Teal 500 → Teal 600 para Confirm). Transição `motion-micro`.
- **Focus:** anel externo de 3px na cor da variante com 30% de opacidade. `outline-offset: 2px`. Nunca substitui o fundo.
- **Active (pressionado):** scale 0.98 + fundo escurece dois tons. Duração `motion-instant`.
- **Loading:** cor de fundo mantida, texto vira spinner branco de 20×20, botão fica não-clicável. Largura do botão preservada.
- **Disabled:** opacidade 0.4, cursor not-allowed, sem hover.

**Regra do CTA em bottom sheet.** Botão principal ocupa 100% da largura menos padding lateral do sheet. Botão secundário (Cancelar em texto) fica abaixo, centrado, altura 44, ghost. Padrão visto nas imagens 1, 2, 3, 8.

### 3.2 Input de texto

**Estrutura:** label acima (Small Semi Bold, Neutral 700 em light / Neutral 300 em dark) + campo + mensagem de ajuda ou erro abaixo (Small Regular).

**Campo.**

| Propriedade | Valor                                                                |
| ----------- | -------------------------------------------------------------------- |
| Altura      | 48 (md), 40 (sm), 56 (lg)                                            |
| Padding H   | `space-4` (16)                                                       |
| Fundo       | Neutral 50 (light) / Neutral 800 (dark)                              |
| Borda       | 1.5px Neutral 200 (light) / Neutral 700 (dark)                        |
| Radius      | `radius-sm` (8)                                                      |
| Tipografia  | Body (14/400) para texto digitado, Body para placeholder             |

**Estados.**

- **Default:** conforme acima.
- **Focus:** borda vira Laranja 500, ring externo Laranja com 20% de opacidade, 3px. Fundo pode clarear ligeiramente (Branco puro em light).
- **Error:** borda vermelha, mensagem abaixo em Small Regular vermelho, ícone de erro pequeno à direita.
- **Success (raro):** borda Teal 500, ícone de check pequeno à direita.
- **Disabled:** opacidade 0.5, cursor not-allowed, fundo Neutral 100.

**Variantes de tipo.**

- **Text.** Padrão.
- **Password.** Ícone de olho à direita para toggle de visibilidade (evidência: tela de login, imagem 9).
- **Email.** Teclado tipo email em mobile.
- **Number.** Teclado numérico, alinhamento à direita quando valor monetário.
- **Currency (R$).** Prefixo "R$" à esquerda em Neutral 500. Valor à direita alinhado. Aceita vírgula ou ponto, converte para centavos (comportamento já implementado).
- **Percentage.** Sufixo "%" à direita.
- **Search.** Ícone de lupa à esquerda, botão de limpar (×) à direita quando há texto.

### 3.3 Textarea

Mesmo tratamento do input de texto, mas altura mínima de 88 (equivalente a 3 linhas) e resize apenas vertical.

**Uso principal:** campo de observação em Lançar Pedido ("sem cebola no yakisoba" — imagem 11). Contador de caracteres discreto no canto inferior direito quando limite existir.

### 3.4 Select

Aparência do input de texto + chevron à direita. Em mobile, abre nativo do sistema. Em desktop, dropdown com `shadow-2`, `radius-md`, itens 44 de altura, item ativo com fundo Neutral 50 (light) / Neutral 800 (dark) e borda esquerda 3px Laranja 500.

### 3.5 Toggle / Switch

**Forma:** pill de 44×24 (trilho). Bolinha 20×20 dentro com `radius-full` e `shadow-1`.

**Cor do trilho.**
- Ligado: Teal 500.
- Desligado: Neutral 300 (light) / Neutral 700 (dark).

**Bolinha:** sempre Branco puro. Anima com `motion-micro` + `easing-standard` ao alternar.

**Evidência:** switches de Dinheiro, Cartão, Pix em Ajustes (imagem 7); toggle "Viagem" em Lançar Pedido (imagem 11).

### 3.6 Checkbox e Radio

**Checkbox.**
- Tamanho 20×20, `radius-xs` (4).
- Não marcado: borda 1.5px Neutral 300, fundo transparente.
- Marcado: fundo Teal 500, check branco. Anima com **check-pulse** ao marcar.
- Indeterminado: fundo Teal 500, traço horizontal branco.
- Disabled: opacidade 0.4.

**Radio.**
- Tamanho 20×20, `radius-full`.
- Não marcado: borda 1.5px Neutral 300.
- Marcado: círculo interno Teal 500 preenchendo o centro (deixa 4px de espaço até a borda externa).

**Uso especial na Cozinha (imagem 1):** checkbox grande (24×24) para "item entregue", com traço no nome do item quando marcado (line-through, cor Neutral 400).

### 3.7 Card

**Card padrão.**
- Fundo: Branco puro (light) / Neutral 800 (dark).
- Radius: `radius-lg` (16).
- Padding interno: `space-4` (16) em cards compactos, `space-5` (20) em cards de destaque.
- Sombra: `shadow-1`.
- Sem borda (a sombra separa do fundo).

**Card de métrica** (dashboard Caixa, imagem 10; cards de KPI em Relatórios, imagem 6).
- Radius: `radius-xl` (20).
- Padding: `space-5` (20).
- Estrutura: ícone quadrado com fundo suave (48×48, `radius-md`, fundo Teal 50 ou Laranja 50, ícone da cor 700 correspondente) no topo esquerdo + título Body Medium abaixo + valor Number Highlight (28/700) + subtítulo Small Regular.
- Badge de notificação (número) no canto superior direito quando aplicável (evidência: badge "4" no card de Cozinha na imagem 10).

**Card de pedido — Cozinha "A Fazer"** (imagem 13).
- Radius: `radius-lg` (16).
- Barra lateral esquerda 4px de largura, cor do semáforo (verde/amarelo/vermelho), altura 100% do card, radius da barra alinhado ao radius do card (só canto esquerdo).
- Padding: `space-4` (16).
- Header do card: senha (Number Compact 20/700) + badge de tipo ("Viagem", "Mesa 4") + cronômetro à direita em cor do semáforo.
- Corpo: chips de itens com check à esquerda, fundo Teal 50, Body Medium.
- Rodapé: dois botões lado a lado — "Pronto" (Outline) e "Entregar direto" (Confirm) — + link "Cancelar" (Text Danger) abaixo, centrado.

**Card de pedido — Cozinha "Pronto"** (imagens 14 e 15).
- Mesma estrutura, mas sem barra lateral colorida (cronômetro congelado, cor não muda mais).
- Rodapé: "Voltar" (Ghost outline) + "Entregar" ou "Entregue" (Confirm).
- Timestamp "Pronto em 17:12" ou "parado em 04:10" em Body Regular, Neutral 500.

### 3.8 Modal e Bottom Sheet

**Bottom Sheet** (padrão do produto — evidência: imagens 1, 2, 3, 8).
- Sobe pela base da tela.
- Radius superior `radius-2xl` (24), inferior 0.
- Handle no topo: linha 40×4, Neutral 300, `radius-full`, centrada.
- Padding interno: `space-6` (24) laterais, `space-5` (20) vertical.
- Overlay: `rgba(0,0,0,0.4)` (light) / `rgba(0,0,0,0.6)` (dark) + `backdrop-filter: blur(8px)`.
- Motion: **Sheet-in**.
- CTA principal ocupa largura total; ação secundária (Cancelar) fica abaixo como Text button.

**Modal centralizado** (para desktop e telas maiores).
- Largura máxima 480, centrado.
- Radius `radius-2xl` (24), `shadow-3`.
- Header com título Heading 2 + botão × no canto superior direito (icon button 40×40, radius-full, hover Neutral 100).
- Padding `space-6` (24).
- Motion: **Modal-in**.

**Regra de destrutivo:** modal de confirmação de ação destrutiva usa CTA `Destructive` (vermelho) + ação de volta em Ghost (imagem 3: "Cancelar comanda" + "Cancelar").

### 3.9 Drawer (lateral)

Reservado para telas de configuração longa em versão desktop / tablet horizontal. Slide da direita, largura 480, radius 0. Overlay igual ao modal. Motion: `translateX(100%) → translateX(0)`, `motion-medium`, `easing-decelerate`.

### 3.10 Tooltip

Fundo Neutral 900 (light) / Neutral 100 (dark), texto Branco / Neutral 900, `radius-sm` (8), padding `space-2 space-3`, Small Regular, `shadow-2`. Delay de aparição 400ms. Setinha triangular direcional pequena. Motion: fade + shift 4px em `motion-short`.

### 3.11 Popover

Fundo Branco (light) / Neutral 800 (dark), `radius-lg` (16), `shadow-2`, padding `space-4`. Motion `motion-short` `easing-decelerate`.

### 3.12 Badge / Tag / Pill

**Badge de status (retangular, `radius-full`).**

| Tipo               | Fundo               | Texto               | Exemplo                       |
| ------------------ | ------------------- | ------------------- | ----------------------------- |
| Neutral            | Neutral 100         | Neutral 700         | "Mesa 4" (imagem 1, 13)       |
| Success            | Teal 50             | Teal 700            | "Online" (imagem 10)          |
| Success outline    | transparente + borda teal 500 | Teal 700   | "Tempo real" (imagens 13, 14) |
| Warning            | Laranja 50          | Laranja 700         | Cronômetro "09:47 em preparo" (imagem 1) |
| Danger             | Vermelho 50         | Vermelho 700        | Etiqueta "CANCELADO"          |
| Highlight          | Laranja 500         | Branco              | "NOVO" (evidência: Custo do dia — imagem 7) |
| Payment            | ver seção 2.1.5     | tom 700 da mesma família | "Dinheiro", "Débito", "Pix" |

**Badge de senha (quadrado preto no canto do card).** Fundo Neutral 900, texto Branco, tamanho 32×32, `radius-md` (12), tipografia Body Medium (14/500) para número de 3 dígitos. Evidência: badges "039", "038", "034" nas imagens 1, 2, 3, 8, 13, 15.

### 3.13 Chip de item selecionado

Item marcado no cardápio ganha chip com fundo Teal 50, texto Teal 700, `radius-full`, padding `space-2 space-3`, ícone de check à esquerda. Evidência: "2× Yakisoba", "1× Água" nos cards da Cozinha (imagens 13, 14, 15).

### 3.14 Avatar

Circular, `radius-full`. Tamanhos:

| Token       | Valor | Uso                                    |
| ----------- | ----- | -------------------------------------- |
| `avatar-sm` | 32    | Lista de operadores em Ajustes (futuro)|
| `avatar-md` | 40    | Header de telas                        |
| `avatar-lg` | 64    | Login (com logo da barraca)            |
| `avatar-xl` | 96    | Perfil                                 |

Fallback: iniciais em Branco sobre fundo Laranja 500 quando é usuário; Neutral 500 quando é barraca sem logo.

### 3.15 Tabs / Segmented

**Segmented control** (o padrão do produto — evidência: "A Fazer / Pronto" na Cozinha; "Hoje / Ontem / 7 dias / Data" em Relatórios).
- Trilho: fundo Neutral 100 (light) / Neutral 800 (dark), `radius-md` (12), padding `space-1` interno.
- Item ativo: fundo Branco puro (light) / Neutral 700 (dark), `radius-sm` (8), `shadow-1`, texto Body Medium Neutral 900 (light) / Branco (dark).
- Item inativo: texto Body Medium Neutral 500.
- Motion do fundo do ativo: `motion-short` `easing-standard`.
- Contador ao lado do rótulo (ex: "A Fazer · 3", "Pronto · 1") em Body Medium.

**Tabs tradicional (barra sublinhada)** — reservado para desktop, não usado em mobile no MVP.

### 3.16 Toast e Alert

**Toast.**
- Posição: topo da tela em mobile (respeitando safe area), inferior direito em desktop.
- Largura: até 400.
- Radius: `radius-lg` (16).
- Padding: `space-4`.
- `shadow-3`.
- Estrutura: ícone à esquerda (24×24, cor da semântica) + texto (Body Medium) + botão de fechar × opcional à direita.
- Duração padrão: 4000ms (success / info), 6000ms (warning), persistente até dismiss (error).
- Motion: **Toast-in** entrando, `motion-short` saindo.

Cores de fundo:
| Tipo    | Fundo (light)         | Fundo (dark)          | Ícone / Texto label |
| ------- | --------------------- | --------------------- | ------------------- |
| Success | Branco + borda Teal 200 | Neutral 800 + borda Teal 700 | Teal 500 / Teal 700 |
| Warning | Branco + borda Laranja 200 | Neutral 800 + borda Laranja 700 | Laranja 500 / Laranja 700 |
| Error   | Branco + borda Vermelho 200 | Neutral 800 + borda Vermelho 700 | Vermelho 500 / Vermelho 700 |
| Info    | Branco + borda Azul 200 | Neutral 800 + borda Azul 700 | Azul 500 / Azul 700 |

**Alert inline** (dentro do fluxo da tela, ex: "1 item sem preço" no Lançar Pedido).
- Radius: `radius-md` (12).
- Padding: `space-3 space-4`.
- Fundo: soft da semântica (Laranja 50 para warning).
- Borda esquerda 3px na cor 500 correspondente.
- Ícone + texto Body Medium.

### 3.17 Tabela (Relatórios)

Evidência: bloco "Mais vendidos" na imagem 6.

- Header em Small Semi Bold, Neutral 500, MAIÚSCULA com letter-spacing 0.05em.
- Divisor entre linhas: 1px Neutral 100.
- Linha: altura mínima 44, padding vertical `space-3`.
- Última linha (Total): peso Semi Bold, borda superior 1.5px Neutral 200, sem borda inferior.
- Alinhamento: rótulo à esquerda, número à direita, `tabular-nums` sempre.

### 3.18 Menu / Dropdown

Popover com lista de itens. Item: altura 44, padding `space-3 space-4`, ícone opcional à esquerda em `icon-sm`, label em Body Medium. Hover fundo Neutral 50 (light) / Neutral 700 (dark). Item destrutivo (Sair, Excluir) fica no fim, com divisor 1px acima, e cor de texto Vermelho.

### 3.19 Navegação

**Bottom tab bar** (evidência: imagens 11, 13, 14, 15).
- Altura: 64 + safe area inferior.
- Fundo: Branco puro (light) / Neutral 800 (dark), `backdrop-filter: blur(12px)` com transparência (`rgba(255,255,255,0.85)` / `rgba(26,26,30,0.85)`).
- Sombra superior sutil: `0 -1px 0 rgba(15,15,20,0.05)` (light).
- 4 abas: Caixa, Cozinha, Chamada, Relatórios.
- Item: ícone (`icon-lg` 24×24) + label (Caption 11/400).
- Ativo: ícone e label em Teal 700 (light) / Teal 400 (dark). Ícone com peso maior (usar Lucide fill quando disponível) ou versão preenchida.
- Inativo: Neutral 500.
- Regra: bottom nav não aparece nas telas Login, Chamada e Confirmar Pedido.
- Regra da Cozinha: badge de contagem (número em círculo) no canto superior direito do ícone Cozinha, fundo Laranja 500, texto branco.

**Header da tela.**
- Título Display (32/700) à esquerda.
- Status ou action à direita (badge "Online / Tempo real" + botão de ajustes em icon button).
- Padding: `space-6` (24) laterais, `space-5` (20) vertical.
- Divisor 1px Neutral 100 na base.
- **Header com voltar:** ícone de chevron esquerda (`icon-lg`, Teal 700) + título Display à direita do ícone, tudo alinhado à esquerda (evidência: "< Ajustes" imagem 7; "< Lançar Pedido" imagem 11; "< Confirmar pedido" imagem 12).

### 3.20 Loading e Skeleton

**Spinner.** Círculo com traço 2px, giro contínuo 800ms linear. Cor: `currentColor`. Tamanho segue o container.

**Skeleton.**
- Fundo Neutral 100 (light) / Neutral 700 (dark).
- Radius igual ao do elemento que representa.
- Animação **skeleton-pulse** (opacidade 0.6↔1 em `motion-long` infinito).
- Nunca mostrar por menos de 200ms (evita flash irritante).

**Empty state.**
- Ilustração ou ícone 48×48 (`icon-2xl`, Neutral 300).
- Título Heading 3 (16/600), Neutral 700.
- Descrição Body Regular (14/400), Neutral 500.
- CTA (opcional) em Primary abaixo.
- Centrado vertical e horizontalmente no container.

**Error state.**
- Mesma estrutura do empty state, mas ícone em Vermelho, título "Algo deu errado" + descrição concreta + botão "Tentar novamente" (Outline).

---

## 4. Padrões de layout

### 4.1 Grid e container

Mobile-first. Container principal:

- Largura máxima em mobile: 100% da viewport.
- Padding lateral: `space-6` (24).
- Padding superior (abaixo do header): `space-5` (20).
- Padding inferior (acima do bottom nav): `space-6` (24) + altura do bottom nav quando presente.

Grid de cards de dashboard: 2 colunas mobile, gap `space-4` (16).

Em desktop, container central com largura máxima 1200, padding lateral `space-8` (32). Reservado — MVP é mobile.

### 4.2 Safe areas

Respeitar `env(safe-area-inset-top)` e `env(safe-area-inset-bottom)` em todas as telas. Header adiciona ao seu padding superior; bottom nav adiciona ao seu padding inferior. Chamada em fullscreen também respeita.

### 4.3 Padrão de tela padrão (com bottom nav)

Ordem vertical: `[status bar] > [header] > [conteúdo scrollável] > [bottom nav]`. Fundo com gradiente atmosférico atrás de tudo. Header e bottom nav com blur + transparência quando o conteúdo rola por trás.

### 4.4 Dashboard — "Caixa" (imagem 10)

- Header: "Olá, [nome]" (Display 32/700) + subtitle com data (Body Regular Neutral 500). À direita: badge "Online" + botão ajustes (icon button).
- Divisor.
- Frase-comando: "O que você vai fazer agora?" (Body Regular Neutral 500).
- Grid 2×2 de cards de métrica com ícone + título + subtítulo. Cada card é clicável e leva à respectiva tela.
- Rodapé fixo: "Sabor Kawashima · Encerrar sessão" (Encerrar em Text Danger).

### 4.5 Lançar Pedido (imagem 11)

- Header com voltar + "Lançar Pedido" + badge Online à direita.
- Bloco superior: campo Mesa (opcional) + toggle Viagem lado a lado.
- Campo Observação (opcional) com botão "editar" que expande textarea.
- Divisor.
- Grid 2 colunas de cards de item do cardápio. Card: título Body Medium + preço Small Regular + botão "+ Adicionar" (Confirm sm) OU controle de quantidade (- N +) com subtotal Body Medium abaixo em Teal 700.
- Barra flutuante inferior (acima do bottom nav, fixa): fundo Teal 700 (destaque financeiro), texto Branco: "N itens selecionados" (Body Small) + "R$ XX,XX" (Number Highlight) à esquerda; botão "Ver nota →" (Confirm com fundo Teal 600 mais escuro) à direita.

### 4.6 Confirmar Pedido (imagem 12)

- Header com voltar + "Confirmar pedido" + subtitle "A senha é gerada só depois de confirmar" (Small Regular Neutral 500).
- Card "ITENS DO PEDIDO" (overline no topo): cada item com checkbox de "Entregar direto sem passar na cozinha" à esquerda, nome + subtítulo de preço unitário, valor total à direita. Divisor tracejado entre itens.
- Bloco de metadados: Mesa, Viagem, Observação. Ícone à esquerda, label em Body Medium, valor à direita.
- Total: em faixa destacada com fundo Teal 50, valor em Number Highlight Teal 700.
- Bloco "Forma de pagamento": segmented control 4 opções (Dinheiro, Débito, Crédito, Pix). Ativo com fundo Branco e ícone de check.
- CTA em coluna: "Confirmar e enviar" (Primary xl), "Entregar" (Confirm xl), "Imprimir NFe" (Outline xl), "Voltar e editar" (Ghost md), "Depois de confirmado, o pedido vai direto pra cozinha" (Caption Neutral 500).

### 4.7 Cozinha (imagens 13, 14, 15)

Regra especial: **sem gradiente atmosférico no fundo.**

- Header com "Cozinha" + badge "Tempo real" (success outline).
- Segmented "A Fazer · N / Pronto · N".
- Lista vertical de cards de pedido, gap `space-4` (16).
- Bottom nav padrão.
- Empty state em "Pronto": texto informativo "O cronômetro congela ao entrar em Pronto — a cor não muda mais, o pedido só espera o cliente" (Small Regular Neutral 500).

### 4.8 Chamada (imagens 4, 5)

Fullscreen, sem bottom nav. Duas variantes:

**Chamada padrão** (imagem 4): fundo Neutral 900. Nome da barraca no topo em Overline Laranja 500. "SENHA" (Overline Neutral 500). Número herói (Hero Number 96/700 Branco). Badge amarelo/laranja com "✓ Pedido pronto — retire no balcão". Rodapé com "CHAMADAS ANTERIORES" (Overline) e sequência de 3 senhas em opacidades decrescentes.

**Confirmação de pedido enviado** (imagem 5): fundo inteiro Teal 500. Nome da barraca em Overline Branco. "PEDIDO REALIZADO!" (Overline Branco). Número herói Branco. Badge "✓ Pedido encaminhado para a cozinha" com fundo Teal 400. Sai automaticamente após 3s ou toque.

Regra: exceção da regra "sem clicável" da Chamada — botão × discreto no canto superior direito (`icon-md` 20×20, opacidade 0.4, área de toque 44×44) para operador voltar ao Lançar Pedido. Comportamento já implementado.

### 4.9 Relatórios (imagem 6)

- Header padrão com "Relatórios" + botão "+ Exportar" (Outline sm com ícone).
- Segmented "Hoje / Ontem / 7 dias / Data".
- Grid 2×2 de KPI cards (Faturamento bruto, Lucro líquido, Comandas, Ticket médio).
- Card "Vendas por hora" com gráfico de barras (barras Teal 500 no destaque, Teal 200 nas demais; label da barra ativa em Teal 700 acima).
- Card "Mais vendidos" (tabela).
- Card "Pontos de atenção" (lista com ícone de warning / info / check).

### 4.10 Ajustes (imagem 7)

- Header com voltar + "Ajustes".
- Seções separadas por Overline + card contendo os itens da seção.
- Cardápio: lista de itens com nome + campo de preço à direita + botão "+ Novo item" no rodapé do card.
- Faixas de tempo: 3 linhas com ponto colorido (verde/amarelo/vermelho) + rótulo + campo de minutos.
- Pagamento e taxas: toggles + campos de %.
- Custo do dia: itens editáveis + total destacado no rodapé.
- Rodapé de tela: "Trocar senha" (Ghost) + "Sair" (Text Danger).

### 4.11 Login (imagem 9)

- Fullscreen com gradiente atmosférico laranja.
- Logo da barraca (avatar-lg) no centro.
- Nome do produto "MesaAgil" (Display 32/700) + subtítulo "by AIA · Automação Inteligente para Atendimento" (Body Regular Neutral 500).
- Campos E-mail e Senha (com toggle de olho).
- Link "Esqueci minha senha" alinhado à direita, Teal 700 Body Medium.
- CTA "Entrar" (Primary xl).
- Divisor "ou".
- Botão alternativo "Entrar com Face ID" (Outline lg com ícone).
- Rodapé: "Acesso restrito aos donos e operadores cadastrados" (Small Regular Neutral 500) + info da barraca (Small Regular).

### 4.12 Histórico (não visto no protótipo — inferido)

- Header "Histórico".
- Segmented igual ao de Relatórios.
- Lista de pedidos: card compacto com senha, timestamp, itens resumidos, valor total, método de pagamento (badge).
- Filtro adicional por produto (chip removível).
- Painel de relatório colapsável no topo (comportamento já implementado).

---

## 5. Tema claro vs escuro

O dark mode inverte fundo e superfície mas mantém **laranja 500 e teal 500 idênticos**. Motivo: as cores de marca são a assinatura; se mudassem entre temas, o produto teria duas identidades.

**Ajustes que mudam entre temas:**

- Fundo da tela: Neutral 50 ↔ Neutral 900.
- Superfície de card: Branco ↔ Neutral 800.
- Texto: Neutral 900 ↔ Branco (primário); Neutral 500 ↔ Neutral 300 (secundário).
- Bordas e divisores: Neutral 100 ↔ Neutral 700.
- Sombras: mais opacas em dark (ver 2.7).
- Glow atmosférico: pêssego ↔ âmbar (ver 2.2).

**Regra do toggle:** switch no rodapé de Ajustes ou em Perfil. Default: seguir preferência do sistema operacional (`prefers-color-scheme`). Persistir escolha manual em localStorage.

**Regra especial da Chamada:** já é escura por padrão em ambos os temas (imagem 4). Não segue o toggle. Motivo: contraste máximo do número da senha para leitura à distância.

---

## 6. Acessibilidade

Contraste mínimo WCAG AA em todos os textos:
- Texto normal: 4.5:1.
- Texto grande (≥18px ou ≥14px bold): 3:1.
- CTA e componentes interativos: 3:1 em relação ao fundo.

Alvos de toque mínimos 44×44. Foco visível em todos os interativos (ring de 3px na cor da variante). Nunca dependa apenas de cor para transmitir informação — o semáforo da Cozinha, por exemplo, tem cronômetro numérico ao lado da cor.

Suporte a `prefers-reduced-motion`: quando ativo, todas as durações caem para `motion-instant` exceto `motion-micro` (que fica em 100ms). Skeleton-pulse é desativado.

---

## 7. Como o Claude Code deve consumir isto

1. Ler `tokens.css` e colar em `:root` (light) e `[data-theme="dark"]` do projeto.
2. Ler `tokens.json` se o projeto usa Tailwind/style-dictionary/framework de tokens.
3. Referenciar componentes desta especificação pelo nome (ex: "Botão Primary lg", "Card de métrica", "Segmented control").
4. Aplicar o gradiente atmosférico como camada 0 de todas as telas exceto Cozinha, Chamada padrão (que já é escura absoluta), e overlays de modal.
5. Quando encontrar ambiguidade não coberta aqui, defaultar para as regras do princípio "Contido, não expressivo" e ao mnemônico "laranja comanda, teal confirma".
