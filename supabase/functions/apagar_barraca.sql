-- Apagar barraca: ação irreversível de dono, disparada pela lixeira na tela
-- "Qual barraca?" (SelecionarBarraca). Apaga a barraca e TUDO que pertence a
-- ela — pedidos, cardápio, categorias, custos diários, senha administrativa
-- e o vínculo de acesso de todo mundo. Diferente da remoção lógica de item
-- de comanda ativa: aqui é DELETE físico de propósito, mesma linha de
-- raciocínio de "Apagar período" em Histórico, só que da barraca inteira.
--
-- SECURITY DEFINER pra poder apagar de tabelas que não têm policy de delete
-- pra usuário comum (ex.: barracas_senha_admin, que não tem nenhuma policy
-- de client). Deleta em ordem explícita de dependência em vez de confiar em
-- ON DELETE CASCADE já configurado ou não em cada tabela.
create or replace function public.apagar_barraca(p_barraca_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Não autenticado';
  end if;

  if not exists (
    select 1 from public.usuarios_barracas
    where barraca_id = p_barraca_id
      and usuario_id = auth.uid()
      and papel = 'dono'
  ) then
    raise exception 'Só o dono da barraca pode apagá-la';
  end if;

  delete from public.itens_do_pedido
  where pedido_id in (select id from public.pedidos where barraca_id = p_barraca_id);

  delete from public.pedidos where barraca_id = p_barraca_id;
  delete from public.itens where barraca_id = p_barraca_id;
  delete from public.categorias where barraca_id = p_barraca_id;
  delete from public.custos_diarios where barraca_id = p_barraca_id;
  delete from public.barracas_senha_admin where barraca_id = p_barraca_id;
  delete from public.usuarios_barracas where barraca_id = p_barraca_id;
  delete from public.barracas where id = p_barraca_id;
end;
$$;

grant execute on function public.apagar_barraca(uuid) to authenticated;
