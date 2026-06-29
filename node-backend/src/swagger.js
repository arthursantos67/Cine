export const swaggerSpec = {
  openapi: '3.0.3',
  info: {
    title: 'CinePrime API',
    version: '1.0.0',
    description: `API do sistema de cinema CinePrime. Utilize o botão **Authorize** para inserir o token JWT (formato: \`Bearer <token>\`).

**Fluxo básico:**
1. \`POST /auth/register\` → cria conta
2. \`POST /auth/login\` → obtém \`access\` e \`refresh\` tokens
3. Copie o \`access\` token e clique em **Authorize** → cole em *BearerAuth*
4. Agora você pode usar todos os endpoints autenticados`,
    contact: { name: 'CinePrime Dev', email: 'arthursantos.homeoffice@gmail.com' },
  },
  servers: [
    { url: 'http://localhost:8000/api/v1', description: 'Desenvolvimento local' },
    { url: 'https://cineprime-api.onrender.com/api/v1', description: 'Produção (Render)' },
  ],
  tags: [
    { name: 'Auth', description: 'Registro, login e renovação de tokens' },
    { name: 'Users', description: 'Perfil do usuário e gestão de administradores' },
    { name: 'Catalog › Movies', description: 'Filmes — listagem, detalhes, criação e edição' },
    { name: 'Catalog › Reviews', description: 'Avaliações e votos em filmes' },
    { name: 'Catalog › Interest', description: 'Interesse em filmes "em breve"' },
    { name: 'Catalog › Genres', description: 'Gêneros com suporte a tradução automática' },
    { name: 'Catalog › Rooms', description: 'Salas de cinema e precificação por tipo' },
    { name: 'Catalog › Sessions', description: 'Sessões de filmes (datas, horários, formatos)' },
    { name: 'Seats', description: 'Mapa de assentos, fileiras e layout acessível' },
    { name: 'Reservations', description: 'Reserva de assentos, liberação e checkout' },
    { name: 'Internal', description: 'Comunicação interna servidor-a-servidor (requer X-Internal-Key)' },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Token JWT obtido via POST /auth/login. Cole apenas o token, sem o prefixo "Bearer".',
      },
    },
    schemas: {
      // ── Shared ──────────────────────────────────────────────────────────────
      PaginatedMeta: {
        type: 'object',
        properties: {
          count: { type: 'integer', example: 42 },
          next: { type: 'string', nullable: true, example: 'http://localhost:3000/api/v1/catalog/movies?page=2' },
          previous: { type: 'string', nullable: true, example: null },
          results: { type: 'array', items: {} },
        },
      },
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'VALIDATION_FAILED' },
              message: { type: 'string', example: 'Dados inválidos' },
              status: { type: 'integer', example: 422 },
              details: { type: 'object' },
            },
          },
        },
      },
      // ── Auth ────────────────────────────────────────────────────────────────
      RegisterInput: {
        type: 'object',
        required: ['email', 'username', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'joao@email.com' },
          username: { type: 'string', minLength: 3, maxLength: 30, example: 'joaosilva' },
          password: { type: 'string', minLength: 6, example: 'senha123' },
        },
      },
      LoginInput: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'joao@email.com' },
          password: { type: 'string', example: 'senha123' },
        },
      },
      RefreshInput: {
        type: 'object',
        properties: {
          refresh: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
          refreshToken: {
            type: 'string',
            description: 'Alias legado (use `refresh`)',
            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          },
        },
      },
      AuthTokens: {
        type: 'object',
        properties: {
          access: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
          refresh: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
        },
      },
      // ── User ────────────────────────────────────────────────────────────────
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '665a1b2c3d4e5f6789012345' },
          email: { type: 'string', example: 'joao@email.com' },
          username: { type: 'string', example: 'joaosilva' },
          role: { type: 'string', enum: ['user', 'staff', 'master'], example: 'user' },
          isActive: { type: 'boolean', example: true },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      UpdateMeInput: {
        type: 'object',
        properties: {
          username: { type: 'string', minLength: 3, maxLength: 30, example: 'novonome' },
          email: { type: 'string', format: 'email', example: 'novoemail@email.com' },
        },
      },
      // ── Genre ───────────────────────────────────────────────────────────────
      Genre: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '665a1b2c3d4e5f6789000001' },
          name: { type: 'string', example: 'Ação' },
          translations: {
            type: 'object',
            example: { 'en-US': { name: 'Action' }, 'es-ES': { name: 'Acción' } },
          },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
        },
      },
      GenreInput: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 50, example: 'Ficção Científica' },
          source_language: {
            type: 'string',
            enum: ['pt-BR', 'en-US', 'es-ES'],
            default: 'pt-BR',
            description: 'Idioma de origem para tradução automática',
            example: 'pt-BR',
          },
        },
      },
      // ── Movie ───────────────────────────────────────────────────────────────
      Movie: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '665a1b2c3d4e5f6789000002' },
          title: { type: 'string', example: 'Oppenheimer' },
          synopsis: {
            type: 'string',
            example: 'A história do físico J. Robert Oppenheimer e do desenvolvimento da bomba atômica.',
          },
          genres: {
            type: 'array',
            items: { $ref: '#/components/schemas/Genre' },
          },
          duration_minutes: { type: 'integer', example: 180 },
          release_date: { type: 'string', format: 'date', example: '2023-07-21' },
          poster_url: {
            type: 'string',
            format: 'uri',
            example: 'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
          },
          spotlight_url: { type: 'string', format: 'uri', nullable: true, example: null },
          status: { type: 'string', enum: ['em_cartaz', 'pre_venda', 'em_breve'], example: 'em_cartaz' },
          age_rating: {
            type: 'string',
            enum: ['L', '10', '12', '14', '16', '18'],
            nullable: true,
            example: '14',
          },
          director: { type: 'string', nullable: true, example: 'Christopher Nolan' },
          is_featured: { type: 'boolean', example: true },
          translations: { type: 'object', example: {} },
          average_rating: { type: 'number', nullable: true, example: 4.5 },
          review_count: { type: 'integer', example: 128 },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
        },
      },
      MovieInput: {
        type: 'object',
        required: ['title', 'synopsis', 'duration_minutes', 'release_date', 'poster_url'],
        properties: {
          title: { type: 'string', minLength: 1, example: 'Duna: Parte Dois' },
          synopsis: {
            type: 'string',
            minLength: 1,
            example: 'Paul Atreides une-se aos Fremen em uma jornada espiritual e guerreira de vingança.',
          },
          genres: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array de IDs de gênero (ObjectId)',
            example: ['665a1b2c3d4e5f6789000001'],
          },
          duration_minutes: { type: 'integer', minimum: 1, example: 166 },
          release_date: {
            type: 'string',
            format: 'date-time',
            example: '2024-03-01T00:00:00.000Z',
          },
          poster_url: {
            type: 'string',
            format: 'uri',
            example: 'https://image.tmdb.org/t/p/w500/dYCBcPa1CExH8HETv1MMFJ7ADCP.jpg',
          },
          spotlight_url: {
            type: 'string',
            format: 'uri',
            nullable: true,
            example: 'https://image.tmdb.org/t/p/original/dYCBcPa1CExH8HETv1MMFJ7ADCP.jpg',
          },
          status: {
            type: 'string',
            enum: ['em_cartaz', 'pre_venda', 'em_breve'],
            default: 'em_cartaz',
            example: 'em_cartaz',
          },
          age_rating: {
            type: 'string',
            enum: ['L', '10', '12', '14', '16', '18'],
            example: '12',
          },
          director: { type: 'string', example: 'Denis Villeneuve' },
          is_featured: { type: 'boolean', example: true },
          translations: {
            type: 'object',
            description: 'Traduções manuais (opcional)',
            example: { 'en-US': { title: 'Dune: Part Two', synopsis: 'Paul Atreides...' } },
          },
        },
      },
      // ── Room ────────────────────────────────────────────────────────────────
      Room: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '665a1b2c3d4e5f6789000003' },
          name: { type: 'string', example: 'Sala 1' },
          capacity: { type: 'integer', example: 120 },
          experience_type: {
            type: 'string',
            enum: ['standard', 'vip', 'premium', 'imax'],
            nullable: true,
            example: 'standard',
          },
          display_name: { type: 'string', nullable: true, example: 'Sala Standard 1' },
          description: { type: 'string', nullable: true, example: 'Sala padrão com cadeiras confortáveis.' },
          base_price: { type: 'string', example: '25.00' },
          accessible_row_index: { type: 'integer', example: 3 },
          max_center_seats_per_row: { type: 'integer', nullable: true, example: 10 },
          translations: { type: 'object', example: {} },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
        },
      },
      RoomInput: {
        type: 'object',
        required: ['name', 'capacity', 'base_price'],
        properties: {
          name: { type: 'string', minLength: 1, example: 'Sala 2' },
          capacity: { type: 'integer', minimum: 1, example: 80 },
          experience_type: {
            type: 'string',
            enum: ['standard', 'vip', 'premium', 'imax'],
            example: 'vip',
          },
          display_name: { type: 'string', example: 'Sala VIP Confort' },
          description: { type: 'string', example: 'Poltronas reclinável com serviço de lanches.' },
          base_price: { type: 'number', minimum: 0.01, example: 45.0 },
          accessible_row_index: {
            type: 'integer',
            description: 'Índice (0-based) da fileira PCD',
            example: 4,
          },
          max_center_seats_per_row: {
            type: 'integer',
            nullable: true,
            description: 'Quantidade máxima de assentos centrais por fileira',
            example: 8,
          },
          source_language: {
            type: 'string',
            enum: ['pt-BR', 'en-US', 'es-ES'],
            description: 'Idioma para tradução automática do display_name',
            example: 'pt-BR',
          },
        },
      },
      RoomTypePricing: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          experience_type: { type: 'string', example: 'standard' },
          base_price: { type: 'string', example: '25.00' },
          updated_at: { type: 'string', format: 'date-time' },
        },
      },
      // ── Session ─────────────────────────────────────────────────────────────
      Session: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '665a1b2c3d4e5f6789000004' },
          movie: { $ref: '#/components/schemas/Movie' },
          room: { $ref: '#/components/schemas/Room' },
          start_time: { type: 'string', format: 'date-time', example: '2026-07-10T19:00:00.000Z' },
          end_time: { type: 'string', format: 'date-time', example: '2026-07-10T22:06:00.000Z' },
          base_price: { type: 'string', example: '25.00' },
          audio_format: {
            type: 'string',
            enum: ['original', 'legendado', 'dublado'],
            nullable: true,
            example: 'dublado',
          },
          projection_format: {
            type: 'string',
            enum: ['2d', '3d', 'imax'],
            nullable: true,
            example: '2d',
          },
          session_type: {
            type: 'string',
            enum: ['regular', 'preview', 'special_event'],
            example: 'regular',
          },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
        },
      },
      SessionInput: {
        type: 'object',
        required: ['movie', 'room', 'start_time', 'end_time'],
        properties: {
          movie: {
            type: 'string',
            description: 'ID do filme (ObjectId)',
            example: '665a1b2c3d4e5f6789000002',
          },
          room: {
            type: 'string',
            description: 'ID da sala (ObjectId)',
            example: '665a1b2c3d4e5f6789000003',
          },
          start_time: {
            type: 'string',
            format: 'date-time',
            description: 'Horário de início (UTC)',
            example: '2026-07-10T19:00:00.000Z',
          },
          end_time: {
            type: 'string',
            format: 'date-time',
            description: 'Horário de término (UTC)',
            example: '2026-07-10T22:06:00.000Z',
          },
          base_price: {
            type: 'number',
            minimum: 0.01,
            description: 'Preço base (opcional — herda o da sala se omitido)',
            example: 25.0,
          },
          audio_format: {
            type: 'string',
            enum: ['original', 'legendado', 'dublado'],
            example: 'dublado',
          },
          projection_format: {
            type: 'string',
            enum: ['2d', '3d', 'imax'],
            example: '2d',
          },
          session_type: {
            type: 'string',
            enum: ['regular', 'preview', 'special_event'],
            default: 'regular',
            example: 'regular',
          },
          extra_dates: {
            type: 'array',
            items: { type: 'string', format: 'date' },
            description: 'Datas extras para replicar a sessão no mesmo horário (formato YYYY-MM-DD)',
            example: ['2026-07-11', '2026-07-12'],
          },
        },
      },
      // ── Seat ────────────────────────────────────────────────────────────────
      SeatRow: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '665a1b2c3d4e5f6789000010' },
          name: { type: 'string', example: 'A' },
          room: { type: 'string', example: '665a1b2c3d4e5f6789000003' },
          is_accessible_row: { type: 'boolean', example: false },
        },
      },
      SeatRowInput: {
        type: 'object',
        required: ['room', 'name'],
        properties: {
          room: { type: 'string', example: '665a1b2c3d4e5f6789000003' },
          name: { type: 'string', example: 'B' },
          is_accessible_row: { type: 'boolean', default: false, example: false },
        },
      },
      Seat: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '665a1b2c3d4e5f6789000020' },
          row: { type: 'string', example: '665a1b2c3d4e5f6789000010' },
          number: { type: 'integer', example: 5 },
          is_accessible: { type: 'boolean', example: false },
          companion_seat: { type: 'string', nullable: true, example: null },
        },
      },
      SeatInput: {
        type: 'object',
        required: ['row', 'number'],
        properties: {
          row: { type: 'string', example: '665a1b2c3d4e5f6789000010' },
          number: { type: 'integer', minimum: 1, example: 5 },
          is_accessible: { type: 'boolean', default: false, example: false },
          companion_seat: {
            type: 'string',
            nullable: true,
            description: 'ID do assento acompanhante (para cadeirantes)',
            example: null,
          },
        },
      },
      SessionSeat: {
        type: 'object',
        properties: {
          session_seat_id: { type: 'string', example: '665a1b2c3d4e5f6789000030' },
          seat_id: { type: 'string', example: '665a1b2c3d4e5f6789000020' },
          row: { type: 'string', example: 'A' },
          number: { type: 'integer', example: 5 },
          status: { type: 'string', enum: ['AVAILABLE', 'RESERVED', 'PURCHASED'], example: 'AVAILABLE' },
          is_accessible: { type: 'boolean', example: false },
          is_accessible_row: { type: 'boolean', example: false },
          companion_seat_id: { type: 'string', nullable: true, example: null },
          lock_expires_at: { type: 'string', format: 'date-time', nullable: true, example: null },
          reserved_by_current_user: { type: 'boolean', example: false },
        },
      },
      // ── Review ──────────────────────────────────────────────────────────────
      Review: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '665a1b2c3d4e5f6789000050' },
          user: {
            type: 'object',
            properties: {
              id: { type: 'string', example: '665a1b2c3d4e5f6789012345' },
              username: { type: 'string', example: 'joaosilva' },
              email: { type: 'string', example: 'joao@email.com' },
            },
          },
          rating: { type: 'string', example: '4.5' },
          comment: { type: 'string', example: 'Filme incrível, efeitos visuais impressionantes!' },
          like_count: { type: 'integer', example: 12 },
          dislike_count: { type: 'integer', example: 1 },
          user_vote: { type: 'string', enum: ['like', 'dislike'], nullable: true, example: null },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
        },
      },
      ReviewInput: {
        type: 'object',
        required: ['rating'],
        properties: {
          rating: {
            type: 'number',
            minimum: 0.5,
            maximum: 5,
            multipleOf: 0.5,
            description: 'Nota de 0.5 a 5.0 (incremento de 0.5)',
            example: 4.5,
          },
          comment: { type: 'string', example: 'Filme incrível, efeitos visuais impressionantes!' },
        },
      },
      // ── Tickets ─────────────────────────────────────────────────────────────
      Ticket: {
        type: 'object',
        properties: {
          ticket_id: { type: 'string', example: '665a1b2c3d4e5f6789000060' },
          ticket_code: { type: 'string', example: 'TK-A1B2C3D4' },
          session_seat_id: { type: 'string', example: '665a1b2c3d4e5f6789000030' },
          seat_id: { type: 'string', example: '665a1b2c3d4e5f6789000020' },
          ticket_type: { type: 'string', enum: ['inteira', 'meia', 'gratuito'], example: 'inteira' },
          amount_paid: { type: 'string', example: '25.00' },
          payment_method: { type: 'string', enum: ['cartao_credito', 'pix'], example: 'pix' },
          movie: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              title: { type: 'string', example: 'Duna: Parte Dois' },
            },
          },
          session: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              start_time: { type: 'string', format: 'date-time' },
              end_time: { type: 'string', format: 'date-time' },
            },
          },
          room: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string', example: 'Sala 1' },
            },
          },
          seat: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              row: { type: 'string', example: 'A' },
              number: { type: 'integer', example: 5 },
              identifier: { type: 'string', example: 'A5' },
            },
          },
        },
      },
    },
  },
  paths: {
    // ═══════════════════════════════════════════════════════════════════════════
    // AUTH
    // ═══════════════════════════════════════════════════════════════════════════
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Criar nova conta',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RegisterInput' },
              example: { email: 'joao@email.com', username: 'joaosilva', password: 'senha123' },
            },
          },
        },
        responses: {
          201: {
            description: 'Conta criada — retorna tokens de acesso',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthTokens' } } },
          },
          422: { description: 'Dados inválidos', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Fazer login',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginInput' },
              example: { email: 'joao@email.com', password: 'senha123' },
            },
          },
        },
        responses: {
          200: {
            description: 'Login realizado — guarde o `access` token para chamadas autenticadas',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthTokens' },
                example: {
                  access: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2NWExYjJjM2Q0ZTVmNjc4OTAxMjM0NSIsImlhdCI6MTY4MDAwMDAwMCwiZXhwIjoxNjgwMDA3MjAwfQ.abc123',
                  refresh: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2NWExYjJjM2Q0ZTVmNjc4OTAxMjM0NSIsImlhdCI6MTY4MDAwMDAwMCwiZXhwIjoxNjgwNjA0ODAwfQ.def456',
                },
              },
            },
          },
          401: { description: 'Credenciais inválidas' },
        },
      },
    },
    '/auth/token/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Renovar token de acesso',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RefreshInput' },
              example: { refresh: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
            },
          },
        },
        responses: {
          200: {
            description: 'Token renovado',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthTokens' } } },
          },
          401: { description: 'Refresh token inválido ou expirado' },
        },
      },
    },
    '/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Renovar token de acesso (alias legado)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RefreshInput' },
              example: { refresh: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
            },
          },
        },
        responses: {
          200: { description: 'Token renovado', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthTokens' } } } },
        },
      },
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // USERS
    // ═══════════════════════════════════════════════════════════════════════════
    '/users/me': {
      get: {
        tags: ['Users'],
        summary: 'Obter meu perfil',
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'Dados do perfil', content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } },
          401: { description: 'Não autenticado' },
        },
      },
      put: {
        tags: ['Users'],
        summary: 'Atualizar meu perfil',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateMeInput' },
              example: { username: 'novonome', email: 'novoemail@email.com' },
            },
          },
        },
        responses: {
          200: { description: 'Perfil atualizado', content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } },
        },
      },
      delete: {
        tags: ['Users'],
        summary: 'Deletar minha conta',
        security: [{ BearerAuth: [] }],
        responses: { 204: { description: 'Conta removida' } },
      },
    },
    '/users/me/tickets': {
      get: {
        tags: ['Users'],
        summary: 'Listar meus ingressos comprados',
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description: 'Lista de ingressos',
            content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Ticket' } } } },
          },
        },
      },
    },
    '/users/config/tmdb-token': {
      get: {
        tags: ['Users'],
        summary: 'Verificar status do token TMDB',
        description: 'Requer role `staff` ou `master`',
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description: 'Status do token',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    configured: { type: 'boolean', example: true },
                    preview: { type: 'string', nullable: true, example: 'eyJhbGc...' },
                  },
                },
              },
            },
          },
        },
      },
      put: {
        tags: ['Users'],
        summary: 'Configurar token TMDB',
        description: 'Requer role `master`',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['token'],
                properties: { token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOi...' } },
              },
            },
          },
        },
        responses: { 200: { description: 'Token salvo com sucesso' } },
      },
    },
    '/users': {
      get: {
        tags: ['Users'],
        summary: 'Listar todos os usuários',
        description: 'Requer role `staff` ou `master`',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 }, description: 'Página' },
          { name: 'page_size', in: 'query', schema: { type: 'integer', default: 20 }, description: 'Itens por página' },
        ],
        responses: {
          200: {
            description: 'Lista paginada de usuários',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/PaginatedMeta' },
                    { properties: { results: { type: 'array', items: { $ref: '#/components/schemas/User' } } } },
                  ],
                },
              },
            },
          },
        },
      },
    },
    '/users/{id}/admin': {
      post: {
        tags: ['Users'],
        summary: 'Conceder role de administrador',
        description: 'Requer role `master`',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' }, example: '665a1b2c3d4e5f6789012345' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['role'],
                properties: { role: { type: 'string', enum: ['staff', 'master'], example: 'staff' } },
              },
            },
          },
        },
        responses: { 200: { description: 'Role concedida' } },
      },
      delete: {
        tags: ['Users'],
        summary: 'Revogar role de administrador (volta para `user`)',
        description: 'Requer role `master`',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' }, example: '665a1b2c3d4e5f6789012345' }],
        responses: { 200: { description: 'Role revogada' } },
      },
    },
    '/users/{id}/admin/logs': {
      get: {
        tags: ['Users'],
        summary: 'Obter logs de ações administrativas do usuário',
        description: 'Requer role `master`',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' }, example: '665a1b2c3d4e5f6789012345' }],
        responses: { 200: { description: 'Lista de logs' } },
      },
    },
    '/users/{id}/primary-master': {
      post: {
        tags: ['Users'],
        summary: 'Transferir titularidade de primary master',
        description: 'Requer role `master` (primary). Transfere a conta "super admin" para outro usuário.',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' }, example: '665a1b2c3d4e5f6789012345' }],
        responses: { 200: { description: 'Titularidade transferida' } },
      },
    },
    '/users/{id}': {
      delete: {
        tags: ['Users'],
        summary: 'Deletar usuário por ID',
        description: 'Requer role `master`',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' }, example: '665a1b2c3d4e5f6789012345' }],
        responses: { 204: { description: 'Usuário removido' } },
      },
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // CATALOG › MOVIES
    // ═══════════════════════════════════════════════════════════════════════════
    '/catalog/movies': {
      get: {
        tags: ['Catalog › Movies'],
        summary: 'Listar filmes',
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['em_cartaz', 'pre_venda', 'em_breve'] }, description: 'Filtrar por status' },
          { name: 'is_featured', in: 'query', schema: { type: 'boolean' }, description: 'Filtrar destaques' },
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Busca por título (case-insensitive)' },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'page_size', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'include_translations', in: 'query', schema: { type: 'boolean', default: false }, description: 'Inclui o objeto `translations` bruto na resposta (omitido por padrão)' },
        ],
        responses: {
          200: {
            description: 'Lista paginada de filmes',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/PaginatedMeta' },
                    { properties: { results: { type: 'array', items: { $ref: '#/components/schemas/Movie' } } } },
                  ],
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Catalog › Movies'],
        summary: 'Criar filme',
        description: 'Requer role `staff` ou `master`',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/MovieInput' },
              example: {
                title: 'Duna: Parte Dois',
                synopsis: 'Paul Atreides une-se aos Fremen em uma jornada espiritual e guerreira de vingança contra os conspiradores que destruíram sua família.',
                genres: ['665a1b2c3d4e5f6789000001'],
                duration_minutes: 166,
                release_date: '2024-03-01T00:00:00.000Z',
                poster_url: 'https://image.tmdb.org/t/p/w500/dYCBcPa1CExH8HETv1MMFJ7ADCP.jpg',
                status: 'em_cartaz',
                age_rating: '12',
                director: 'Denis Villeneuve',
                is_featured: true,
              },
            },
          },
        },
        responses: {
          201: { description: 'Filme criado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Movie' } } } },
          401: { description: 'Não autenticado' },
          403: { description: 'Sem permissão' },
        },
      },
    },
    '/catalog/movies/{id}': {
      get: {
        tags: ['Catalog › Movies'],
        summary: 'Detalhe de um filme (com média de avaliações)',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, example: '665a1b2c3d4e5f6789000002' },
          { name: 'include_translations', in: 'query', schema: { type: 'boolean', default: false }, description: 'Inclui o objeto `translations` bruto na resposta' },
        ],
        responses: {
          200: { description: 'Filme encontrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Movie' } } } },
          404: { description: 'Filme não encontrado' },
        },
      },
      patch: {
        tags: ['Catalog › Movies'],
        summary: 'Atualizar filme (parcial)',
        description: 'Requer role `staff` ou `master`. Todos os campos são opcionais.',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' }, example: '665a1b2c3d4e5f6789000002' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/MovieInput' },
              example: { status: 'em_cartaz', is_featured: true },
            },
          },
        },
        responses: {
          200: { description: 'Filme atualizado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Movie' } } } },
        },
      },
      delete: {
        tags: ['Catalog › Movies'],
        summary: 'Remover filme',
        description: 'Requer role `staff` ou `master`',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' }, example: '665a1b2c3d4e5f6789000002' }],
        responses: { 204: { description: 'Filme removido' } },
      },
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // CATALOG › INTEREST
    // ═══════════════════════════════════════════════════════════════════════════
    '/catalog/movies/{id}/interest': {
      get: {
        tags: ['Catalog › Interest'],
        summary: 'Verificar interesse em filme "em breve"',
        description: 'Autenticação opcional — `user_interested` é `null` para usuários não autenticados',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' }, example: '665a1b2c3d4e5f6789000002' }],
        responses: {
          200: {
            description: 'Contagem de interesse',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    count: { type: 'integer', example: 47 },
                    user_interested: { type: 'boolean', nullable: true, example: false },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Catalog › Interest'],
        summary: 'Marcar interesse em filme "em breve"',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' }, example: '665a1b2c3d4e5f6789000002' }],
        responses: {
          200: {
            description: 'Interesse registrado',
            content: {
              'application/json': {
                schema: { type: 'object', properties: { count: { type: 'integer', example: 48 }, user_interested: { type: 'boolean', example: true } } },
              },
            },
          },
        },
      },
      delete: {
        tags: ['Catalog › Interest'],
        summary: 'Remover interesse em filme',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' }, example: '665a1b2c3d4e5f6789000002' }],
        responses: { 204: { description: 'Interesse removido' } },
      },
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // CATALOG › REVIEWS
    // ═══════════════════════════════════════════════════════════════════════════
    '/catalog/movies/{id}/reviews': {
      get: {
        tags: ['Catalog › Reviews'],
        summary: 'Listar avaliações do filme',
        description: 'Autenticação opcional — inclui `my_review` e votos do usuário quando autenticado',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, example: '665a1b2c3d4e5f6789000002' },
          { name: 'rating', in: 'query', schema: { type: 'number' }, description: 'Filtrar por nota (ex: 4 filtra de 4.0 a 4.5)' },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
        ],
        responses: {
          200: {
            description: 'Lista de avaliações',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    count: { type: 'integer', example: 15 },
                    next: { type: 'string', nullable: true, example: null },
                    previous: { type: 'string', nullable: true, example: null },
                    results: { type: 'array', items: { $ref: '#/components/schemas/Review' } },
                    my_review: { $ref: '#/components/schemas/Review', nullable: true },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Catalog › Reviews'],
        summary: 'Criar ou atualizar minha avaliação',
        description: 'Upsert — se já existe uma avaliação do usuário, ela é atualizada',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' }, example: '665a1b2c3d4e5f6789000002' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ReviewInput' },
              example: { rating: 4.5, comment: 'Visuals incríveis, trilha sonora perfeita!' },
            },
          },
        },
        responses: {
          201: { description: 'Avaliação criada', content: { 'application/json': { schema: { $ref: '#/components/schemas/Review' } } } },
        },
      },
    },
    '/catalog/movies/{id}/reviews/{reviewId}': {
      patch: {
        tags: ['Catalog › Reviews'],
        summary: 'Editar avaliação',
        description: 'O autor ou um admin (staff/master) pode editar',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, example: '665a1b2c3d4e5f6789000002' },
          { name: 'reviewId', in: 'path', required: true, schema: { type: 'string' }, example: '665a1b2c3d4e5f6789000050' },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ReviewInput' },
              example: { rating: 5.0, comment: 'Mudei minha opinião — obra-prima!' },
            },
          },
        },
        responses: {
          200: { description: 'Avaliação atualizada', content: { 'application/json': { schema: { $ref: '#/components/schemas/Review' } } } },
        },
      },
      delete: {
        tags: ['Catalog › Reviews'],
        summary: 'Remover avaliação',
        description: 'O autor ou um admin (staff/master) pode remover',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, example: '665a1b2c3d4e5f6789000002' },
          { name: 'reviewId', in: 'path', required: true, schema: { type: 'string' }, example: '665a1b2c3d4e5f6789000050' },
        ],
        responses: { 204: { description: 'Avaliação removida' } },
      },
    },
    '/catalog/movies/{id}/reviews/{reviewId}/vote': {
      post: {
        tags: ['Catalog › Reviews'],
        summary: 'Votar em uma avaliação (like ou dislike)',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, example: '665a1b2c3d4e5f6789000002' },
          { name: 'reviewId', in: 'path', required: true, schema: { type: 'string' }, example: '665a1b2c3d4e5f6789000050' },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['vote'],
                properties: { vote: { type: 'string', enum: ['like', 'dislike'], example: 'like' } },
              },
              example: { vote: 'like' },
            },
          },
        },
        responses: { 200: { description: 'Voto registrado', content: { 'application/json': { schema: { type: 'object', properties: { vote: { type: 'string', example: 'like' } } } } } } },
      },
      delete: {
        tags: ['Catalog › Reviews'],
        summary: 'Remover meu voto de uma avaliação',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, example: '665a1b2c3d4e5f6789000002' },
          { name: 'reviewId', in: 'path', required: true, schema: { type: 'string' }, example: '665a1b2c3d4e5f6789000050' },
        ],
        responses: { 204: { description: 'Voto removido' } },
      },
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // CATALOG › GENRES
    // ═══════════════════════════════════════════════════════════════════════════
    '/catalog/genres': {
      get: {
        tags: ['Catalog › Genres'],
        summary: 'Listar gêneros',
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Busca por nome' },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'page_size', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'include_translations', in: 'query', schema: { type: 'boolean', default: false }, description: 'Inclui o objeto `translations` bruto na resposta' },
        ],
        responses: {
          200: {
            description: 'Gêneros',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/PaginatedMeta' },
                    { properties: { results: { type: 'array', items: { $ref: '#/components/schemas/Genre' } } } },
                  ],
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Catalog › Genres'],
        summary: 'Criar gênero (com tradução automática)',
        description: 'Requer role `staff` ou `master`. Se `source_language` for fornecido, traduz automaticamente para os demais idiomas suportados.',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/GenreInput' },
              example: { name: 'Ficção Científica', source_language: 'pt-BR' },
            },
          },
        },
        responses: {
          201: { description: 'Gênero criado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Genre' } } } },
        },
      },
    },
    '/catalog/genres/{id}': {
      patch: {
        tags: ['Catalog › Genres'],
        summary: 'Atualizar gênero',
        description: 'Requer role `staff` ou `master`',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' }, example: '665a1b2c3d4e5f6789000001' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/GenreInput' },
              example: { name: 'Sci-Fi', source_language: 'en-US' },
            },
          },
        },
        responses: {
          200: { description: 'Gênero atualizado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Genre' } } } },
        },
      },
      delete: {
        tags: ['Catalog › Genres'],
        summary: 'Remover gênero',
        description: 'Requer role `staff` ou `master`',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' }, example: '665a1b2c3d4e5f6789000001' }],
        responses: { 204: { description: 'Gênero removido' } },
      },
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // CATALOG › ROOMS
    // ═══════════════════════════════════════════════════════════════════════════
    '/catalog/rooms': {
      get: {
        tags: ['Catalog › Rooms'],
        summary: 'Listar salas',
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Busca por nome' },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'include_translations', in: 'query', schema: { type: 'boolean', default: false }, description: 'Inclui o objeto `translations` bruto na resposta' },
        ],
        responses: {
          200: {
            description: 'Lista de salas',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/PaginatedMeta' },
                    { properties: { results: { type: 'array', items: { $ref: '#/components/schemas/Room' } } } },
                  ],
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Catalog › Rooms'],
        summary: 'Criar sala',
        description: 'Requer role `master`',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RoomInput' },
              example: {
                name: 'Sala 3',
                capacity: 100,
                experience_type: 'standard',
                display_name: 'Sala Standard 3',
                description: 'Sala padrão com tela de 12m.',
                base_price: 28.0,
              },
            },
          },
        },
        responses: {
          201: { description: 'Sala criada', content: { 'application/json': { schema: { $ref: '#/components/schemas/Room' } } } },
        },
      },
    },
    '/catalog/rooms/{id}': {
      get: {
        tags: ['Catalog › Rooms'],
        summary: 'Detalhe de uma sala',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, example: '665a1b2c3d4e5f6789000003' },
          { name: 'include_translations', in: 'query', schema: { type: 'boolean', default: false }, description: 'Inclui o objeto `translations` bruto na resposta' },
        ],
        responses: {
          200: { description: 'Sala encontrada', content: { 'application/json': { schema: { $ref: '#/components/schemas/Room' } } } },
          404: { description: 'Sala não encontrada' },
        },
      },
      patch: {
        tags: ['Catalog › Rooms'],
        summary: 'Atualizar sala (parcial)',
        description: 'Requer role `master`',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' }, example: '665a1b2c3d4e5f6789000003' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RoomInput' },
              example: { base_price: 32.0 },
            },
          },
        },
        responses: { 200: { description: 'Sala atualizada', content: { 'application/json': { schema: { $ref: '#/components/schemas/Room' } } } } },
      },
      delete: {
        tags: ['Catalog › Rooms'],
        summary: 'Remover sala',
        description: 'Requer role `master`',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' }, example: '665a1b2c3d4e5f6789000003' }],
        responses: { 204: { description: 'Sala removida' } },
      },
    },
    '/catalog/room-type-pricing': {
      get: {
        tags: ['Catalog › Rooms'],
        summary: 'Listar preços por tipo de experiência',
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description: 'Lista de preços',
            content: {
              'application/json': {
                schema: { type: 'array', items: { $ref: '#/components/schemas/RoomTypePricing' } },
                example: [
                  { id: 1, experience_type: 'standard', base_price: '25.00', updated_at: '2026-06-28T00:00:00.000Z' },
                  { id: 2, experience_type: 'vip', base_price: '45.00', updated_at: '2026-06-28T00:00:00.000Z' },
                ],
              },
            },
          },
        },
      },
    },
    '/catalog/room-type-pricing/{id}': {
      patch: {
        tags: ['Catalog › Rooms'],
        summary: 'Atualizar preço de um tipo de experiência',
        description: 'IDs: 1=standard, 2=vip, 3=premium, 4=imax. Requer role `master`.',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' }, example: 1 }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['base_price'],
                properties: { base_price: { type: 'number', minimum: 0.01, example: 30.0 } },
              },
              example: { base_price: 30.0 },
            },
          },
        },
        responses: { 200: { description: 'Preço atualizado', content: { 'application/json': { schema: { $ref: '#/components/schemas/RoomTypePricing' } } } } },
      },
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // CATALOG › SESSIONS
    // ═══════════════════════════════════════════════════════════════════════════
    '/catalog/sessions': {
      get: {
        tags: ['Catalog › Sessions'],
        summary: 'Listar sessões',
        parameters: [
          { name: 'movie', in: 'query', schema: { type: 'string' }, description: 'ID do filme' },
          { name: 'room', in: 'query', schema: { type: 'string' }, description: 'ID da sala' },
          { name: 'date', in: 'query', schema: { type: 'string', format: 'date' }, description: 'Data no fuso BRT (YYYY-MM-DD)', example: '2026-07-10' },
          { name: 'experience_type', in: 'query', schema: { type: 'string', enum: ['standard', 'vip', 'premium', 'imax'] }, description: 'Tipo de experiência' },
          { name: 'start_from', in: 'query', schema: { type: 'string', format: 'date-time' }, description: 'Sessões a partir de (ISO 8601)' },
          { name: 'start_to', in: 'query', schema: { type: 'string', format: 'date-time' }, description: 'Sessões até (ISO 8601)' },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'page_size', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: {
          200: {
            description: 'Sessões paginadas',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/PaginatedMeta' },
                    { properties: { results: { type: 'array', items: { $ref: '#/components/schemas/Session' } } } },
                  ],
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Catalog › Sessions'],
        summary: 'Criar sessão (com opção de replicar em múltiplas datas)',
        description: 'Requer role `staff` ou `master`. Use `extra_dates` para criar a mesma sessão em vários dias.',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SessionInput' },
              example: {
                movie: '665a1b2c3d4e5f6789000002',
                room: '665a1b2c3d4e5f6789000003',
                start_time: '2026-07-10T19:00:00.000Z',
                end_time: '2026-07-10T21:46:00.000Z',
                base_price: 25.0,
                audio_format: 'dublado',
                projection_format: '2d',
                session_type: 'regular',
                extra_dates: ['2026-07-11', '2026-07-12'],
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Sessão(ões) criada(s). Retorna um objeto `Session` se apenas uma data, ou `{ sessions, count }` se múltiplas.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Session' } } },
          },
        },
      },
    },
    '/catalog/sessions/{id}': {
      get: {
        tags: ['Catalog › Sessions'],
        summary: 'Detalhe de uma sessão',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' }, example: '665a1b2c3d4e5f6789000004' }],
        responses: {
          200: { description: 'Sessão encontrada', content: { 'application/json': { schema: { $ref: '#/components/schemas/Session' } } } },
          404: { description: 'Sessão não encontrada' },
        },
      },
      patch: {
        tags: ['Catalog › Sessions'],
        summary: 'Atualizar sessão (parcial)',
        description: 'Requer role `staff` ou `master`',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' }, example: '665a1b2c3d4e5f6789000004' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SessionInput' },
              example: { start_time: '2026-07-10T20:00:00.000Z', end_time: '2026-07-10T22:46:00.000Z' },
            },
          },
        },
        responses: { 200: { description: 'Sessão atualizada', content: { 'application/json': { schema: { $ref: '#/components/schemas/Session' } } } } },
      },
      delete: {
        tags: ['Catalog › Sessions'],
        summary: 'Remover sessão',
        description: 'Requer role `staff` ou `master`',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' }, example: '665a1b2c3d4e5f6789000004' }],
        responses: { 204: { description: 'Sessão removida' } },
      },
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // SEATS (via /reservations prefix)
    // ═══════════════════════════════════════════════════════════════════════════
    '/reservations/sessions/{id}/seats': {
      get: {
        tags: ['Seats'],
        summary: 'Mapa de assentos de uma sessão',
        description: 'Retorna todos os assentos com status (AVAILABLE / RESERVED / PURCHASED). Autenticação opcional.',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'ID da sessão', example: '665a1b2c3d4e5f6789000004' }],
        responses: {
          200: {
            description: 'Mapa de assentos',
            content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/SessionSeat' } } } },
          },
        },
      },
    },
    '/reservations/seat-rows': {
      get: {
        tags: ['Seats'],
        summary: 'Listar fileiras',
        description: 'Requer autenticação. Use `?room=<id>` para filtrar por sala.',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'room', in: 'query', schema: { type: 'string' }, description: 'ID da sala', example: '665a1b2c3d4e5f6789000003' },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
        ],
        responses: {
          200: {
            description: 'Fileiras',
            content: { 'application/json': { schema: { allOf: [{ $ref: '#/components/schemas/PaginatedMeta' }, { properties: { results: { type: 'array', items: { $ref: '#/components/schemas/SeatRow' } } } }] } } },
          },
        },
      },
      post: {
        tags: ['Seats'],
        summary: 'Criar fileira',
        description: 'Requer role `staff` ou `master`',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SeatRowInput' },
              example: { room: '665a1b2c3d4e5f6789000003', name: 'C', is_accessible_row: false },
            },
          },
        },
        responses: { 201: { description: 'Fileira criada', content: { 'application/json': { schema: { $ref: '#/components/schemas/SeatRow' } } } } },
      },
    },
    '/reservations/seat-rows/{id}': {
      patch: {
        tags: ['Seats'],
        summary: 'Atualizar fileira',
        description: 'Requer role `staff` ou `master`',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' }, example: '665a1b2c3d4e5f6789000010' }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/SeatRowInput' }, example: { name: 'C', is_accessible_row: true } } },
        },
        responses: { 200: { description: 'Fileira atualizada', content: { 'application/json': { schema: { $ref: '#/components/schemas/SeatRow' } } } } },
      },
      delete: {
        tags: ['Seats'],
        summary: 'Remover fileira',
        description: 'Requer role `staff` ou `master`',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' }, example: '665a1b2c3d4e5f6789000010' }],
        responses: { 204: { description: 'Fileira removida' } },
      },
    },
    '/reservations/seats': {
      get: {
        tags: ['Seats'],
        summary: 'Listar assentos',
        description: 'Requer autenticação. Use `?room=<id>` para filtrar por sala.',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'room', in: 'query', schema: { type: 'string' }, description: 'ID da sala', example: '665a1b2c3d4e5f6789000003' },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
        ],
        responses: {
          200: {
            description: 'Assentos',
            content: { 'application/json': { schema: { allOf: [{ $ref: '#/components/schemas/PaginatedMeta' }, { properties: { results: { type: 'array', items: { $ref: '#/components/schemas/Seat' } } } }] } } },
          },
        },
      },
      post: {
        tags: ['Seats'],
        summary: 'Criar assento',
        description: 'Requer role `staff` ou `master`',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SeatInput' },
              example: { row: '665a1b2c3d4e5f6789000010', number: 7, is_accessible: false },
            },
          },
        },
        responses: { 201: { description: 'Assento criado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Seat' } } } } },
      },
    },
    '/reservations/seats/{id}': {
      patch: {
        tags: ['Seats'],
        summary: 'Atualizar assento',
        description: 'Requer role `staff` ou `master`',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' }, example: '665a1b2c3d4e5f6789000020' }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/SeatInput' }, example: { is_accessible: true } } },
        },
        responses: { 200: { description: 'Assento atualizado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Seat' } } } } },
      },
      delete: {
        tags: ['Seats'],
        summary: 'Remover assento',
        description: 'Requer role `staff` ou `master`',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' }, example: '665a1b2c3d4e5f6789000020' }],
        responses: { 204: { description: 'Assento removido' } },
      },
    },
    '/reservations/bulk-create-layout': {
      post: {
        tags: ['Seats'],
        summary: 'Criar layout completo de fileiras e assentos em lote',
        description: 'Cria múltiplas fileiras com seus assentos de uma só vez. Requer role `staff` ou `master`.',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['room', 'rows'],
                properties: {
                  room: { type: 'string', description: 'ID da sala', example: '665a1b2c3d4e5f6789000003' },
                  rows: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        name: { type: 'string', example: 'A' },
                        seats: {
                          type: 'array',
                          items: { type: 'object', properties: { number: { type: 'integer', example: 1 } } },
                        },
                      },
                    },
                  },
                },
              },
              example: {
                room: '665a1b2c3d4e5f6789000003',
                rows: [
                  { name: 'A', seats: [{ number: 1 }, { number: 2 }, { number: 3 }, { number: 4 }, { number: 5 }] },
                  { name: 'B', seats: [{ number: 1 }, { number: 2 }, { number: 3 }, { number: 4 }, { number: 5 }] },
                  { name: 'C', seats: [{ number: 1 }, { number: 2 }, { number: 3 }, { number: 4 }, { number: 5 }] },
                ],
              },
            },
          },
        },
        responses: {
          200: { description: 'Layout criado — array com fileiras e seus assentos' },
        },
      },
    },
    '/reservations/accessible-row': {
      post: {
        tags: ['Seats'],
        summary: 'Criar fileira PCD (acessível) com pares cadeirante + acompanhante',
        description: 'Cria fileira acessível com pares de assentos intercalados (cadeirante + acompanhante). Requer role `staff` ou `master`.',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['room', 'name'],
                properties: {
                  room: { type: 'string', example: '665a1b2c3d4e5f6789000003' },
                  name: { type: 'string', example: 'PCD' },
                  accessible_seat_count: {
                    type: 'integer',
                    minimum: 1,
                    default: 2,
                    description: 'Quantidade de cadeirantes (cada um gera um par cadeirante+acompanhante)',
                    example: 2,
                  },
                },
              },
              example: { room: '665a1b2c3d4e5f6789000003', name: 'PCD', accessible_seat_count: 2 },
            },
          },
        },
        responses: { 201: { description: 'Fileira PCD criada com assentos intercalados' } },
      },
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // RESERVATIONS
    // ═══════════════════════════════════════════════════════════════════════════
    '/reservations/sessions/{id}/reservations': {
      post: {
        tags: ['Reservations'],
        summary: 'Reservar assentos (lock por 15 minutos)',
        description: 'Bloqueia assentos para o usuário autenticado por 15 minutos. Após esse prazo o lock expira e os assentos ficam disponíveis novamente.',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'ID da sessão', example: '665a1b2c3d4e5f6789000004' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['seat_ids'],
                properties: {
                  seat_ids: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'IDs dos assentos (`Seat._id`, não o `SessionSeat._id`)',
                    example: ['665a1b2c3d4e5f6789000020', '665a1b2c3d4e5f6789000021'],
                  },
                },
              },
              example: { seat_ids: ['665a1b2c3d4e5f6789000020', '665a1b2c3d4e5f6789000021'] },
            },
          },
        },
        responses: {
          200: {
            description: 'Assentos reservados',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    session_id: { type: 'string' },
                    status: { type: 'string', example: 'reserved' },
                    expires_at: { type: 'string', format: 'date-time' },
                    seats: { type: 'array', items: { type: 'object' } },
                  },
                },
              },
            },
          },
          409: { description: 'Assento(s) já reservado(s) por outro usuário' },
        },
      },
      delete: {
        tags: ['Reservations'],
        summary: 'Liberar assentos reservados',
        description: 'Cancela a reserva ativa do usuário. Informe os `session_seat_id` (do mapa de assentos).',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'ID da sessão', example: '665a1b2c3d4e5f6789000004' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['session_seat_ids'],
                properties: {
                  session_seat_ids: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'IDs dos SessionSeats (`session_seat_id` do mapa de assentos)',
                    example: ['665a1b2c3d4e5f6789000030', '665a1b2c3d4e5f6789000031'],
                  },
                },
              },
              example: { session_seat_ids: ['665a1b2c3d4e5f6789000030', '665a1b2c3d4e5f6789000031'] },
            },
          },
        },
        responses: { 200: { description: 'Assentos liberados' } },
      },
    },
    '/reservations/checkout': {
      post: {
        tags: ['Reservations'],
        summary: 'Finalizar compra (checkout)',
        description: 'Converte reservas ativas em ingressos comprados. Os assentos devem estar reservados pelo usuário e dentro do prazo de 15 min.',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  payment_method: {
                    type: 'string',
                    enum: ['cartao_credito', 'pix'],
                    example: 'pix',
                  },
                  seats: {
                    type: 'array',
                    description: 'Formato preferido',
                    items: {
                      type: 'object',
                      properties: {
                        session_seat_id: { type: 'string', example: '665a1b2c3d4e5f6789000030' },
                        ticket_type: { type: 'string', enum: ['inteira', 'meia', 'gratuito'], example: 'inteira' },
                      },
                    },
                  },
                  session_seat_ids: {
                    type: 'array',
                    description: 'Formato legado (use `seats` quando possível)',
                    items: { type: 'string' },
                  },
                  ticket_types: {
                    type: 'array',
                    description: 'Formato legado — array paralelo a `session_seat_ids`',
                    items: { type: 'string', enum: ['inteira', 'meia', 'gratuito'] },
                  },
                },
              },
              example: {
                payment_method: 'pix',
                seats: [
                  { session_seat_id: '665a1b2c3d4e5f6789000030', ticket_type: 'inteira' },
                  { session_seat_id: '665a1b2c3d4e5f6789000031', ticket_type: 'meia' },
                ],
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Compra concluída — retorna ingressos gerados',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'purchased' },
                    payment_method: { type: 'string', example: 'pix' },
                    total_amount: { type: 'string', example: '37.50' },
                    seats: { type: 'array', items: { type: 'object' } },
                    tickets: { type: 'array', items: { $ref: '#/components/schemas/Ticket' } },
                  },
                },
              },
            },
          },
          422: { description: 'Reserva expirada ou assento não disponível' },
        },
      },
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // RESERVATION (/reservation — usado pelo frontend)
    // ═══════════════════════════════════════════════════════════════════════════
    '/reservation': {
      get: {
        tags: ['Reservations'],
        summary: 'Listar todas as reservas',
        description: 'Requer role `master`',
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'Lista de reservas' } },
      },
      post: {
        tags: ['Reservations'],
        summary: 'Criar reserva',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['session', 'seatLabel'],
                properties: {
                  session: { type: 'string', example: '665a1b2c3d4e5f6789000004' },
                  seatLabel: { type: 'string', description: 'Identificador do assento (ex: A5)', example: 'A5' },
                  ticketType: { type: 'string', enum: ['inteira', 'meia', 'gratuito'], example: 'inteira' },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Reserva criada' } },
      },
    },
    '/reservation/me': {
      get: {
        tags: ['Reservations'],
        summary: 'Listar minhas reservas',
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'Minhas reservas' } },
      },
    },
    '/reservation/checkout': {
      post: {
        tags: ['Reservations'],
        summary: 'Checkout de reserva',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['reservationId', 'paymentMethod'],
                properties: {
                  reservationId: { type: 'string', example: '665a1b2c3d4e5f6789000099' },
                  paymentMethod: { type: 'string', enum: ['cartao_credito', 'pix'], example: 'pix' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Checkout concluído' } },
      },
    },
    '/reservation/{id}': {
      get: {
        tags: ['Reservations'],
        summary: 'Detalhe de uma reserva',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' }, example: '665a1b2c3d4e5f6789000099' }],
        responses: { 200: { description: 'Reserva encontrada' } },
      },
      delete: {
        tags: ['Reservations'],
        summary: 'Cancelar reserva',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' }, example: '665a1b2c3d4e5f6789000099' }],
        responses: { 204: { description: 'Reserva cancelada' } },
      },
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // INTERNAL
    // ═══════════════════════════════════════════════════════════════════════════
    '/internal/tmdb-token': {
      get: {
        tags: ['Internal'],
        summary: 'Obter token TMDB (uso interno Next.js → backend)',
        description: 'Requer o header `X-Internal-Key` configurado no servidor via variável `INTERNAL_API_KEY`.',
        parameters: [
          {
            name: 'X-Internal-Key',
            in: 'header',
            required: true,
            schema: { type: 'string' },
            description: 'Chave interna configurada em `INTERNAL_API_KEY`',
          },
        ],
        responses: {
          200: {
            description: 'Token TMDB',
            content: {
              'application/json': {
                schema: { type: 'object', properties: { value: { type: 'string', nullable: true, example: 'eyJhbGc...' } } },
              },
            },
          },
          401: { description: 'Chave interna inválida' },
          503: { description: 'INTERNAL_API_KEY não configurada no servidor' },
        },
      },
    },
  },
}
