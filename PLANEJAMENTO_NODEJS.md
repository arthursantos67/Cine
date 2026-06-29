# Planejamento de Reestruturação — CinePrime API (Node.js)

> **Trabalho 2 - Unidade 3 | Disciplina: Desenvolvimento WEB - Backend**  
> Deadline: 30/06/2026

---

## 1. Visão Geral

O backend atual é implementado em **Python/Django REST Framework** com banco de dados SQL (SQLite/PostgreSQL). O trabalho exige uma API em **Node.js + Express.js** com **MongoDB (Atlas)** como banco de dados.

**Estratégia:** criar uma pasta `node-backend/` na raiz do projeto contendo o novo backend Node.js. O frontend React existente e o restante da estrutura do monorepo permanecem intactos. O backend Python precisa ser removido após validação.

---

## 2. Requisitos do Trabalho (Checklist)

| # | Requisito | Status |
|---|-----------|--------|
| 1 | API em Node.js + Express.js | ⬜ A fazer |
| 2 | Pelo menos duas entidades (contexto não-Pets) | ⬜ A fazer (cinema ✓) |
| 3 | CRUD completo das entidades | ⬜ A fazer |
| 4 | Validação dos dados | ⬜ A fazer |
| 5 | Autenticação (rotas protegidas por JWT) | ⬜ A fazer |
| 6 | Hashing de senhas com bcrypt | ⬜ A fazer |
| 7 | Autorização RBAC (papéis com acesso especial) | ⬜ A fazer |
| 8 | Tratamento de erros | ⬜ A fazer |
| 9 | Separação de responsabilidades (ver camadas) | ⬜ A fazer |
| 10 | Pelo menos uma view com template PUG | ⬜ A fazer |
| 11 | MongoDB Atlas | ⬜ A fazer |
| 12 | Deploy no Render | ⬜ A fazer |

---

## 3. Entidades do Domínio

O contexto de **cinema** atende ao requisito. As entidades principais mapeadas do projeto atual:

### Entidades principais (CRUD completo obrigatório)

| Entidade | Descrição |
|----------|-----------|
| **User** | Usuário da plataforma (autenticação + RBAC) |
| **Movie** | Filme com título, sinopse, gênero, classificação |
| **Genre** | Gênero cinematográfico (entidade própria) |
| **Room** | Sala de cinema com capacidade e tipo de experiência |
| **Session** | Sessão: relaciona filme + sala + horário + preço |
| **Reservation** | Reserva/ingresso: relaciona usuário + sessão + assento |

> Isso totaliza **6 entidades**, atendendo com folga o mínimo de 2.

### Papéis de usuário (RBAC)

| Role | Permissões |
|------|-----------|
| `user` | Listar filmes/sessões, criar reserva, ver próprios ingressos |
| `staff` | Tudo de `user` + CRUD de filmes, gêneros, salas e sessões |
| `master` | Tudo de `staff` + gerenciar usuários e papéis |

---

## 4. Estrutura de Pastas

```
node-backend/
├── src/
│   ├── models/               # Schemas Mongoose
│   │   ├── User.js
│   │   ├── Genre.js
│   │   ├── Movie.js
│   │   ├── Room.js
│   │   ├── Session.js
│   │   └── Reservation.js
│   │
│   ├── dtos/                 # Objetos de transferência de dados (entrada/saída)
│   │   ├── auth.dto.js
│   │   ├── user.dto.js
│   │   ├── movie.dto.js
│   │   ├── genre.dto.js
│   │   ├── room.dto.js
│   │   ├── session.dto.js
│   │   └── reservation.dto.js
│   │
│   ├── validators/           # Schemas de validação (Zod)
│   │   ├── auth.validator.js
│   │   ├── user.validator.js
│   │   ├── movie.validator.js
│   │   ├── genre.validator.js
│   │   ├── room.validator.js
│   │   ├── session.validator.js
│   │   └── reservation.validator.js
│   │
│   ├── repositories/         # Camada de acesso ao banco (Mongoose queries)
│   │   ├── user.repository.js
│   │   ├── movie.repository.js
│   │   ├── genre.repository.js
│   │   ├── room.repository.js
│   │   ├── session.repository.js
│   │   └── reservation.repository.js
│   │
│   ├── services/             # Lógica de negócio
│   │   ├── auth.service.js
│   │   ├── user.service.js
│   │   ├── movie.service.js
│   │   ├── genre.service.js
│   │   ├── room.service.js
│   │   ├── session.service.js
│   │   └── reservation.service.js
│   │
│   ├── controllers/          # Handlers de requisição/resposta
│   │   ├── auth.controller.js
│   │   ├── user.controller.js
│   │   ├── movie.controller.js
│   │   ├── genre.controller.js
│   │   ├── room.controller.js
│   │   ├── session.controller.js
│   │   └── reservation.controller.js
│   │
│   ├── middlewares/          # Middlewares Express
│   │   ├── auth.middleware.js      # Verifica JWT
│   │   ├── rbac.middleware.js      # Verifica papel (role)
│   │   ├── validate.middleware.js  # Aplica schema Zod
│   │   └── error.middleware.js     # Handler global de erros
│   │
│   ├── routes/               # Roteadores Express
│   │   ├── auth.routes.js
│   │   ├── user.routes.js
│   │   ├── movie.routes.js
│   │   ├── genre.routes.js
│   │   ├── room.routes.js
│   │   ├── session.routes.js
│   │   ├── reservation.routes.js
│   │   └── index.js               # Agrega todos os routers
│   │
│   └── templates/            # Views PUG
│       ├── layout.pug
│       ├── movies.pug             # Listagem de filmes (view PUG obrigatória)
│       └── movie-detail.pug      # Detalhe do filme
│
├── app.js                    # Configuração do Express (middlewares globais, rotas)
├── server.js                 # Entry point (conecta ao MongoDB e sobe o servidor)
├── package.json
├── .env.example
└── .gitignore
```

