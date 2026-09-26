-- Assinatura via Kirvano + teste grátis de 7 dias (ver
-- docs/kirvano-assinatura-trial.md). Fonte da verdade do acesso é o
-- banco, nunca o relógio do celular nem o redirecionamento pós-checkout
-- — só o webhook (ou o cron de segurança) muda status.
--
-- Assinatura é por DONO (usuario_id), não por barraca: o limite "1
-- barraca no Essencial" só faz sentido por dono, e um funcionário que
-- opera a barraca de outra pessoa é liberado/bloqueado pelo status do
-- dono da barraca, nunca pelo próprio usuário.

-- ---------------------------------------------------------------------
-- Tabelas
-- ---------------------------------------------------------------------

create table if not exists public.assinaturas (
  usuario_id uuid primary key references auth.users(id) on delete cascade,
  status text not null default 'trialing'
    check (status in ('trialing', 'active', 'past_due', 'canceled', 'expired')),
  plan text check (plan in ('essencial', 'pro')),
  cycle text check (cycle in ('mensal', 'anual')),
  trial_ends_at timestamptz,
  current_period_end timestamptz,
  grace_until timestamptz,
  kirvano_customer_email text,
  kirvano_sale_id text,
  kirvano_offer_id text,
  canceled_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.assinaturas enable row level security;

create policy "dono ve a propria assinatura"
on public.assinaturas for select
to authenticated
using (usuario_id = auth.uid());

-- Log que nunca é apagado (mesmo se a conta for excluída) — garante 1
-- trial por e-mail. Telefone fica pra uma v2, se precisar reforçar.
create table if not exists public.contas_trial_usadas (
  email_lower text primary key,
  primeiro_trial_em timestamptz not null default now()
);

alter table public.contas_trial_usadas enable row level security;
-- sem policies: ninguém lê/escreve direto, só a trigger abaixo (SECURITY DEFINER)

-- Config de cada oferta Kirvano → plano/ciclo/link de checkout. offer_id
-- fica null até o primeiro evento de teste confirmar o campo certo no
-- payload (ver processar_webhook_kirvano); até lá, os 4 links abaixo já
-- funcionam pra tela /assinar, só a leitura automática do webhook por
-- offer_id que fica pendente de preencher.
create table if not exists public.assinatura_ofertas (
  id uuid primary key default gen_random_uuid(),
  plano text not null check (plano in ('essencial', 'pro')),
  ciclo text not null check (ciclo in ('mensal', 'anual')),
  checkout_url text not null unique,
  offer_id text unique,
  ativo boolean not null default true,
  unique (plano, ciclo)
);

alter table public.assinatura_ofertas enable row level security;
-- sem policies: só lê via ofertas_publicas() (SECURITY DEFINER)

insert into public.assinatura_ofertas (plano, ciclo, checkout_url) values
  ('essencial', 'mensal', 'https://pay.kirvano.com/83b4bb2a-4004-41dc-bb3f-c76ef27856ee'),
  ('essencial', 'anual',  'https://pay.kirvano.com/3a01dd0a-cd26-4367-87d6-727ac6cc04b4'),
  ('pro',       'mensal', 'https://pay.kirvano.com/a566f40c-6b60-459d-bc9e-259476c9f03b'),
  ('pro',       'anual',  'https://pay.kirvano.com/0c85f948-b1df-45e4-8ecd-3eadc380ee5f')
on conflict (plano, ciclo) do update set checkout_url = excluded.checkout_url;

-- Log bruto + idempotência de cada evento recebido da Kirvano.
create table if not exists public.eventos_webhook_kirvano (
  id uuid primary key default gen_random_uuid(),
  dedupe_key text not null unique,
  event text,
  sale_id text,
  payload jsonb not null,
  error text,
  received_at timestamptz not null default now()
);

alter table public.eventos_webhook_kirvano enable row level security;
-- sem policies: só a função de processamento grava/lê

-- Token compartilhado com o painel da Kirvano (Integrações → Webhook).
-- Gerado abaixo; pegue o valor rodando
--   select token from public.configuracao_webhook_kirvano;
-- no SQL Editor e cole no painel da Kirvano.
create table if not exists public.configuracao_webhook_kirvano (
  id boolean primary key default true,
  token text not null,
  constraint configuracao_webhook_kirvano_singleton check (id)
);

alter table public.configuracao_webhook_kirvano enable row level security;
-- sem policies: ninguém lê pela API, nem anon nem authenticated

insert into public.configuracao_webhook_kirvano (id, token)
values (true, encode(gen_random_bytes(24), 'hex'))
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- Backfill — clientes que já existiam antes desta migration (Sabor
-- Kawashima incluída) nascem com status 'active' pra não travar do nada
-- assim que a checagem de assinatura entrar em vigor.
-- ---------------------------------------------------------------------

insert into public.assinaturas (usuario_id, status, plan)
select distinct ub.usuario_id, 'active', 'pro'
from public.usuarios_barracas ub
where ub.papel = 'dono'
on conflict (usuario_id) do nothing;

-- ---------------------------------------------------------------------
-- Trigger: nasce o trial no cadastro (auth.users), não na criação da
-- barraca — a conta já existe antes de ter barraca.
-- ---------------------------------------------------------------------

create or replace function public.criar_assinatura_trial()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email_lower text := lower(new.email);
  v_ja_teve_trial boolean;
begin
  select exists(
    select 1 from public.contas_trial_usadas where email_lower = v_email_lower
  ) into v_ja_teve_trial;

  if v_ja_teve_trial then
    insert into public.assinaturas (usuario_id, status, plan, trial_ends_at)
    values (new.id, 'expired', 'pro', now())
    on conflict (usuario_id) do nothing;
  else
    insert into public.assinaturas (usuario_id, status, plan, trial_ends_at)
    values (new.id, 'trialing', 'pro', now() + interval '7 days')
    on conflict (usuario_id) do nothing;

    insert into public.contas_trial_usadas (email_lower)
    values (v_email_lower)
    on conflict (email_lower) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_assinatura on auth.users;
create trigger on_auth_user_created_assinatura
  after insert on auth.users
  for each row execute function public.criar_assinatura_trial();

-- ---------------------------------------------------------------------
-- hasAccess — sempre compara contra o timestamp atual, nunca depende do
-- cron já ter rodado (a coluna status é só pra exibição/relatório).
-- ---------------------------------------------------------------------

create or replace function public.assinatura_tem_acesso(
  p_assinatura public.assinaturas,
  p_now timestamptz default now()
)
returns boolean
language sql
stable
as $$
  select case p_assinatura.status
    when 'trialing' then p_assinatura.trial_ends_at is not null and p_now < p_assinatura.trial_ends_at
    when 'active'   then true
    when 'past_due' then p_assinatura.grace_until is not null and p_now < p_assinatura.grace_until
    when 'canceled' then p_assinatura.current_period_end is not null and p_now < p_assinatura.current_period_end
    else false
  end;
$$;

-- Resolve o dono da barraca e checa o acesso dele. SECURITY DEFINER
-- porque quem chama (inclusive um funcionário) pode não ter permissão de
-- ler a linha de assinaturas do dono diretamente.
create or replace function public.barraca_assinatura_ativa(p_barraca_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select public.assinatura_tem_acesso(a, now())
      from public.usuarios_barracas ub
      join public.assinaturas a on a.usuario_id = ub.usuario_id
      where ub.barraca_id = p_barraca_id
        and ub.papel = 'dono'
      limit 1
    ),
    false
  );
