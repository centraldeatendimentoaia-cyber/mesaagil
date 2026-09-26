# Sai aê — Design System v1.0 (setembro 2026)

> Identidade visual do rebrand de MesaAgil para **Sai aê**, com
> reposicionamento de foco: feiras, food trucks, barracas, quiosques e
> eventos — deixando restaurante tradicional de lado (espaço já ocupado
> pelos grandes PDVs). Este documento consolida a identidade visual (IDV)
> recebida em `D:\AIA\SAIAÊ\IDV\` com o design system de referência.
>
> Status: assets reunidos, aplicação no código **ainda não iniciada**.

## Posicionamento e voz

Público: dono de barraca, food truck, lanchonete, quiosque, operação de
evento — não restaurante de mesa completo.

Tom: casual, direto, orientado à ação, sem jargão técnico.

**Fazer:**
- "Lançar pedido"
- "Pedido pronto"
- "Sem internet. O pedido fica salvo."
- "Saiaê! Senha 42"

**Não fazer:**
- "Criar nova ordem"
- "Status atualizado com sucesso!"
- "Erro 503: falha na requisição"
- "Notificar cliente"

## Paleta de cores

**Cores principais:**

| Nome | Hex | Uso |
|---|---|---|
| Mostarda 500 | `#FFC21A` | Cor primária da marca |
| Tinta 900 | `#18171C` | Texto e fundos escuros |
| Papel 50 | `#F6F5F2` | Fundo claro |
| Branco | `#FFFFFF` | Superfícies |

**Escala Mostarda:**
50 `#FFF8E1` · 100 `#FFEDB3` · 200 `#FFE080` · 300 `#FFD34D` · 400 `#FFCA33` · 500 `#FFC21A` · 600 `#E6A800` · 700 `#B38300` · 800 `#805E00` · 900 `#4D3800`

**Escala Tinta/Neutros:**
0 `#FFFFFF` · 50 `#F6F5F2` · 100 `#ECEAE6` · 200 `#D9D7DC` · 300 `#B5B3BB` · 400 `#8A8893` · 500 `#5E5C66` · 600 `#45434D` · 700 `#2E2C35` · 800 `#232229` · 900 `#18171C`

**Contraste (WCAG AA):**
- Tinta sobre branco: 11:1 ✓
- Branco sobre tinta: 1,6:1 ✗
- Mostarda sobre branco: 11:1 ✓
- Regra: texto sobre mostarda é sempre tinta, nunca branco.

**Cores operacionais** (equivalente ao verde/amarelo/vermelho do kanban
atual do MesaAgil — continuam não-personalizáveis, são sinal
operacional, e nunca aparecem como cor de marca dentro da tela da
Cozinha):

| Estado | Cor | Fundo | Texto |
|---|---|---|---|
| No prazo (verde) | `#1FBF6A` | `#E3F7EC` | `#0E7A40` |
| Atenção (laranja) | `#FF8A1C` | `#FFF0E0` | `#A34E00` |
| Atrasado (vermelho) | `#F0412F` | `#FDE7E4` | `#B22514` |
| Info (azul) | `#2F7BF5` | `#E6F0FE` | `#1A4FA8` |

Cronômetro de cozinha: 0–7min no prazo, 7–12min atenção, +12min atrasado.

## Tipografia

Substitui Hanken Grotesk + Space Grotesk do MesaAgil atual.

- **Outfit** (display): títulos e números — pesos 600, 700, 800
- **Figtree** (corpo/interface): pesos 400, 500, 600, 700

| Estilo | Tamanho/altura | Peso |
|---|---|---|
| display-xl | 64px / 1.05 | Outfit 800 |
| display | 48px / 1.1 | Outfit 800 |
| h1 | 36px / 1.15 | Outfit 700 |
| h2 | 28px / 1.2 | Outfit 700 |
| h3 | 22px / 1.25 | Outfit 700 |
| h4 | 18px / 1.35 | Figtree 700 |
| body-lg | 18px / 1.6 | Figtree 400 |
| body | 16px / 1.55 | Figtree 400 |
| body-sm | 14px / 1.5 | Figtree 500 |
| caption | 12px / 1.4 | Figtree 700, +8% tracking |