---

## 5. Schemas MongoDB (Modelos)

### User
```js
{
  email:     String (unique, required),
  username:  String (unique, required),
  password:  String (bcrypt hash, required),
  role:      enum ['user', 'staff', 'master'] (default: 'user'),
  isActive:  Boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

### Genre
```js
{
  name:      String (unique, required, trim),
  createdAt: Date,
  updatedAt: Date
}
```

### Movie
```js
{
  title:         String (required),
  synopsis:      String (required),
  genres:        [ObjectId → Genre],
  durationMin:   Number (min: 1, required),
  releaseDate:   Date (required),
  posterUrl:     String (required),
  status:        enum ['em_cartaz', 'pre_venda', 'em_breve'] (default: 'em_cartaz'),
  ageRating:     enum ['L', '10', '12', '14', '16', '18'],
  director:      String,
  isFeatured:    Boolean (default: false),
  createdAt:     Date,
  updatedAt:     Date
}
```

### Room
```js
{
  name:           String (unique, required),
  capacity:       Number (min: 1, required),
  experienceType: enum ['standard', 'vip', 'premium', 'imax'] (default: 'standard'),
  basePrice:      Number (min: 0.01, required),
  createdAt:      Date,
  updatedAt:      Date
}
```

### Session
```js
{
  movie:           ObjectId → Movie (required),
  room:            ObjectId → Room (required),
  startTime:       Date (required),
  endTime:         Date (required),
  basePrice:       Number (min: 0.01, required),
  audioFormat:     enum ['original', 'legendado', 'dublado'],
  projectionFormat: enum ['2d', '3d', 'imax'],
  createdAt:       Date,
  updatedAt:       Date
}
// Validação: endTime > startTime, sem sobreposição de horário na mesma sala
```

### Reservation
```js
{
  user:          ObjectId → User (required),
  session:       ObjectId → Session (required),
  seatLabel:     String (ex: "A1", required),  // linha + número do assento
  status:        enum ['reserved', 'purchased', 'cancelled'] (default: 'reserved'),
  ticketType:    enum ['inteira', 'meia', 'gratuito'] (default: 'inteira'),
  amountPaid:    Number,
  paymentMethod: enum ['cartao_credito', 'pix'],
  ticketCode:    String (unique, gerado automaticamente),
  expiresAt:     Date (reservas temporárias: 15 min),
  createdAt:     Date,
  updatedAt:     Date
}
```

---

## 6. Rotas da API

### Autenticação — `/api/v1/auth` (público)

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/register` | Cadastro de usuário |
| POST | `/login` | Login, retorna JWT |
| POST | `/refresh` | Renovar token |

### Usuários — `/api/v1/users`

| Método | Rota | Auth | Role |
|--------|------|------|------|
| GET | `/me` | ✅ | qualquer |
| PUT | `/me` | ✅ | qualquer |
| DELETE | `/me` | ✅ | qualquer |
| GET | `/` | ✅ | master |
| PATCH | `/:id/role` | ✅ | master |
| DELETE | `/:id` | ✅ | master |

### Gêneros — `/api/v1/genres`

| Método | Rota | Auth | Role |
|--------|------|------|------|
| GET | `/` | ❌ | — |
| GET | `/:id` | ❌ | — |
| POST | `/` | ✅ | staff/master |
| PUT | `/:id` | ✅ | staff/master |
| DELETE | `/:id` | ✅ | staff/master |

