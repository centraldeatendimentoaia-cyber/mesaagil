-- Observação por item, além da observação geral do pedido que já existia
-- (pedidos.observacao). Decisão de produto 2026-09-18: o texto livre de
-- "sem cebola"/"sem gergelim" etc. fica mais útil preso ao item específico
-- (a cozinha vê a restrição junto do prato certo) do que solto no pedido
-- inteiro — mas o campo geral continua existindo pra recado que não é de
-- um item só (ex.: "cliente com pressa", "vai retirar às 20h").
alter table public.itens_do_pedido
  add column if not exists observacao text;
