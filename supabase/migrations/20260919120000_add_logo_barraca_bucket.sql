-- Bucket pra logo da barraca — coluna barracas.logo_url já existe desde o
-- início, mas nunca teve upload de verdade: só dava pra setar direto no
-- banco. Mesmo padrão de cardapio-fotos (leitura pública, escrita
-- restrita por usuario_tem_acesso_barraca), caminho do objeto é
-- {barraca_id}/logo-{timestamp}.jpg.
insert into storage.buckets (id, name, public)
values ('logo-barraca', 'logo-barraca', true)
on conflict (id) do nothing;

create policy "leitura publica de logo da barraca"
on storage.objects for select
to public
using (bucket_id = 'logo-barraca');

create policy "donos enviam logo da propria barraca"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'logo-barraca'
  and usuario_tem_acesso_barraca(((storage.foldername(name))[1])::uuid)
);

create policy "donos atualizam logo da propria barraca"
on storage.objects for update
to authenticated
using (
  bucket_id = 'logo-barraca'
  and usuario_tem_acesso_barraca(((storage.foldername(name))[1])::uuid)
);

create policy "donos apagam logo da propria barraca"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'logo-barraca'
  and usuario_tem_acesso_barraca(((storage.foldername(name))[1])::uuid)
);
