import 'dotenv/config'
import mongoose from 'mongoose'
import Genre from './models/Genre.js'
import Movie from './models/Movie.js'
import Room from './models/Room.js'
import Session from './models/Session.js'

const MONGODB_URI = process.env.MONGODB_URI
if (!MONGODB_URI) {
  console.error('MONGODB_URI não definida')
  process.exit(1)
}

await mongoose.connect(MONGODB_URI)
console.log('Conectado ao MongoDB')

const genres = await Genre.find()
const rooms = await Room.find()

const g = (name) => genres.find((g) => g.name === name)?._id
const r = (name) => rooms.find((r) => r.name === name)?._id

// ──────────────────────────────────────────────
// 12 filmes novos
// ──────────────────────────────────────────────

const moviesData = [
  // ── EM CARTAZ (4) ──────────────────────────
  {
    title: 'Dune: Parte Dois',
    synopsis:
      'Paul Atreides une forças com Chani e os Fremen para empreender um caminho de vingança contra os conspiradores que destruíram sua família.',
    genres: [g('Ficção Científica'), g('Ação')],
    durationMin: 167,
    releaseDate: new Date('2024-03-01'),
    posterUrl: 'https://image.tmdb.org/t/p/w500/8b8R8l88Qje9dn9OE8PY05Nxl1X.jpg',
    status: 'em_cartaz',
    ageRating: '12',
    director: 'Denis Villeneuve',
    isFeatured: true,
  },
  {
    title: 'Oppenheimer',
    synopsis:
      'A história do físico J. Robert Oppenheimer e seu papel no desenvolvimento da primeira bomba atômica durante a Segunda Guerra Mundial.',
    genres: [g('Drama')],
    durationMin: 180,
    releaseDate: new Date('2023-07-21'),
    posterUrl: 'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
    status: 'em_cartaz',
    ageRating: '14',
    director: 'Christopher Nolan',
    isFeatured: false,
  },
  {
    title: 'Planeta dos Macacos: O Reinado',
    synopsis:
      'Muitas gerações após o reinado de César, um jovem macaco embarca em uma jornada épica que o levará a questionar tudo o que sabe sobre o passado.',
    genres: [g('Ação'), g('Ficção Científica')],
    durationMin: 145,
    releaseDate: new Date('2024-05-10'),
    posterUrl: 'https://image.tmdb.org/t/p/w500/gKkl37BQuKTanygYQG1pyYgLVgf.jpg',
    status: 'em_cartaz',
    ageRating: '12',
    director: 'Wes Ball',
    isFeatured: false,
  },
  {
    title: 'Kung Fu Panda 4',
    synopsis:
      'Po deve treinar um novo Guerreiro Dragão ao mesmo tempo em que enfrenta a Camaleoa, uma vilã que pode copiar as habilidades de qualquer kung fu master.',
    genres: [g('Animação'), g('Ação')],
    durationMin: 94,
    releaseDate: new Date('2024-03-08'),
    posterUrl: 'https://image.tmdb.org/t/p/w500/wkfG7DaExmcVsGLR4kLouMwxeT5.jpg',
    status: 'em_cartaz',
    ageRating: 'L',
    director: 'Mike Mitchell',
    isFeatured: false,
  },

  // ── PRÉ-VENDA / ESTREIA (4) ─────────────────
  {
    title: 'Deadpool & Wolverine',
    synopsis:
      'Deadpool é recrutado pela Autoridade de Variância Temporal para cumprir uma missão crítica e acaba se aliando ao mais improvável dos parceiros: Wolverine.',
    genres: [g('Ação'), g('Comédia')],
    durationMin: 128,
    releaseDate: new Date('2026-07-04'),
    posterUrl: 'https://image.tmdb.org/t/p/w500/8cdWjvZQUExUULgtOHMDTOSXiWs.jpg',
    status: 'pre_venda',
    ageRating: '16',
    director: 'Shawn Levy',
    isFeatured: true,
  },
  {
    title: 'Alien: Romulus',
    synopsis:
      'Um grupo de jovens colonizadores do espaço profundo enfrenta a mais aterrorizante forma de vida do universo enquanto vasculha uma estação espacial abandonada.',
    genres: [g('Terror'), g('Ficção Científica')],
    durationMin: 119,
    releaseDate: new Date('2026-07-11'),
    posterUrl: 'https://image.tmdb.org/t/p/w500/b33nnKl1GSFbao4l3fZDDqsMx0F.jpg',
    status: 'pre_venda',
    ageRating: '16',
    director: 'Fede Álvarez',
    isFeatured: false,
  },
  {
    title: 'Divertida Mente 2',
    synopsis:
      'Riley entra na adolescência e novas emoções chegam ao quartel-general, forçando Alegria e os outros a encontrarem espaço para Ansiedade e seus amigos.',
    genres: [g('Animação'), g('Comédia')],
    durationMin: 100,
    releaseDate: new Date('2026-07-07'),
    posterUrl: 'https://image.tmdb.org/t/p/w500/vpnVM9B6NMmQpWeZvzLvDESb2QY.jpg',
    status: 'pre_venda',
    ageRating: 'L',
    director: 'Kelsey Mann',
    isFeatured: false,
  },
  {
    title: 'Furiosa: Uma Saga Mad Max',
    synopsis:
      'A origem da lendária guerreira Furiosa antes de ela cruzar o caminho de Max Rockatansky em Estrada da Fúria.',
    genres: [g('Ação'), g('Ficção Científica')],
    durationMin: 148,
    releaseDate: new Date('2026-07-02'),
    posterUrl: 'https://image.tmdb.org/t/p/w500/iADOJ8Zymht2JPMoy3R7xceZprc.jpg',
    status: 'pre_venda',
    ageRating: '16',
    director: 'George Miller',
    isFeatured: false,
  },

  // ── EM BREVE (4) ────────────────────────────
  {
    title: 'Capitão América: Admirável Mundo Novo',
    synopsis:
      'Sam Wilson assume o manto do Capitão América e é arrastado para um incidente internacional enquanto descobre que há uma conspiração global em andamento.',
    genres: [g('Ação'), g('Ficção Científica')],
    durationMin: 118,
    releaseDate: new Date('2026-08-15'),
    posterUrl: 'https://image.tmdb.org/t/p/w500/pzIddUEMWhWzfvLI3TwxUG2wGoi.jpg',
    status: 'em_breve',
    ageRating: '12',
    director: 'Julius Onah',
    isFeatured: false,
  },
  {
    title: 'Thunderbolts*',
    synopsis:
      'Um grupo de anti-heróis rejeitados é reunido para uma missão suicida que pode determinar o destino do mundo.',
    genres: [g('Ação'), g('Ficção Científica')],
    durationMin: 127,
    releaseDate: new Date('2026-09-05'),
    posterUrl: 'https://image.tmdb.org/t/p/w500/m9EtP1Yrzv6v1l2UlM7bGCB5Bea.jpg',
    status: 'em_breve',
    ageRating: '14',
    director: 'Jake Schreier',
    isFeatured: false,
  },
  {
    title: 'Missão: Impossível – Sentença Mortal Parte 2',
    synopsis:
      'Ethan Hunt continua sua batalha contra a Entidade, uma IA rogue que ameaça o controle de todas as nações, em uma corrida contra o tempo para salvar a humanidade.',
    genres: [g('Ação')],
    durationMin: 170,
    releaseDate: new Date('2026-10-23'),
    posterUrl: 'https://image.tmdb.org/t/p/w500/NNxYkU70HPurnNCSiCjH3ZMgmGA.jpg',
    status: 'em_breve',
    ageRating: '12',
    director: 'Christopher McQuarrie',
    isFeatured: false,
  },
  {
    title: 'Avatar 3: Fogo e Cinza',
    synopsis:
      'Jake Sully e Neytiri enfrentam uma nova ameaça em Pandora enquanto exploram um povo Ash People e as tradições de fogo que regem sua existência.',
    genres: [g('Ficção Científica'), g('Ação')],
    durationMin: 180,
    releaseDate: new Date('2026-12-19'),
    posterUrl: 'https://image.tmdb.org/t/p/w500/t9nyF3r0WAlJ7Kr6xcRYI4jr9jm.jpg',
    status: 'em_breve',
    ageRating: '12',
    director: 'James Cameron',
    isFeatured: false,
  },
]

