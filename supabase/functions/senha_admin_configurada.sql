-- Diz se a barraca já tem um PIN administrativo configurado, sem expor
-- o hash — usado pelo client pra decidir entre a tela de "criar senha"
-- (primeiro acesso) e a de "digitar senha" (gate normal).
create or replace function public.senha_admin_configurada(p_barraca_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not usuario_tem_acesso_barraca(p_barraca_id) then
    raise exception 'Sem acesso a esta barraca';
  end if;

  return exists (
    select 1 from public.barracas_senha_admin where barraca_id = p_barraca_id
  );
end;
$$;

grant execute on function public.senha_admin_configurada(uuid) to authenticated;
