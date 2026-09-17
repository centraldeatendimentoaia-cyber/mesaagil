-- Define (ou redefine) o PIN administrativo de 4 dígitos da barraca.
-- O PIN em texto puro nunca é persistido — só o hash bcrypt (pgcrypto).
create or replace function public.definir_senha_admin(p_barraca_id uuid, p_pin text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not usuario_tem_acesso_barraca(p_barraca_id) then
    raise exception 'Sem acesso a esta barraca';
  end if;

  if p_pin !~ '^[0-9]{4}$' then
    raise exception 'PIN precisa ter exatamente 4 dígitos';
  end if;

  insert into public.barracas_senha_admin (barraca_id, senha_hash, atualizado_em)
  values (p_barraca_id, crypt(p_pin, gen_salt('bf')), now())
  on conflict (barraca_id)
  do update set senha_hash = excluded.senha_hash, atualizado_em = now();
end;
$$;

grant execute on function public.definir_senha_admin(uuid, text) to authenticated;
