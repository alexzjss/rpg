# Fundação online do RPG Codex

Este incremento adiciona autenticação sem e-mail e o primeiro schema online sem substituir ainda o IndexedDB. O app atual continua funcionando enquanto a migração é construída.

## Configuração

1. Crie um projeto gratuito no Supabase.
2. No SQL Editor, execute `supabase/migrations/001_online_foundation.sql`.
3. Na Vercel, conecte o repositório GitHub e cadastre as variáveis de `.env.example`.
4. Nunca exponha `SUPABASE_SECRET_KEY` em uma variável iniciada por `VITE_`.

## Primeiro mestre

Depois do primeiro deploy, envie uma única requisição `POST` para `/api/setup/bootstrap` contendo `setupSecret`, `campaign`, `campaignName`, `username` e `password`. `setupSecret` deve ser igual à variável protegida `SESSION_SECRET`. O endpoint deixa de funcionar assim que a primeira campanha é criada.

Depois de entrar, o mestre pode criar acessos com `POST /api/admin/accounts`, informando `username`, `password` e `characterId`. Cada personagem aceita no máximo uma conta de jogador.

O hash da senha é calculado somente no servidor; nenhuma senha em texto puro vai para o banco.

## Migração gradual

`campaign_snapshots` recebe inicialmente o snapshot versionado que o aplicativo já usa. Isso coloca persistência e sincronização online em funcionamento antes de normalizar cada domínio. Contas, sessões e solicitações de ação já ficam normalizadas por segurança e concorrência.

Antes de usar a seção Online da dashboard, execute também `supabase/migrations/002_snapshot_versioning.sql` no SQL Editor. Depois, use **Enviar dados locais** para criar a primeira cópia online sem apagar o IndexedDB.
