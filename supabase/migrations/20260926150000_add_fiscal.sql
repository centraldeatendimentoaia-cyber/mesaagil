-- Fiscal: configuração (token FocusNFe, regime, ambiente) + campos por
-- item (NCM/CFOP/unidade) — CLAUDE.md, roadmap de 2026-09-26. Emissão de
-- verdade fica pra uma rodada seguinte; aqui só guarda o necessário pra
-- configurar com calma antes de qualquer chamada real à SEFAZ.
alter table public.barracas
  add column fiscal_habilitado boolean not null default false,
  add column fiscal_regime_tributario text check (fiscal_regime_tributario in ('simples_nacional', 'mei')),
  add column fiscal_ambiente text not null default 'homologacao' check (fiscal_ambiente in ('homologacao', 'producao'));

-- Token da FocusNFe — mesmo padrão de barracas_senha_admin: RLS ligado,
-- sem NENHUMA policy (só acesso via função SECURITY DEFINER), nunca
-- lido de volta pelo client.
create table public.barracas_fiscal_token (
  barraca_id uuid primary key references public.barracas(id) on delete cascade,
  token text not null,
  atualizado_em timestamptz not null default now()
);

alter table public.barracas_fiscal_token enable row level security;

create or replace function definir_token_fiscal(p_barraca_id uuid, p_token text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not usuario_tem_acesso_barraca(p_barraca_id) then
    raise exception 'sem acesso a esta barraca';
  end if;

  insert into barracas_fiscal_token (barraca_id, token, atualizado_em)
  values (p_barraca_id, p_token, now())
  on conflict (barraca_id) do update set token = excluded.token, atualizado_em = now();
end;
$$;

create or replace function token_fiscal_configurado(p_barraca_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not usuario_tem_acesso_barraca(p_barraca_id) then
    raise exception 'sem acesso a esta barraca';
  end if;

  return exists (select 1 from barracas_fiscal_token where barraca_id = p_barraca_id);
end;
$$;

-- Campos fiscais por item do cardápio — nullable, preenchidos aos
-- poucos pelo dono, produto por produto.
alter table public.itens
  add column ncm text,
  add column cfop text,
  add column unidade_comercial text;