### Filmes — `/api/v1/movies`

| Método | Rota | Auth | Role |
|--------|------|------|------|
| GET | `/` | ❌ | — |
| GET | `/:id` | ❌ | — |
| POST | `/` | ✅ | staff/master |
| PUT | `/:id` | ✅ | staff/master |
| DELETE | `/:id` | ✅ | staff/master |

### Salas — `/api/v1/rooms`

| Método | Rota | Auth | Role |
|--------|------|------|------|
| GET | `/` | ❌ | — |
| GET | `/:id` | ❌ | — |
| POST | `/` | ✅ | master |
| PUT | `/:id` | ✅ | master |
| DELETE | `/:id` | ✅ | master |

### Sessões — `/api/v1/sessions`

| Método | Rota | Auth | Role |
|--------|------|------|------|
| GET | `/` | ❌ | — |
| GET | `/:id` | ❌ | — |
| POST | `/` | ✅ | staff/master |
| PUT | `/:id` | ✅ | staff/master |
| DELETE | `/:id` | ✅ | staff/master |

### Reservas — `/api/v1/reservations`

| Método | Rota | Auth | Role |
|--------|------|------|------|
| GET | `/me` | ✅ | qualquer |
| POST | `/` | ✅ | qualquer |
| POST | `/checkout` | ✅ | qualquer |
| GET | `/:id` | ✅ | qualquer (própria) |
| DELETE | `/:id` | ✅ | qualquer (cancelar própria) |
| GET | `/` | ✅ | master |

### Views PUG — `/` (HTML renderizado)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/movies` | Listagem de filmes (template PUG) |
| GET | `/movies/:id` | Detalhe do filme (template PUG) |

---

## 7. Dependências NPM

```json
{
  "dependencies": {
    "express": "^4.19.x",
    "mongoose": "^8.x",
    "jsonwebtoken": "^9.x",
    "bcryptjs": "^2.4.x",
    "zod": "^3.x",
    "pug": "^3.x",
    "dotenv": "^16.x",
    "cors": "^2.8.x",
    "morgan": "^1.10.x",
    "express-rate-limit": "^7.x"
  },
  "devDependencies": {
    "nodemon": "^3.x"
  }
}
```

---

## 8. Variáveis de Ambiente (`.env`)

```env
PORT=3000
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/cineprime
JWT_SECRET=<secret-forte>
JWT_EXPIRES_IN=1d
JWT_REFRESH_SECRET=<refresh-secret>
JWT_REFRESH_EXPIRES_IN=7d
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

---

## 9. Camadas de Responsabilidade — Como Funciona

```
Request
  │
  ▼
Route (routes/)          → define o verbo HTTP e o caminho
  │
  ▼
Middleware (middlewares/) → auth (JWT), rbac (role), validate (Zod)
  │
  ▼
Controller (controllers/) → extrai dados do req, chama service, retorna res
  │
  ▼
Service (services/)       → lógica de negócio, regras, orquestra repositórios
  │
  ▼
Repository (repositories/) → queries Mongoose, sem lógica de negócio
  │
  ▼
Model (models/)            → Schema Mongoose
  │
  ▼
MongoDB Atlas
```

**DTOs** são usados em dois pontos:
- Na entrada: o `validator` usa o DTO de entrada para definir o schema Zod
- Na saída: o `controller/service` usa o DTO de saída para sanitizar o que é retornado (ex: omitir `password` do User)

---

## 10. Tratamento de Erros

Criar uma classe `AppError` e um middleware global de erros:

```js
// middlewares/error.middleware.js
// Captura AppError e erros Mongoose (ValidationError, CastError, duplicate key)
// Retorna JSON padronizado:
// { status: 'error', message: '...', errors: [...] }
```

Tipos de erro a tratar:
- `400` — Validação Zod / dados inválidos
- `401` — Token ausente ou inválido
- `403` — Sem permissão de papel (RBAC)
- `404` — Recurso não encontrado
- `409` — Conflito (email duplicado, assento já reservado)
- `422` — Erro de regra de negócio (ex: horário sobrepostos na sessão)
- `500` — Erro interno genérico

---

## 11. Autenticação JWT + bcrypt

- Registro: hash da senha com `bcrypt.hash(password, 12)` antes de salvar
- Login: `bcrypt.compare(password, user.password)`, gera access token (1d) + refresh token (7d)
- Middleware `auth.middleware.js`: lê header `Authorization: Bearer <token>`, verifica com `jwt.verify()`, injeta `req.user`
- Middleware `rbac.middleware.js`: recebe lista de roles permitidas e compara com `req.user.role`

```js
// Exemplo de uso nas rotas:
router.post('/', authenticate, authorize('staff', 'master'), validate(createMovieDto), movieController.create)
```

---

## 12. View PUG

Implementar pelo menos **2 views renderizadas server-side** com PUG:

**`GET /movies`** — listagem de filmes em cartaz  
**`GET /movies/:id`** — detalhe de um filme com sessões disponíveis

```js
// No controller de views (não de API):
res.render('movies', { movies, title: 'CinePrime — Em Cartaz' })
```

As views ficam em `src/templates/` e o Express é configurado com:
```js
app.set('view engine', 'pug')
app.set('views', path.join(__dirname, 'src/templates'))
```

---

## 13. Configuração do app.js

```js
// app.js — visão geral
import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import apiRoutes from './src/routes/index.js'
import { errorMiddleware } from './src/middlewares/error.middleware.js'

