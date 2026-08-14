# Coffee Car — Gestão

Plataforma interna para organizar tudo do negócio do carrinho de café: eventos e fechamento
financeiro, custos e insumos, financeiro (conta corrente entre contas/pessoas), staff/diárias e
contas a pagar/receber.

Já vem com os dados que levantamos até agora: os eventos **SPIW 2026**, **Adapta Summit** e
**NBA**, o catálogo de insumos da planilha oficial, e a equipe.

## Login

| Usuário | E-mail | Senha temporária |
|---|---|---|
| Vitória (admin) | `prod.vitoriaoliveira@gmail.com` | `cafe2026!` |
| Douglas (sócio) | `douglas@coffeecar.local` | `cafe2026!` |
| Team (sócio) | `team@coffeecar.local` | `cafe2026!` |

**Troque essas senhas assim que possível** (por ora não existe tela de "trocar senha" — veja a
seção [Criar/editar usuários](#criaredit​ar-usuários) para atualizar direto no banco). Os e-mails
do Douglas e do Team são placeholders — troque pelos e-mails reais deles do mesmo jeito.

## Como rodar localmente

Pré-requisitos: Node.js 22 ou mais novo (usa o driver SQLite nativo do Node, sem instalar nada
além disso).

```bash
npm install
npm run seed     # popula o banco com os dados iniciais (só roda se o banco estiver vazio)
npm run dev       # http://localhost:3000
```

Para rodar como em produção localmente:

```bash
npm run build
npm start
```

## Stack e por que não tem Prisma

- **Next.js 16** (App Router, Server Actions) + **React 19** + **Tailwind CSS 4**.
- **Autenticação**: NextAuth v5 (credenciais/e-mail+senha, sessão em JWT).
- **Banco de dados**: SQLite via `node:sqlite`, o driver nativo do Node (disponível desde o Node
  22, sem dependências externas). Preferimos essa opção a um ORM como o Prisma de propósito: ORMs
  desse tipo baixam um binário de motor de banco durante a instalação/build, o que pode falhar em
  ambientes com rede restrita (foi exatamente o que aconteceu ao montar este projeto) e também
  complica um pouco o deploy em alguns provedores serverless. Com `node:sqlite` não existe esse
  risco — funciona em qualquer lugar que rode Node 22+.
- Toda a camada de acesso a dados está em `lib/db.ts` (conexão + schema) e `lib/repo.ts` (funções
  de leitura/escrita usadas pelas páginas e Server Actions).

Se no futuro o time crescer muito e SQLite deixar de ser suficiente (múltiplos servidores
escrevendo ao mesmo tempo, por exemplo), a migração natural é trocar `lib/db.ts`/`lib/repo.ts`
por um client de Postgres (ex.: `pg` ou `postgres.js`) — o resto do app (páginas, Server Actions)
não precisa mudar, porque só fala com `lib/repo.ts`.

## Publicando o site (deploy)

O jeito mais simples é o **Railway** (tem plano gratuito de teste e suporta disco persistente,
necessário porque o banco é um arquivo SQLite):

1. Crie uma conta em [railway.app](https://railway.app).
2. Instale a CLI: `npm i -g @railway/cli`
3. Na pasta do projeto: `railway login` e depois `railway init` (crie um projeto novo).
4. Adicione um **Volume** ao serviço (Railway → seu serviço → Settings → Volumes) montado em
   `/app/data`, e configure a variável de ambiente `DATABASE_URL=file:/app/data/coffee-car.db`
   (Settings → Variables).
5. Configure também `AUTH_SECRET` com um valor aleatório longo — gere um com
   `openssl rand -base64 32`.
6. Rode `railway up` para enviar o código e fazer o deploy.
7. Depois do primeiro deploy, rode a semeadura uma única vez direto no servidor:
   `railway run npm run seed`.
8. Gere um domínio público em Settings → Networking → "Generate Domain".

Alternativas equivalentes: **Render** ou **Fly.io** (ambos têm disco persistente em planos
gratuitos/baratos). Evite plataformas serverless "sem disco" (como o plano padrão da Vercel) já
que o arquivo do SQLite precisa persistir entre requisições — se quiser usar Vercel no futuro, é
o momento de trocar para Postgres (veja a seção acima).

## Criar/editar usuários

Ainda não existe uma tela de administração de usuários. Para adicionar, editar ou trocar a senha
de alguém, rode um script pontual (ajuste os dados e rode com `npx tsx`):

```ts
// scripts/add-user.ts (crie este arquivo, rode com `npx tsx scripts/add-user.ts` e apague depois)
import "dotenv/config";
import bcrypt from "bcryptjs";
import { createUser } from "../lib/repo";

const passwordHash = await bcrypt.hash("SENHA-NOVA-AQUI", 10);
createUser({ name: "Nome da pessoa", email: "email@exemplo.com", passwordHash, role: "SOCIO" });
console.log("Usuário criado.");
```

## Estrutura do projeto

```
app/                   páginas (App Router) — uma pasta por módulo
  dashboard/            resumo geral
  eventos/               lista, criação e detalhe (receita, custos, staff, sócios) de cada evento
  insumos/               catálogo de insumos e custo unitário
  financeiro/             contas e movimentações (conta corrente)
  staff/                  funcionários e diárias
  contas-a-pagar/         obrigações pendentes/pagas
  contas-a-receber/       recebimentos pendentes/recebidos
lib/
  db.ts                  conexão SQLite + schema das tabelas
  repo.ts                 todas as funções de leitura/escrita no banco
  calc.ts                 cálculo de totais de evento (receita, custos, resultado, margem)
  actions/                Server Actions (o que os formulários chamam ao salvar)
scripts/
  seed.ts                 popula o banco com os dados iniciais do negócio
  e2e-smoke.mjs           teste de ponta a ponta opcional (veja abaixo)
auth.ts / proxy.ts        autenticação (NextAuth) e proteção de rotas
```

## Testar de ponta a ponta (opcional)

Existe um script que abre o site num navegador headless e testa login, navegação e os
formulários principais. Não é necessário para rodar o site, só é útil se você (ou alguém
mexendo no código) quiser verificar que nada quebrou:

```bash
npm install -D playwright
npm start &            # em outro terminal, ou rode `npm run dev`
node scripts/e2e-smoke.mjs
```

## Dúvidas de negócio já documentadas no sistema

Alguns dados foram estimados ou têm lacunas conhecidas — estão anotados nas "Observações" de
cada evento/insumo dentro do próprio app:

- Divisão percentual de lucro entre sócios no evento SPIW não foi informada.
- Datas de trabalho da equipe no evento NBA são uma estimativa (01–13/08).
- Taxa de repasse específica do evento NBA não foi informada (usamos 35% como padrão).
- Custo de Pistache e de Pó/Grão de café não constavam na planilha oficial de custos.
- Tamanho da embalagem de leite zero lactose foi assumido em 1L.
