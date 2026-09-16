-- Trigger de geração automática de senha por barraca por data_operacao.
--
-- Mudança em relação à versão v1:
-- Pula geração de senha quando o pedido já nasce com status='entregue'
-- (caso de pedido 100% entrega direta pelo balcão — não precisa chamar
-- cliente, senha fica NULL).

CREATE OR REPLACE FUNCTION public.set_senha_pedido()
RETURNS trigger
LANGUAGE plpgsql
AS $$
begin
  -- Pula geração de senha se o pedido já nasce entregue
  -- (caso de pedido 100% entrega direta pelo balcão)
  if new.status = 'entregue' then
    new.senha := null;
    return new;
  end if;

  perform pg_advisory_xact_lock(hashtext(new.barraca_id::text));

  select coalesce(max(senha), 0) + 1
    into new.senha
    from pedidos
   where barraca_id = new.barraca_id
     and data_operacao = new.data_operacao;

  return new;
end;
$$;