const movies = await Movie.insertMany(moviesData)
console.log(`✔ ${movies.length} filmes inseridos`)

// ──────────────────────────────────────────────
// Sessões — mínimo 6 por dia, por 10 dias
// ──────────────────────────────────────────────

const sala1 = r('Sala 1')
const salaVip = r('Sala 2 VIP')
const salaImax = r('Sala IMAX')

// Filmes com sessões = em_cartaz e pre_venda
const sessionMovies = movies.filter((m) =>
  ['em_cartaz', 'pre_venda'].includes(m.status)
)

const addMinutes = (date, min) => new Date(date.getTime() + min * 60_000)

const DAY_MS = 24 * 60 * 60 * 1000

// Turnos fixos por sala (horário de início em HH:MM, BRT = UTC-3)
// Definimos os horários em UTC para um dia em BRT
const slots = [
  // Sala 1 — standard
  { room: sala1,    hour: 14, min: 0,  audioFormat: 'dublado',   projectionFormat: '2d' },
  { room: sala1,    hour: 17, min: 0,  audioFormat: 'legendado', projectionFormat: '2d' },
  { room: sala1,    hour: 20, min: 0,  audioFormat: 'dublado',   projectionFormat: '2d' },
  // Sala 2 VIP
  { room: salaVip,  hour: 15, min: 30, audioFormat: 'legendado', projectionFormat: '2d' },
  { room: salaVip,  hour: 19, min: 30, audioFormat: 'original',  projectionFormat: '2d' },
  // Sala IMAX
  { room: salaImax, hour: 12, min: 0,  audioFormat: 'dublado',   projectionFormat: 'imax' },
  { room: salaImax, hour: 21, min: 0,  audioFormat: 'legendado', projectionFormat: 'imax' },
]

