# MesaAgil

Sistema de comanda digital para barracas de feira e food service.
Primeiro cliente: Sabor Kawashima (comida japonesa). Segundo cliente
em prospecção: restaurante de PF.

## O que o sistema é
Substituto do papel espetado no espeto de ferro. Operador lança o
pedido, a cozinha vê em kanban, o cliente é chamado pela senha.

## O que o sistema NÃO é
Não é PDV. Não controla estoque. Não emite nota fiscal. Não processa
pagamento. A maquininha do cliente já faz isso melhor. Nunca sugira
essas funcionalidades.

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
  DELETE
- Multi-tenant: toda tabela tem barraca_id, toda query filtra por
  ele

## Regras de tema
- Cada barraca define logo, nome, cor principal e modo claro/escuro
- Tema aplicado por CSS custom properties em runtime
- Nenhuma cor escrita direto no componente, apenas variáveis CSS
- As cores do kanban (verde/amarelo/vermelho) NUNCA são
  personalizáveis — são sinal operacional
- A cor da marca nunca aparece dentro da tela da Cozinha

## Regras técnicas invioláveis
- Telas de lançar pedido e cozinha funcionam offline
- Enviar pedido é idempotente (duplo toque não cria dois pedidos)
- Nada bloqueia a operação esperando rede
- Áreas de toque de no mínimo 44px

## Stack
React + Vite + TypeScript, Tailwind CSS, Supabase (Postgres, Auth,
Realtime), deploy em Cloudflare Pages.

## Estilo
Referência: apps nativos da Apple. Fonte do sistema, cantos 16px,
sombras quase imperceptíveis, muito espaço em branco, barra de abas
na base no celular. Mobile-first — o uso real é em celular, em pé,
com uma mão só.
