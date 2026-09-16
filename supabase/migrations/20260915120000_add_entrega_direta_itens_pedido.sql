-- Fase 4: suporte a "Entregar direto sem passar na cozinha" por item,
-- escolhido em Confirmar Pedido. A função criar_pedido (ver
-- supabase/functions/criar_pedido.sql) já assume essa coluna e marca
-- entregue=true/entregue_em=now() no próprio insert quando
-- entrega_direta=true — não é necessário nenhum backfill aqui, pedidos
-- existentes ficam com default false.

alter table public.itens_do_pedido
  add column entrega_direta boolean not null default false;