const app = express()
app.use(cors())
app.use(express.json())
app.use(morgan('dev'))
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }))

// Views PUG
app.set('view engine', 'pug')
app.set('views', './src/templates')

// Rotas da API
app.use('/api/v1', apiRoutes)

// Rotas de view (HTML)
app.get('/movies', viewController.listMovies)
app.get('/movies/:id', viewController.movieDetail)

// Error handler (deve ser o último middleware)
app.use(errorMiddleware)

export default app
```

---

## 14. Plano de Implementação (Ordem Sugerida)

### Fase 0 — Limpeza
- [ ] Remover a pasta `backend/` (Python/Django) completamente
- [ ] Remover `db.sqlite3` da raiz
- [ ] Atualizar `docker-compose.yml` para refletir apenas Node.js + MongoDB
- [ ] Atualizar `.gitignore` (remover entradas Python, adicionar entradas Node.js)

### Fase 1 — Fundação
- [ ] `npm init` + instalar dependências
- [ ] Configurar `server.js` com conexão MongoDB (Mongoose)
- [ ] Criar `app.js` com Express + middlewares globais
- [ ] Criar `AppError` e `error.middleware.js`
- [ ] Criar `validate.middleware.js` com Zod

### Fase 2 — Autenticação
- [ ] Model `User` (Mongoose)
- [ ] DTO + Validator de registro e login
- [ ] Repository `user.repository.js`
- [ ] Service `auth.service.js` (bcrypt + jwt)
- [ ] Controller `auth.controller.js`
- [ ] Rotas `/api/v1/auth`
- [ ] Middleware `auth.middleware.js`
- [ ] Middleware `rbac.middleware.js`

### Fase 3 — Entidades do Catálogo
- [ ] Models: `Genre`, `Movie`, `Room`, `Session`
- [ ] DTOs + Validators para cada entidade
- [ ] Repositories para cada entidade
- [ ] Services para cada entidade (incluindo validação de sobreposição de sessão)
- [ ] Controllers para cada entidade
- [ ] Rotas com proteção RBAC

### Fase 4 — Reservas
- [ ] Model `Reservation`
- [ ] DTO + Validator
- [ ] Repository + Service (lógica de assento disponível, cálculo de preço)
- [ ] Controller + Rotas

### Fase 5 — Views PUG
- [ ] Configurar engine PUG no Express
- [ ] Template `layout.pug` (base HTML)
- [ ] Template `movies.pug` + rota `GET /movies`
- [ ] Template `movie-detail.pug` + rota `GET /movies/:id`

### Fase 6 — Deploy no Render
- [ ] Criar conta / projeto no Render
- [ ] Configurar variáveis de ambiente no Render
- [ ] Criar cluster MongoDB Atlas e obter connection string
- [ ] Testar endpoints em produção

---

## 15. O Que Muda e O Que Permanece

| Componente | Ação |
|-----------|------|
| Frontend React (`frontend/`) | ✅ Mantido intacto |
| Backend Python/Django (`backend/`) | ❌ **Removido completamente** |
| `db.sqlite3` | ❌ **Removido** |
| `docker-compose.yml` | ♻️ Reescrito para Node.js + MongoDB |
| Postman collection | ♻️ Atualizar com novos endpoints |
| `README.md` | ♻️ Atualizar com instruções do Node.js |

---

## 16. Notas Finais

- **CORS:** configurar para aceitar o frontend React (`localhost:5173` em dev, domínio em produção)
- **Módulos:** usar ES Modules (`"type": "module"` no `package.json`) para consistência com o frontend
- **Scripts npm:** `"dev": "nodemon server.js"` e `"start": "node server.js"`
- **Seed:** criar um script `seed.js` para popular o banco com dados iniciais (gêneros, filmes, 1 usuário master)
- **Render:** o serviço detecta Node.js automaticamente; build command `npm install`, start command `npm start`
