-- Foto e descrição por item do cardápio — usados hoje em Lançar Pedido
-- (ajuda o operador a não errar o item) e reaproveitados mais pra frente
-- no cardápio público voltado pro cliente final (roadmap).
alter table public.itens
  add column if not exists foto_url text,
  add column if not exists descricao text;

-- Bucket público: a foto precisa carregar em Lançar Pedido sem exigir
-- autenticação de leitura (mesma lógica de qualquer imagem estática do
-- app). Upload/edição continua restrito a quem tem acesso à barraca.
insert into storage.buckets (id, name, public)
values ('cardapio-fotos', 'cardapio-fotos', true)
on conflict (id) do nothing;

-- Caminho do objeto: {barraca_id}/{item_id}-{timestamp}.jpg — o primeiro
-- segmento do path é o barraca_id, checado via usuario_tem_acesso_barraca
-- (mesma função já usada nas policies de itens/pedidos/categorias).
create policy "leitura publica de fotos do cardapio"
on storage.objects for select
to public
using (bucket_id = 'cardapio-fotos');

create policy "donos enviam fotos do cardapio de suas barracas"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'cardapio-fotos'
  and usuario_tem_acesso_barraca(((storage.foldername(name))[1])::uuid)
);

create policy "donos atualizam fotos do cardapio de suas barracas"
on storage.objects for update
to authenticated
using (
  bucket_id = 'cardapio-fotos'
  and usuario_tem_acesso_barraca(((storage.foldername(name))[1])::uuid)
);

create policy "donos apagam fotos do cardapio de suas barracas"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'cardapio-fotos'
  and usuario_tem_acesso_barraca(((storage.foldername(name))[1])::uuid)
);
