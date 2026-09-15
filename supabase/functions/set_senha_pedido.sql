-- Trigger inalterado — copia direto do estado atual do banco.
-- Gera senha sequencial por barraca por data_operacao, com lock
-- via pg_advisory_xact_lock pra evitar colisão entre pedidos
-- simultâneos.

CREATE OR REPLACE FUNCTION public.set_senha_pedido()
RETURNS trigger
LANGUAGE plpgsql
AS $$
begin
  perform pg_advisory_xact_lock(hashtext(new.barraca_id::text));

  select coalesce(max(senha), 0) + 1
    into new.senha
    from pedidos
   where barraca_id = new.barraca_id
     and data_operacao = new.data_operacao;

  return new;
end;
$$;