// Hoje = 2026-06-25 (UTC midnight)
const startDay = new Date('2026-06-25T00:00:00.000Z')

const sessionsToInsert = []
let movieIndex = 0

for (let day = 0; day < 10; day++) {
  const dayBase = new Date(startDay.getTime() + day * DAY_MS)

  for (const slot of slots) {
    const movie = sessionMovies[movieIndex % sessionMovies.length]
    movieIndex++

    // startTime: dia + horário do slot (UTC offset para BRT +3h)
    const startTime = new Date(dayBase)
    startTime.setUTCHours(slot.hour + 3, slot.min, 0, 0) // BRT → UTC

    const endTime = addMinutes(startTime, movie.durationMin + 20) // +20 min limpeza

    sessionsToInsert.push({
      movie: movie._id,
      room: slot.room,
      startTime,
      endTime,
      audioFormat: slot.audioFormat,
      projectionFormat: slot.projectionFormat,
      sessionType: 'regular',
    })
  }
}

const sessions = await Session.insertMany(sessionsToInsert)
console.log(`✔ ${sessions.length} sessões inseridas (${sessions.length / 10} por dia em média)`)

// Sumário por status
const byStatus = moviesData.reduce((acc, m) => {
  acc[m.status] = (acc[m.status] || 0) + 1
  return acc
}, {})
console.log('\nResumo dos filmes:')
for (const [status, count] of Object.entries(byStatus)) {
  console.log(`  ${status}: ${count}`)
}

await mongoose.disconnect()
console.log('\nSeed adicional concluído!')
