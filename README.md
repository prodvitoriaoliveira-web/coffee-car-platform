# Coffee Car — Gestão

Plataforma interna para organizar tudo do negócio do carrinho de café: eventos e fechamento financeiro, custos e insumos, financeiro (conta corrente entre contas/pessoas), staff/diárias e contas a pagar/receber.

**Site publicado:** https://coffee-car-platform.onrender.com

Já vem com os dados que levantamos até agora: os eventos SPIW 2026, Adapta Summit e NBA, o catálogo de insumos da planilha oficial, e a equipe.

## Login

| Usuário | E-mail | Senha temporária |
| --- | --- | --- |
| Vitória (admin) | prod.vitoriaoliveira@gmail.com | cafe2026! |
| Douglas (sócio) | douglas@coffeecar.local | cafe2026! |
| Team (sócio) | team@coffeecar.local | cafe2026! |

Troque essas senhas assim que possível (por ora não existe tela de "trocar senha" — veja a seção Criar/editar usuários para atualizar direto no banco). Os e-mails do Douglas e do Team são placeholders — troque pelos e-mails reais deles do mesmo jeito.

## Como rodar localmente

Pré-requisitos: Node.js 20+ e uma conta no [Turso](https://turso.tech) (banco gratuito, veja abaixo).

```
npm install
cp .env.example .env # preencha TURSO_DATABASE_URL, TURSO_AUTH_TOKEN e AUTH_SECRET
npm run seed # popula o banco com os dados iniciais (só roda se o banco estiver vazio)
npm run dev # http://localhost:3000
```

Para rodar como em produção localmente:

```
npm run build
npm start
```

## Stack

- Next.js 16 (App Router, Server Actions) + React 19 + Tailwind CSS 4.
- Autenticação: NextAuth v5 (credenciais/e-mail+senha, sessão em JWT). A proteção de rotas fica em `proxy.ts` (Next 16 renomeou "Middleware" para "Proxy").
- Banco de dados: [Turso](https://turso.tech) (SQLite hospedado, compatível com libSQL), acessado via `@libsql/client`. Trocamos de `node:sqlite` (arquivo local) para isso porque hospedagens grátis (Render, Railway free, etc.) têm filesystem efêmero — os dados seriam perdidos a cada "dormida"/redeploy do servidor. O Turso resolve isso com um banco de verdade, acessível pela rede, com camada grátis generosa e sem cartão de crédito.
- Hospedagem: [Render](https://render.com) (plano free, sem cartão de crédito), deploy automático a cada push na branch `main`.
- Toda a camada de acesso a dados está em `lib/db.ts` (conexão + schema) e `lib/repo.ts` (funções de leitura/escrita usadas pelas páginas e Server Actions).

## Publicando o site (deploy)

O site já está publicado no Render, com deploy automático a cada push na branch `main`. Para recriar do zero em outra conta:

1. Crie um banco no [Turso](https://turso.tech) (`turso db create coffeecar`) e gere um token de acesso (`turso db tokens create coffeecar`).
2. Crie um Web Service no [Render](https://dashboard.render.com/web/new) apontando para este repositório, runtime Node.
3. Build command: `npm install && npm run build`. Start command: `npm run start -- -p $PORT`.
4. Configure as variáveis de ambiente: `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` e `AUTH_SECRET` (gere um valor aleatório longo com `openssl rand -base64 32`).
5. Depois do primeiro deploy, a semeadura roda automaticamente na primeira requisição a qualquer página que acesse o banco (schema é criado sob demanda) — só falta popular os dados iniciais, o que já foi feito nesta instância. Para uma instância nova, rode `npm run seed` localmente apontando `TURSO_DATABASE_URL`/`TURSO_AUTH_TOKEN` para o banco de produção.

## Criar/editar usuários

Ainda não existe uma tela de administração de usuários. Para adicionar, editar ou trocar a senha de alguém, rode um script pontual localmente (apontando para o banco de produção) e apague depois:

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

- `app/` páginas (App Router) — uma pasta por módulo
  - `dashboard/` resumo geral
  - `eventos/` lista, criação e detalhe (receita, custos, staff, sócios) de cada evento
  - `insumos/` catálogo de insumos e custo unitário
  - `financeiro/` contas e movimentações (conta corrente)
  - `staff/` funcionários e diárias
  - `contas-a-pagar/` obrigações pendentes/pagas
  - `contas-a-receber/` recebimentos pendentes/recebidos
- `lib/`
  - `db.ts` conexão Turso/libSQL + schema das tabelas
  - `repo.ts` todas as funções de leitura/escrita no banco
  - `calc.ts` cálculo de totais de evento (receita, custos, resultado, margem)
  - `actions/` Server Actions (o que os formulários chamam ao salvar)
- `scripts/`
  - `seed.ts` popula o banco com os dados iniciais do negócio
  - `e2e-smoke.mjs` teste de ponta a ponta opcional (veja abaixo)
- `auth.ts` / `proxy.ts` autenticação (NextAuth) e proteção de rotas

## Testar de ponta a ponta (opcional)

Existe um script que abre o site num navegador headless e testa login, navegação e os formulários principais. Não é necessário para rodar o site, só é útil se você (ou alguém mexendo no código) quiser verificar que nada quebrou:

```
npm install -D playwright
npm start & # em outro terminal, ou rode `npm run dev`
node scripts/e2e-smoke.mjs
```

## Dúvidas de negócio já documentadas no sistema

Alguns dados foram estimados ou têm lacunas conhecidas — estão anotados nas "Observações" de cada evento/insumo dentro do próprio app:

- Divisão percentual de lucro entre sócios no evento SPIW não foi informada.
- Datas de trabalho da equipe no evento NBA são uma estimativa (01–13/08).
- Taxa de repasse específica do evento NBA não foi informada (usamos 35% como padrão).
- Custo de Pistache e de Pó/Grão de café não constavam na planilha oficial de custos.
- Tamanho da embalagem de leite zero lactose foi assumido em 1L.
