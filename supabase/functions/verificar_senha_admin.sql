-- Confere o PIN administrativo digitado contra o hash guardado. Nunca
-- expõe o hash em si — só true/false.
create or replace function public.verificar_senha_admin(p_barraca_id uuid, p_pin text)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_hash text;
begin
  if not usuario_tem_acesso_barraca(p_barraca_id) then
    raise exception 'Sem acesso a esta barraca';
  end if;

  select senha_hash into v_hash
  from public.barracas_senha_admin
  where barraca_id = p_barraca_id;

  if v_hash is null then
    return false;
  end if;

  return v_hash = crypt(p_pin, v_hash);
end;
$$;

grant execute on function public.verificar_senha_admin(uuid, text) to authenticated;
