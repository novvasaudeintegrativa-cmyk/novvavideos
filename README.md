# Novva Videos

Plataforma própria de vídeos interativos (upload, player, CTAs temporizados, embed e analytics), inspirada em funcionalidades públicas de ferramentas como o Vturb — código e arquitetura próprios.

## Stack

- **Next.js 15** (App Router, TypeScript)
- **Supabase** — Postgres, Auth e Storage (thumbnails)
- **Cloudflare R2** — armazenamento dos arquivos de vídeo (S3-compatible, sem custo de egress)
- **Tailwind CSS**
- **Vercel** — hospedagem

## Rodando localmente

```bash
npm install
cp .env.local.example .env.local   # preencha com as credenciais do Supabase e do R2
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

## Variáveis de ambiente

Veja [.env.local.example](.env.local.example). Em produção (Vercel), configure as mesmas variáveis em **Project Settings → Environment Variables**:

| Variável | Onde encontrar |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API Keys (Publishable key) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API Keys (Secret key) — **nunca** exponha no navegador |
| `NEXT_PUBLIC_SITE_URL` | URL pública da aplicação (ex: `https://seu-projeto.vercel.app`) |
| `R2_ACCOUNT_ID` | Cloudflare dashboard → R2 → o ID aparece na URL do endpoint S3 |
| `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` | Cloudflare → R2 → Manage API Tokens → Create API Token (Object Read & Write) |
| `R2_BUCKET_NAME` | Nome do bucket criado no R2 |

**Por que Supabase Storage não guarda os vídeos**: o plano Free do Supabase tem um limite fixo de 50MB por arquivo (não configurável), inviável para vídeo. Os arquivos de vídeo ficam no R2; thumbnails (imagens pequenas) continuam no Storage do Supabase.

## Banco de dados

As migrations SQL ficam em [supabase/migrations/](supabase/migrations/) e devem ser rodadas em ordem no **SQL Editor** do Supabase (ou via `supabase db push` se estiver usando a CLI).

## Estrutura

- `src/app/(login|signup|dashboard)` — autenticação e área logada
- `src/app/demo` — modo demonstração com dados fictícios, sem login
- `src/app/p/[videoId]` — player público (sem login)
- `src/app/api/stream/[videoId]` — rota que serve o arquivo de vídeo (Range/206, URL assinada do R2 gerada só no backend)
- `src/lib/supabase` — clients Supabase (browser, server, admin) e middleware de sessão
- `src/lib/r2.ts` — geração de URLs assinadas (upload/download) e exclusão de objetos no R2
- `src/lib/video-validation.ts` — validação client-side do arquivo de vídeo (extensão, MIME, codec, canplay)
- `src/middleware.ts` — protege rotas autenticadas e renova sessão (exclui rotas públicas do player/streaming)

## Status

- Fase 1: autenticação, workspaces isolados por RLS.
- Fase 2: biblioteca de vídeos (CRUD, thumbnail, busca/filtros, organização por projeto).
- Fase 3: upload real de vídeo com validação (extensão/MIME/codec/canplay), armazenamento no R2 e reprodução via rota segura com suporte a Range.

Próxima fase: player público completo (controles customizados, CTAs).