$$;

create index if not exists idx_usuarios_barracas_barraca_dono
  on public.usuarios_barracas (barraca_id, papel);

-- RPC pro front: status/plano/dias restantes da barraca pelo slug. Só
-- devolve algo se quem chama tiver acesso a essa barraca.
create or replace function public.assinatura_da_barraca(p_slug text)
returns table(
  status text,
  plano text,
  ciclo text,
  tem_acesso boolean,
  dias_restantes_trial integer,
  trial_ends_at timestamptz,
  current_period_end timestamptz,
  eh_dono boolean
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_barraca_id uuid;
  v_dono_id uuid;
  v_assinatura public.assinaturas;
begin
  select id into v_barraca_id from public.barracas where slug = p_slug;
  if v_barraca_id is null then
    raise exception 'Barraca não encontrada';
  end if;

  if not public.usuario_tem_acesso_barraca(v_barraca_id) then
    raise exception 'Sem acesso a esta barraca';
  end if;

  select ub.usuario_id into v_dono_id
    from public.usuarios_barracas ub
   where ub.barraca_id = v_barraca_id and ub.papel = 'dono'
   limit 1;

  if v_dono_id is null then
    -- não deveria acontecer (toda barraca nasce com dono via
    -- criar_barraca), mas não trava o app se acontecer
    return query select 'active'::text, 'pro'::text, null::text, true, null::integer,
      null::timestamptz, null::timestamptz, false;
    return;
  end if;

  select * into v_assinatura from public.assinaturas where usuario_id = v_dono_id;

  return query select
    v_assinatura.status,
    v_assinatura.plan,
    v_assinatura.cycle,
    public.assinatura_tem_acesso(v_assinatura, now()),
    case
      when v_assinatura.status = 'trialing' and v_assinatura.trial_ends_at is not null
        then greatest(0, ceil(extract(epoch from (v_assinatura.trial_ends_at - now())) / 86400))::integer
      else null
    end,
    v_assinatura.trial_ends_at,
    v_assinatura.current_period_end,
    (v_dono_id = auth.uid());
end;
$$;

grant execute on function public.assinatura_da_barraca(text) to authenticated;

-- RPC pra tela "Minha assinatura" — a própria linha de quem chama.
-- SECURITY INVOKER de propósito: a policy de select acima já resolve.
create or replace function public.minha_assinatura()
returns public.assinaturas
language sql
stable
as $$
  select * from public.assinaturas where usuario_id = auth.uid();
$$;

grant execute on function public.minha_assinatura() to authenticated;

-- RPC pra tela /assinar e pro popup de paywall listarem os planos.
create or replace function public.ofertas_publicas()
returns table(plano text, ciclo text, checkout_url text)
language sql
stable
security definer
set search_path = public
as $$
  select plano, ciclo, checkout_url
  from public.assinatura_ofertas
  where ativo
  order by plano, ciclo;
$$;

grant execute on function public.ofertas_publicas() to authenticated;

-- ---------------------------------------------------------------------
-- Webhook da Kirvano — único portão de verdade. Valida o token contra
-- configuracao_webhook_kirvano (não a partir do caller — a anon key é
-- pública, então a proteção real tem que estar aqui dentro).
--
-- ⚠️ A CONFIRMAR com um evento de teste real da Kirvano: os nomes exatos
-- dos eventos de reembolso e cancelamento de assinatura. Usei
-- SALE_REFUNDED/REFUND e SUBSCRIPTION_CANCELED/SALE_CANCELED como
-- palpite — ajuste esses nomes (função CREATE OR REPLACE, sem migration
-- nova) assim que um evento real chegar em eventos_webhook_kirvano.
-- ---------------------------------------------------------------------

create or replace function public.processar_webhook_kirvano(p_payload jsonb, p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_token_ok boolean;
  v_event text := p_payload->>'event';
  v_sale_id text := p_payload->>'sale_id';
  v_dedupe_key text;
  v_inserido boolean;
  v_usuario_id uuid;
  v_email text := nullif(lower(p_payload#>>'{customer,email}'), '');
  v_offer_id text := p_payload#>>'{products,0,offer_id}';
  v_next_charge text := p_payload#>>'{plan,next_charge_date}';
  v_created_at text := p_payload->>'created_at';
  v_oferta public.assinatura_ofertas;
  v_assinatura public.assinaturas;
  v_period_end timestamptz;
begin
  select exists(select 1 from public.configuracao_webhook_kirvano where token = p_token)
    into v_token_ok;

  if not v_token_ok then
    raise exception 'Token inválido';
  end if;

  v_dedupe_key := coalesce(v_event, 'evento_desconhecido') || ':' || coalesce(v_sale_id, gen_random_uuid()::text);

  insert into public.eventos_webhook_kirvano (dedupe_key, event, sale_id, payload)
  values (v_dedupe_key, v_event, v_sale_id, p_payload)
  on conflict (dedupe_key) do nothing
  returning true into v_inserido;

  if not coalesce(v_inserido, false) then
    return jsonb_build_object('ok', true, 'duplicado', true);
  end if;

  -- acha a conta: utm.src (usuario_id) → e-mail
  v_usuario_id := nullif(p_payload#>>'{utm,src}', '')::uuid;

  if v_usuario_id is null and v_email is not null then
    select id into v_usuario_id from auth.users where lower(email) = v_email limit 1;
  end if;

  if v_usuario_id is null then
    update public.eventos_webhook_kirvano set error = 'conta_nao_encontrada' where dedupe_key = v_dedupe_key;
    return jsonb_build_object('ok', true, 'erro', 'conta_nao_encontrada');
  end if;

  select * into v_assinatura from public.assinaturas where usuario_id = v_usuario_id for update;
  if not found then
    insert into public.assinaturas (usuario_id, status, plan, trial_ends_at)
    values (v_usuario_id, 'expired', 'pro', now())
    returning * into v_assinatura;
  end if;

  -- proteção de ordem: evento mais antigo que o último update não rebaixa status
  if v_created_at is not null
     and v_event in ('SALE_REFUSED', 'SALE_CHARGEBACK', 'SALE_REFUNDED', 'REFUND')
     and (v_created_at)::timestamptz < v_assinatura.updated_at then
    update public.eventos_webhook_kirvano set error = 'evento_fora_de_ordem_ignorado' where dedupe_key = v_dedupe_key;
    return jsonb_build_object('ok', true, 'ignorado', 'fora_de_ordem');
  end if;

  select * into v_oferta from public.assinatura_ofertas where offer_id = v_offer_id;

  if v_event = 'SALE_APPROVED' then
    v_period_end := coalesce(
      nullif(v_next_charge, '')::timestamptz,
      now() + case when v_oferta.ciclo = 'anual' then interval '12 months' else interval '1 month' end
    );
    update public.assinaturas set
      status = 'active',
      plan = coalesce(v_oferta.plano, plan, 'pro'),
      cycle = coalesce(v_oferta.ciclo, cycle),
      current_period_end = v_period_end,
      kirvano_customer_email = v_email,
      kirvano_sale_id = v_sale_id,
      kirvano_offer_id = v_offer_id,
      grace_until = null,
      canceled_at = null,
      updated_at = now()
    where usuario_id = v_usuario_id;

  elsif v_event = 'SALE_REFUSED' and p_payload->>'type' = 'RECURRING' and v_assinatura.status = 'active' then
    update public.assinaturas set
      status = 'past_due',
      grace_until = now() + interval '3 days',
      updated_at = now()
    where usuario_id = v_usuario_id;

  elsif v_event = 'SALE_REFUSED' then
    null; -- 1ª compra recusada: nada muda (continua trial ou expired)

  elsif v_event = 'SALE_CHARGEBACK' then
    update public.assinaturas set status = 'expired', updated_at = now() where usuario_id = v_usuario_id;

  elsif v_event in ('SALE_REFUNDED', 'REFUND') then
    update public.assinaturas set status = 'expired', updated_at = now() where usuario_id = v_usuario_id;

  elsif v_event in ('SUBSCRIPTION_CANCELED', 'SALE_CANCELED') then
    update public.assinaturas set
      status = 'canceled',
      canceled_at = now(),
      updated_at = now()
    where usuario_id = v_usuario_id;

  else
    null; -- PIX_GENERATED / PIX_EXPIRED / BANK_SLIP_* / desconhecido: só loga (já gravado acima)
  end if;

  return jsonb_build_object('ok', true);
end;
$$;

grant execute on function public.processar_webhook_kirvano(jsonb, text) to anon;

-- ---------------------------------------------------------------------
-- Cron de segurança (roda a cada hora): expira quem passou do prazo, e
-- rebaixa pra past_due uma assinatura "active" que não renovou — rede de
-- segurança caso um webhook se perca. A leitura de acesso (acima) já
-- funciona certo sem isso; isto é só pra manter a coluna status e os
-- relatórios corretos.
-- ---------------------------------------------------------------------

create or replace function public.expirar_assinaturas_job()
returns void
language sql
security definer
set search_path = public
as $$
  update public.assinaturas
     set status = 'expired', updated_at = now()
   where (status = 'trialing' and trial_ends_at < now())
      or (status = 'past_due' and grace_until < now())
      or (status = 'canceled' and current_period_end < now());

  update public.assinaturas
     set status = 'past_due', grace_until = now() + interval '3 days', updated_at = now()
   where status = 'active'
     and current_period_end is not null
     and current_period_end < now() - interval '2 days';
$$;

-- Se pg_cron não estiver disponível no plano do projeto, este bloco
-- falha sozinho e pode ser comentado — a Fase A funciona igual, só essa
-- rede de segurança específica (active sem renovar → past_due) fica
-- pendente até habilitar a extensão.
create extension if not exists pg_cron with schema extensions;

delete from cron.job where jobname = 'expirar-assinaturas-mesaagil';
select cron.schedule(
  'expirar-assinaturas-mesaagil',
  '0 * * * *',
  $$select public.expirar_assinaturas_job()$$
);

-- ---------------------------------------------------------------------
-- RLS extra em pedidos/itens_do_pedido: bloqueio real no servidor pra
-- novos pedidos quando a assinatura da barraca não está ativa. Leitura
-- nunca é afetada — dado não some, só trava lançar pedido novo.
-- RESTRICTIVE porque as policies permissivas existentes continuam
-- valendo; esta é uma condição A MAIS, não substitui nada.
-- ---------------------------------------------------------------------

drop policy if exists "assinatura da barraca precisa estar ativa pra novos pedidos" on public.pedidos;
create policy "assinatura da barraca precisa estar ativa pra novos pedidos"
on public.pedidos as restrictive
for insert
to authenticated
with check (public.barraca_assinatura_ativa(barraca_id));

drop policy if exists "assinatura da barraca precisa estar ativa pra novos itens" on public.itens_do_pedido;
create policy "assinatura da barraca precisa estar ativa pra novos itens"
on public.itens_do_pedido as restrictive
for insert
to authenticated
with check (
  exists (
    select 1 from public.pedidos p
    where p.id = itens_do_pedido.pedido_id
      and public.barraca_assinatura_ativa(p.barraca_id)
  )
);
