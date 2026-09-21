-- Cardápio Digital — Fase 1 (decisão de produto 2026-09-18, iniciada em
-- 2026-09-21): página pública de visualização do cardápio, sem login, um
-- link por barraca (/:slug/cardapio). Só navegação — adicionar item ao
-- carrinho não tem função ainda, de propósito (Fase 2 do roadmap).
--
-- Função dedicada em vez de abrir RLS de leitura pública em `barracas`
-- porque essa tabela carrega campos sensíveis do dono (taxa_debito_bps,
-- taxa_credito_bps — a taxa que a maquininha cobra dele, negociação
-- privada) que não devem vazar pra qualquer visitante do cardápio. A
-- função só devolve os campos que o cardápio público realmente precisa.
create or replace function public.cardapio_publico(p_slug text)
returns table(
  barraca_nome text,
  barraca_logo_url text,
  item_id uuid,
  item_nome text,
  item_descricao text,
  item_foto_url text,
  item_preco_centavos int,
  categoria_nome text,
  categoria_ordem int,
  item_ordem int
)
language sql
security definer
set search_path = public
stable
as $$
  select
    b.nome,
    b.logo_url,
    i.id,
    i.nome,
    i.descricao,
    i.foto_url,
    i.preco_centavos,
    c.nome,
    c.ordem,
    i.ordem
  from barracas b
  join itens i on i.barraca_id = b.id and i.ativo = true
  left join categorias c on c.id = i.categoria_id
  where b.slug = p_slug
  order by c.ordem nulls last, i.ordem;
$$;

grant execute on function public.cardapio_publico(text) to anon, authenticated;
