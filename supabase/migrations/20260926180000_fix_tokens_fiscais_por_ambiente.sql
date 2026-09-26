-- Correção: a FocusNFe emite DOIS tokens por empresa, um por ambiente
-- (token_homologacao e token_producao no schema EmpresaResponse deles) —
-- não um token único reaproveitado com URL diferente, como a migração
-- anterior (20260926150000_add_fiscal.sql) assumiu. Confirmado com a UI
-- de um concorrente que já implementou (dois campos de token separados)
-- e com a doc da FocusNFe. Nenhuma barraca configurou token ainda
-- (feature lançada há poucas horas), então é seguro renomear em vez de
-- migrar dado.
alter table public.barracas_fiscal_token rename column token to token_homologacao;
alter table public.barracas_fiscal_token add column token_producao text;

drop function if exists definir_token_fiscal(uuid, text);
drop function if exists token_fiscal_configurado(uuid);

create or replace function definir_token_fiscal(p_barraca_id uuid, p_ambiente text, p_token text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not usuario_tem_acesso_barraca(p_barraca_id) then
    raise exception 'sem acesso a esta barraca';
  end if;

  if p_ambiente not in ('homologacao', 'producao') then
    raise exception 'ambiente inválido: %', p_ambiente;
  end if;

  insert into barracas_fiscal_token (barraca_id, token_homologacao, token_producao, atualizado_em)
  values (
    p_barraca_id,
    case when p_ambiente = 'homologacao' then p_token else null end,
    case when p_ambiente = 'producao' then p_token else null end,
    now()
  )
  on conflict (barraca_id) do update set
    token_homologacao = case when p_ambiente = 'homologacao' then p_token else barracas_fiscal_token.token_homologacao end,
    token_producao = case when p_ambiente = 'producao' then p_token else barracas_fiscal_token.token_producao end,
    atualizado_em = now();
end;
$$;

create or replace function token_fiscal_configurado(p_barraca_id uuid)
returns table (homologacao boolean, producao boolean)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not usuario_tem_acesso_barraca(p_barraca_id) then
    raise exception 'sem acesso a esta barraca';
  end if;

  return query
    select
      coalesce((select token_homologacao is not null from barracas_fiscal_token where barraca_id = p_barraca_id), false),
      coalesce((select token_producao is not null from barracas_fiscal_token where barraca_id = p_barraca_id), false);
end;
$$;
