-- Cardápio Digital — acrescenta contagem de "mais pedidos" (últimos 30
-- dias) pra função pública já existente, pra dar pro cliente final o mesmo
-- sinal de popularidade que o operador já vê em Lançar Pedido (chip "Mais
-- Pedidos"/"Top 1"). Calculado dentro da função SECURITY DEFINER — nunca
-- expõe a tabela pedidos/itens_do_pedido em si pra quem só está vendo o
-- cardápio, só o número agregado por item.
--
-- drop antes do create: Postgres não deixa CREATE OR REPLACE mudar o tipo
-- de retorno de uma função existente (aqui, adicionar a coluna
-- pedidos_30d) — precisa apagar a assinatura antiga primeiro.
drop function if exists public.cardapio_publico(text);

create function public.cardapio_publico(p_slug text)
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
  item_ordem int,
  pedidos_30d int
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
    i.ordem,
    coalesce(pop.total, 0)::int
  from barracas b
  join itens i on i.barraca_id = b.id and i.ativo = true
  left join categorias c on c.id = i.categoria_id
  left join (
    select ip.item_id, sum(ip.quantidade) as total
    from itens_do_pedido ip
    join pedidos p on p.id = ip.pedido_id
    where p.barraca_id = (select id from barracas where slug = p_slug)
      and p.status != 'cancelado'
      and p.criado_em >= now() - interval '30 days'
      and ip.removido = false
    group by ip.item_id
  ) pop on pop.item_id = i.id
  where b.slug = p_slug
  order by c.ordem nulls last, i.ordem;
$$;

grant execute on function public.cardapio_publico(text) to anon, authenticated;
