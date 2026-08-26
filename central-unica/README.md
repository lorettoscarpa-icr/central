# Central Única · Loretto Scarpa

A nova central da loja: um único aplicativo reunindo os painéis de Vendas & Operação,
Estoque, Financeiro & RH e Marketing — sem iframes e sem repositórios separados.

- **Design**: vindo do Claude Design (`Central Única.dc.html`) — paleta verde-oliva,
  Taviraj + Readex Pro, temas claro e escuro.
- **Stack**: Next.js (App Router) · Supabase (dados, login, permissões) · Vercel (hospedagem).

## Rodar localmente

```bash
npm install
npm run dev
```

## Publicar no Vercel

1. Importe este repositório no Vercel e defina **Root Directory = `central-unica`**.
2. Configure as variáveis do `.env.example` (Supabase) quando o banco for criado.
3. Sem as variáveis, o app roda em modo demonstração com dados de exemplo.

## Estrutura

- `lib/registry.js` — registro único de braços e módulos (a ordem do menu nasce aqui).
- `components/Shell.jsx` — casco: sidebar, topbar, tema, navegação mobile.
- `app/[braco]/[modulo]/` — rota de cada módulo; Entregas já implementada, demais em construção.
- `app/organizacao/` — Organização & Cadastros (pessoas, setores e hierarquia por aba).
