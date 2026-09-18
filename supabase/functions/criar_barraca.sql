-- Onboarding self-service: qualquer usuário autenticado pode criar sua
-- própria barraca e vira "dono" dela automaticamente — sem isso, cada
-- barraca nova precisava ser inserida manualmente no Supabase pela equipe.
-- SECURITY DEFINER de propósito: não existe usuario_tem_acesso_barraca pra
-- checar aqui, porque a barraca ainda não existe (bootstrapping). A única
-- exigência é estar autenticado (auth.uid() não nulo).
create or replace function public.criar_barraca(p_nome text, p_slug text)
returns public.barracas
language plpgsql
security definer
set search_path = public
as $$
declare
  v_nome text := trim(p_nome);
  v_slug text := trim(p_slug);
  v_barraca public.barracas;
begin
  if auth.uid() is null then
    raise exception 'Não autenticado';
  end if;

  if v_nome = '' then
    raise exception 'Nome da barraca não pode ser vazio';
  end if;

  if v_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' then
    raise exception 'Endereço inválido — use só letras minúsculas, números e hífen';
  end if;

  if exists (select 1 from public.barracas where slug = v_slug) then
    raise exception 'Esse endereço já está em uso';
  end if;

  insert into public.barracas (
    nome, slug, modo, verde_ate, amarelo_ate, metodos_pagamento_ativos
  )
  values (
    v_nome, v_slug, 'claro', 15, 30,
    '["dinheiro", "debito", "credito", "pix"]'::jsonb
  )
  returning * into v_barraca;

  insert into public.usuarios_barracas (usuario_id, barraca_id, papel)
  values (auth.uid(), v_barraca.id, 'dono');

  return v_barraca;
end;
$$;

grant execute on function public.criar_barraca(text, text) to authenticated;
