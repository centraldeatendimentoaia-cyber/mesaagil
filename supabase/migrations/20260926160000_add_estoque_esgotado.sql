-- Estoque (versão simples decidida em 2026-09-26, CLAUDE.md): toggle
-- "esgotado" por item, sem baixa automática por venda. Dono liga/
-- desliga em Ajustes; Lançar Pedido bloqueia adicionar item esgotado.
alter table public.itens
  add column esgotado boolean not null default false;