Casos especiais: senha na TV em Outfit 800 a 200px; preços com "R$" em
tamanho menor e peso mais leve que o valor.

## Logo

Assets já copiados para [public/brand/](../../public/brand/) (fonte
original em `D:\AIA\SAIAÊ\IDV\`, mantida como backup):

| Arquivo | Tamanho | Composição | Uso recomendado |
|---|---|---|---|
| `saiae-icone-cor.svg` (Group 10) | 196×196 | Ícone/símbolo, fundo mostarda, forma em contorno tinta (stroke) | Ícone de app padrão, superfícies claras |
| `saiae-icone-solido.svg` (Group 11) | 196×196 | Ícone/símbolo, fundo mostarda, forma sólida em tinta com detalhe vazado em mostarda | Alto contraste / favicon pequeno |
| `saiae-icone-branco.svg` (Group 12) | 108×105 | Ícone/símbolo em contorno mostarda, sem fundo (transparente) | Sobre fundos escuros (tinta) |
| `saiae-logo-cor.svg` (Group 13) | 273×164 | Logotipo horizontal completo (ícone + wordmark), tons mostarda/tinta/papel | Versão principal colorida — fundos claros/brancos |
| `saiae-logo-branco.svg` (Group 14) | 273×164 | Logotipo horizontal completo, ícone em contorno mostarda + wordmark mostarda/papel | Versão para fundos escuros (tinta) |
| `saiae-wordmark-horizontal.svg` (Group 15) | 224×72 | Wordmark isolado (sem ícone), papel + mostarda | Uso horizontal compacto sobre fundo escuro |
| `saiae-wordmark-empilhado.svg` (Group 16) | 165×129 | Wordmark empilhado (duas linhas), papel + mostarda | Espaços quadrados/compactos (avatar, splash) |

Ainda faltam (não vieram na IDV): uma imagem `-og` (para
Open Graph/Twitter card, equivalente a `mesaagil-og.png`) e versões
`.png` rasterizadas dos ícones para os tamanhos de PWA
(`public/icons/*-192.png`, `*-512.png`, `apple-touch-icon.png`) e para
o Capacitor (`resources/icon.png`, `resources/splash.png`) — os SVGs
atuais servem bem pra web, mas essas etapas específicas exigem export
em PNG.

**Regras:**
- Respiro mínimo = altura do "a"
- Tamanhos mínimos: 96px (logo), 16px (símbolo)
- "sai" e "aê" sempre com peso ou cor diferente entre si
- **Não fazer:** esticar, trocar cor fora da paleta, igualar "sai" e "aê", girar

## Espaçamento

Base 4px. Escala: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 96, 128 (128 só
entre seções de página de vendas).

Touch target mínimo: 48px (o MesaAgil atual usa 44px como regra
invíolavel — ao aplicar este design system, manter o maior dos dois,
48px). Produto no caixa: 88px de altura.

## Cantos e sombras

- xs: 6px · sm: 10px · md: 14px · lg: 20px
- **Canto balão** (assinatura da marca): `20 20 20 4` — usar em toasts,
  senha, tooltip, etiquetas

## Ícones

Material Symbols Rounded, peso 500, tamanho padrão 24px. Preenchido =
estado ativo.

Ícones-chave: `receipt_long` (Pedidos), `skillet` (Cozinha), `campaign`
(Senha), `point_of_sale` (Caixa), `bar_chart` (Relatório), `storefront`
(Barraca), `qr_code_2` (Pix), `payments` (Dinheiro), `credit_card`
(Cartão), `timer` (Tempo), `check_circle` (Pronto), `takeout_dining`
(Viagem).

Status do pedido: `fiber_new` (Novo), `skillet` (Preparando),
`check_circle` (Pronto), `done_all` (Entregue), `cancel` (Cancelado).

## Componentes de UI

### Botões

Tamanhos: sm 36px · md 48px · lg 56px · xl (caixa) 64px.

Estados: normal, hover (mostarda 400), pressionado (scale 0.97), foco
(anel 3px), salvando (loading), desativado (opacidade 40%).

Regra: **um primário por tela**. Mostarda chama atenção — se tudo é
mostarda, nada se destaca.

### Campos de entrada

Nome do cliente, buscar produto (ícone search), valor recebido,
WhatsApp, chave Pix, categoria, observação do pedido. Foco: borda tinta
+ anel mostarda. Estados: válido, inválido, opcional.

### Seleção

- Segmentado: Balcão / Viagem (`storefront` / `takeout_dining`)
- Checkbox: com queijo, sem cebola, esgotado
- Radio: pequeno, médio, grande
- Toggle: som, imprimir, delivery
- Pagamento: Pix, Dinheiro, Débito, Crédito

### Cards

**Card de pedido (Cozinha, tema escuro):** timer com status
(prazo/atenção/atrasado), número do pedido, tipo (balcão/viagem), lista
de itens com quantidades, observações (`sticky_note_2`), botões: Pronto
(mostarda, ação principal) / Entregar direto (contorno) / Cancelar
(link discreto).

**Card de produto (Caixa):** nome e preço, controles remove/quantidade/add.

### Chips e etiquetas

Chips de categoria: Todos, Pastéis, Bebidas, Doces, + Adicionar
categoria. Etiqueta destaque: `star` (Mais vendido), Novo.

### Avisos e notificações

- `check_circle`: "Saiaê! Senha 042. Pedido pronto e chamado na TV"
- `wifi_off`: "Sem internet. O pedido fica salvo e sobe quando voltar."
- `error`: "Pagamento recusado. Tente outro cartão ou Pix."

### Navegação

Barra inferior do app: `receipt_long` (Pedidos), `skillet` (Cozinha),
`campaign` (Senha), `bar_chart` (Relatório). Abas horizontais: Hoje,
Semana, Mês.

## Tela de senha (TV)

`campaign` + texto "Senha chamada 042. Pode retirar!". Últimas senhas
exibidas (041, 040, 039, 038). Tamanho mínimo: 15% da altura da tela.
Animação: pisca 3× com efeito "dlim". Legibilidade a 8 metros de
distância.

## Página de vendas (institucional)

Seções alternam fundo papel/branco, 1 seção em destaque (tinta),
chamada final em mostarda, 96px entre seções.

- Headline: "Para feira, food truck e lanchonete. Sem papel, sem
  grito, sem pedido esquecido."
- Subheadline: "Lança no caixa, aparece na cozinha e chama a senha na
  TV. Tudo na tela, na ordem certa."
- CTA principal: "Testar 3 dias grátis" · secundário: "Ver como
  funciona" (`play_circle`)

Planos (referência de IDV — não confundir com o roadmap de assinatura
do MesaAgil, que segue "só depois que o produto estiver 100%
pronto/estável"):
- Barraca: R$ 49/mês (1 barraca, caixa/cozinha/senha, relatório)
- Pro: R$ 89/mês (várias barracas, tudo do Barraca, suporte WhatsApp)

## Assets e tokens

Fonte de origem da IDV: `D:\AIA\SAIAÊ\IDV\` (SVGs dos logos) + paleta
"Mostarda" (`#FFC21A` / `#18171C` / `#F6F5F2`).

Ao aplicar no código, os tokens substituem
[src/styles/tokens.css](../../src/styles/tokens.css) (hoje
`mesa-orange-*`/`mesa-teal-*`) — decisão de manter ou não os nomes de
token atuais fica para quando a aplicação começar, já que trocar todos
os nomes exige tocar em cada componente que os referencia.
