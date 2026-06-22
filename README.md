# CinePrime

Sistema completo de reserva de ingressos de cinema — backend REST em Django/DRF e frontend web em Next.js.

---

## Funcionalidades

### Para usuários

- Catálogo de filmes com banner de destaque, filmes em cartaz, pré-venda e em breve
- Detalhes do filme: sinopse, elenco, diretor, classificação etária e sessões disponíveis
- Seleção de sessão com filtro por data e badges de formato (3D, IMAX, Legendado, Dublado, Pré-estreia)
- Mapa de assentos interativo com estados visuais: disponível, selecionado, ocupado e acessível
- Reserva temporária de assentos com contador regressivo de 10 minutos
- Seleção de tipo de ingresso por assento: inteira ou meia-entrada (50% de desconto)
- Checkout com seleção de forma de pagamento: Cartão de Crédito ou PIX
- Tela de confirmação com código do ingresso
- Área "Meus Ingressos" com filtro por sessões futuras ou passadas
- Avaliações de filmes com meia-estrela (0,5 a 5,0) e votos de utilidade nas reviews
- Interesse em filmes em breve (contador público + ação autenticada)
- Suporte a dois idiomas: Português (pt-BR) e English (en-US)

### Para administradores

- Painel admin em `/admin/` com resumo de operações do dia
- Gerenciamento de gêneros com suporte a traduções
- Gerenciamento de filmes: criação com importação via TMDB, edição de todos os campos incluindo classificação etária, elenco e URL de spotlight
- Gerenciamento de salas: tipo de experiência, nome de exibição e descrição
- Editor de layout de sala: adicionar fileiras via wizard em lote e fileira acessível PCD com pares cadeira + acompanhante
- Gerenciamento de sessões: preço base, formato de áudio/projeção e tipo de sessão
- Configuração de preço por tipo de sala (Standard, VIP, Premium, IMAX)
- Gerenciamento de usuários (Master): promover/rebaixar papel (Staff/Master), log de auditoria de permissões, exclusão de contas

---

## Tecnologias

| Camada | Tecnologia |
|---|---|
| Backend | Python 3.14 · Django 6 · Django REST Framework |
| Autenticação | JWT via `djangorestframework-simplejwt` |
| Banco de dados | PostgreSQL 17 |
| Cache e locks | Redis 7 (`django-redis`) |
| Tarefas assíncronas | Celery (broker Redis) |
| API docs | OpenAPI 3 + Swagger UI via `drf-spectacular` |
| Frontend | Next.js 15 (App Router) · TypeScript · Tailwind CSS v4 |
| Testes backend | Pytest + pytest-django |
| Testes frontend | Node.js test runner + tsx · Playwright (E2E) |
| Infraestrutura | Docker · Docker Compose · GitHub Actions CI |

---

## Estrutura do repositório

```
cineprime-api/
├── backend/          Django API — apps, serviços, testes, Dockerfile
├── frontend/         Next.js app — páginas, componentes, API client, Dockerfiles
├── docker-compose.yml
└── product-requirements-document.md   PRD completo (backend + frontend)
```

Documentação detalhada por camada:

- [`backend/README.md`](./backend/README.md) — comandos, variáveis de ambiente, testes e referência de rotas
- [`frontend/README.md`](./frontend/README.md) — comandos, variáveis de ambiente e build
- [`product-requirements-document.md`](./product-requirements-document.md) — requisitos funcionais, modelo de dados, contrato de API e rastreabilidade
- [`frontend/frontend-product-requirements-document.md`](./frontend/frontend-product-requirements-document.md) — PRD específico do frontend

---

## Como rodar localmente

### Pré-requisitos

- Docker e Docker Compose instalados

### 1. Configurar variáveis de ambiente

```bash
cp .env.example .env
```

Edite `.env` conforme necessário. As variáveis essenciais para desenvolvimento local já estão preenchidas no `.env.example`.

**Token TMDB para importação de filmes no admin**

Há duas formas de configurar o token da API do TMDB:

- **Via variável de ambiente** (prioridade): defina `TMDB_API_READ_TOKEN=<seu-token>` no `.env` do frontend. Requer reinício do container.
- **Via painel admin** (sem reinício): configure `INTERNAL_API_KEY=<chave-secreta>` no `.env` do backend e no `.env` do frontend (server-only). Com isso, usuários Master Admin podem definir e atualizar o token pelo painel em `/admin/` a qualquer momento — o valor fica salvo no banco de dados e nunca é exposto no browser.

### 2. Subir o stack completo

```bash
docker compose up --build
```

O container do backend executa as migrações automaticamente antes de iniciar o servidor.

### Serviços disponíveis

| Serviço | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| Swagger UI | http://localhost:8000/api/docs/ |
| Health check | http://localhost:8000/health/ |
| PostgreSQL | localhost:5432 |
| Redis | localhost:6379 |

### Comandos úteis

```bash
# Rodar migrações manualmente
docker compose exec backend python manage.py migrate

# Executar testes do backend
docker compose exec backend pytest -q

# Verificar worker Celery
docker compose exec celery celery -A cineprime_api inspect ping

# Testes do frontend (fora do Docker)
cd frontend && npm ci && npm run test

# Build de produção do frontend
cd frontend && npm run build
```

---

## CI

O GitHub Actions valida backend e frontend de forma independente a cada push e pull request para `main`:

1. **Backend** — `manage.py check`, migrações e suite de testes completa dentro do container
2. **Frontend** — install, lint, testes unitários/integração, Playwright E2E e build de produção
3. **Docker** — validação do `docker-compose.yml` e build das imagens de backend e frontend
