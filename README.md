# Novva Videos

Plataforma própria de vídeos interativos (upload, player, CTAs temporizados, embed e analytics), inspirada em funcionalidades públicas de ferramentas como o Vturb — código e arquitetura próprios.

## Stack

- **Next.js 15** (App Router, TypeScript)
- **Supabase** — Postgres, Auth e Storage
- **Tailwind CSS**
- **Vercel** — hospedagem

## Rodando localmente

```bash
npm install
cp .env.local.example .env.local   # preencha com as credenciais do seu projeto Supabase
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

## Banco de dados

As migrations SQL ficam em [supabase/migrations/](supabase/migrations/) e devem ser rodadas em ordem no **SQL Editor** do Supabase (ou via `supabase db push` se estiver usando a CLI).

## Estrutura

- `src/app/(login|signup|dashboard)` — autenticação e área logada
- `src/app/demo` — modo demonstração com dados fictícios, sem login
- `src/lib/supabase` — clients Supabase (browser, server, admin) e middleware de sessão
- `src/middleware.ts` — protege rotas autenticadas e renova sessão

## Status

Fase 1 concluída: autenticação, workspaces isolados por RLS e bucket de storage privado para vídeos. Próxima fase: biblioteca de vídeos (upload, validação, player).
