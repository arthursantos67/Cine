# CinePrime

Sistema completo de reserva de ingressos de cinema — backend REST em Node.js/Express e frontend web em Next.js.

---

## Funcionalidades

### Para usuários

- Catálogo de filmes com banner de destaque, filmes em cartaz, pré-venda e em breve
- Detalhes do filme: sinopse, elenco, diretor, classificação etária e sessões disponíveis
- Seleção de sessão com filtro por data e badges de formato (3D, IMAX, Legendado, Dublado, Pré-estreia)
- Mapa de assentos interativo com estados visuais: disponível, selecionado, ocupado e acessível
- Reserva temporária de assentos com contador regressivo de 15 minutos
- Seleção de tipo de ingresso por assento: inteira ou meia-entrada (50% de desconto)
- Checkout com seleção de forma de pagamento: Cartão de Crédito ou PIX
- Tela de confirmação com código do ingresso
- Área "Meus Ingressos" com filtro por sessões futuras ou passadas
- Avaliações de filmes com meia-estrela (0,5 a 5,0) e votos de utilidade nas reviews
- Interesse em filmes em breve (contador público + ação autenticada)
- Suporte a múltiplos idiomas via `Accept-Language` (pt-BR, en-US, es-ES)

### Para administradores

- Gerenciamento de gêneros com suporte a tradução automática
- Gerenciamento de filmes: criação com importação via TMDB, edição de todos os campos incluindo classificação etária e URL de spotlight
- Gerenciamento de salas: tipo de experiência, nome de exibição e descrição
- Editor de layout de sala: adicionar fileiras via wizard em lote e fileira acessível PCD com pares cadeira + acompanhante
- Gerenciamento de sessões: preço base, formato de áudio/projeção, tipo de sessão e replicação em múltiplas datas
- Configuração de preço por tipo de sala (Standard, VIP, Premium, IMAX) com multiplicador de fim de semana
- Gerenciamento de usuários (Master): promover/rebaixar papel (Staff/Master), log de auditoria de permissões, exclusão de contas

---

## Tecnologias

| Camada | Tecnologia |
|---|---|
| Backend | Node.js 20 · Express 4 · MongoDB (Mongoose 8) |
| Autenticação | JWT via `jsonwebtoken` |
| Banco de dados | MongoDB Atlas |
| Validação | Zod |
| API docs | OpenAPI 3 · Swagger UI via `swagger-ui-express` |
| Frontend | Next.js 15 (App Router) · TypeScript · Tailwind CSS v4 |
| Testes frontend | Node.js test runner + tsx · Playwright (E2E) |
| Infraestrutura | Docker · Docker Compose · GitHub Actions CI · Render |

---

## Estrutura do repositório

```
cineprime/
├── node-backend/     Node.js API — rotas, controllers, models, Dockerfile
├── frontend/         Next.js app — páginas, componentes, API client, Dockerfiles
├── docker-compose.yml
├── render.yaml
└── product-requirements-document.md
```

---

## Como rodar localmente

### Pré-requisitos

- Docker e Docker Compose instalados

### 1. Configurar variáveis de ambiente

```bash
cp .env.example .env
cp node-backend/.env.example node-backend/.env
```

Edite `node-backend/.env` com sua URI do MongoDB Atlas e segredos JWT.

**Token TMDB para importação de filmes**

Usuários com role `master` podem configurar o token TMDB diretamente pelo painel em `/admin/` — o valor fica salvo no banco e nunca é exposto no browser. Também pode ser passado via variável de ambiente no frontend.

### 2. Subir o stack completo

```bash
docker compose up --build
```

### Serviços disponíveis

| Serviço | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000/api/v1 |
| Swagger UI | http://localhost:8000/api/docs |
| Health check | http://localhost:8000/health |

### Comandos úteis

```bash
# Rodar seed do banco (dados de exemplo)
docker compose exec backend npm run seed

# Testes do frontend (fora do Docker)
cd frontend && npm ci && npm run test

# Build de produção do frontend
cd frontend && npm run build
```

---

## Variáveis de ambiente — Backend (`node-backend/.env`)

| Variável | Descrição |
|---|---|
| `PORT` | Porta do servidor (padrão: `8000`) |
| `MONGODB_URI` | URI de conexão com o MongoDB Atlas |
| `JWT_SECRET` | Segredo para tokens de acesso (mín. 32 chars) |
| `JWT_EXPIRES_IN` | Expiração do access token (ex: `1d`) |
| `JWT_REFRESH_SECRET` | Segredo para refresh tokens |
| `JWT_REFRESH_EXPIRES_IN` | Expiração do refresh token (ex: `7d`) |
| `CORS_ORIGIN` | Origem(s) permitidas pelo CORS (ex: `http://localhost:3000`) |
| `INTERNAL_API_KEY` | Chave compartilhada com o Next.js para comunicação interna |
| `NODE_ENV` | `development` ou `production` |

---

## Deploy

O projeto está configurado para deploy automático no **Render** via `render.yaml`. Cada push na branch `main` dispara um novo deploy do backend.

---

## CI

O GitHub Actions valida backend e frontend a cada push e pull request para `main`:

1. **Backend** — instala dependências e valida que o módulo principal carrega sem erros
2. **Frontend** — install, lint, testes unitários/integração, Playwright E2E e build de produção
3. **Docker** — build das imagens de backend e frontend
