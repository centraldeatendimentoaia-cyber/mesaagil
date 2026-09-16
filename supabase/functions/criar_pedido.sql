-- Versão v2 (Fase 4): aceita entrega_direta por item
--
-- Mudanças em relação à versão v1:
-- 1. Aceita campo `entrega_direta` (boolean) no JSON de cada item
-- 2. Persiste esse campo em itens_do_pedido
-- 3. Marca itens com entrega_direta=true como entregues no ato
--    (entregue = true, entregue_em = now())
--
-- IMPORTANTE: p_client_uuid é `text`, não `uuid`. A coluna
-- pedidos.client_uuid no banco é text — mantido pra bater com o
-- código do frontend, que sempre enviou string.
--
-- Limpeza feita fora deste arquivo:
--   - As duas versões antigas (com metodo_pagamento default null e
--     versão original de 6 parâmetros) foram dropadas manualmente
--     via SQL no dashboard. Não deve haver duplicata deste nome.

CREATE OR REPLACE FUNCTION public.criar_pedido(
  p_barraca_id uuid,
  p_mesa text,
  p_viagem boolean,
  p_observacao text,
  p_client_uuid text,
  p_metodo_pagamento text,
  p_itens jsonb
)
RETURNS TABLE(pedido_id uuid, senha integer)
LANGUAGE plpgsql
AS $$
declare
  v_id uuid;
  v_senha int;
  v_item jsonb;
  v_entrega_direta boolean;
begin
  -- Idempotência via client_uuid (protege contra duplo toque)
  select p.id, p.senha into v_id, v_senha
    from pedidos p
   where p.client_uuid = p_client_uuid;
  if found then
    return query select v_id, v_senha;
    return;
  end if;

  insert into pedidos (
    barraca_id,
    mesa,
    viagem,
    observacao,
    client_uuid,
    metodo_pagamento
  )
  values (
    p_barraca_id,
    p_mesa,
    p_viagem,
    p_observacao,
    p_client_uuid,
    p_metodo_pagamento
  )
  returning id, pedidos.senha into v_id, v_senha;

  for v_item in select * from jsonb_array_elements(p_itens)
  loop
    v_entrega_direta := coalesce((v_item->>'entrega_direta')::boolean, false);

    insert into itens_do_pedido (
      pedido_id,
      item_id,
      nome_item,
      quantidade,
      preco_centavos_unitario,
      entrega_direta,
      entregue,
      entregue_em
    )
    values (
      v_id,
      (v_item->>'item_id')::uuid,
      v_item->>'nome_item',
      (v_item->>'quantidade')::int,
      coalesce((v_item->>'preco_centavos_unitario')::int, 0),
      v_entrega_direta,
      v_entrega_direta,           -- se entrega_direta, já nasce entregue
      case when v_entrega_direta then now() else null end
    );
  end loop;

  return query select v_id, v_senha;
end;
$$;