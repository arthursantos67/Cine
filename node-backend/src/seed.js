import 'dotenv/config'
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import User from './models/User.js'
import Genre from './models/Genre.js'
import Movie from './models/Movie.js'
import Room from './models/Room.js'

const MONGODB_URI = process.env.MONGODB_URI
if (!MONGODB_URI) {
  console.error('MONGODB_URI não definida')
  process.exit(1)
}

await mongoose.connect(MONGODB_URI)
console.log('Conectado ao MongoDB')

await Promise.all([
  User.deleteMany(),
  Genre.deleteMany(),
  Movie.deleteMany(),
  Room.deleteMany(),
])

const genres = await Genre.insertMany([
  { name: 'Ação' },
  { name: 'Drama' },
  { name: 'Comédia' },
  { name: 'Ficção Científica' },
  { name: 'Terror' },
  { name: 'Animação' },
])
console.log(`✔ ${genres.length} gêneros criados`)

const rooms = await Room.insertMany([
  { name: 'Sala 1', capacity: 120, experienceType: 'standard', basePrice: 25.00 },
  { name: 'Sala 2 VIP', capacity: 60, experienceType: 'vip', basePrice: 45.00 },
  { name: 'Sala IMAX', capacity: 200, experienceType: 'imax', basePrice: 60.00 },
])
console.log(`✔ ${rooms.length} salas criadas`)

const acao = genres.find((g) => g.name === 'Ação')
const ficSci = genres.find((g) => g.name === 'Ficção Científica')
const drama = genres.find((g) => g.name === 'Drama')

const movies = await Movie.insertMany([
  {
    title: 'Interestelar',
    synopsis: 'Uma equipe de exploradores viaja através de um buraco de minhoca no espaço na tentativa de garantir a sobrevivência da humanidade.',
    genres: [ficSci._id, drama._id],
    durationMin: 169,
    releaseDate: new Date('2014-11-07'),
    posterUrl: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
    status: 'em_cartaz',
    ageRating: '12',
    director: 'Christopher Nolan',
    isFeatured: true,
  },
  {
    title: 'Mad Max: Estrada da Fúria',
    synopsis: 'Em um mundo pós-apocalíptico, Max Rockatansky se junta à Furiosa para enfrentar o tirano Immortan Joe.',
    genres: [acao._id, ficSci._id],
    durationMin: 120,
    releaseDate: new Date('2015-05-15'),
    posterUrl: 'https://image.tmdb.org/t/p/w500/8tZYtuWezp8JbcsvHYO0O46tFbo.jpg',
    status: 'em_cartaz',
    ageRating: '16',
    director: 'George Miller',
    isFeatured: false,
  },
])
console.log(`✔ ${movies.length} filmes criados`)

const passwordHash = await bcrypt.hash('master123', 12)
const users = await User.insertMany([
  {
    email: 'master@cineprime.com',
    username: 'master',
    password: passwordHash,
    role: 'master',
  },
  {
    email: 'staff@cineprime.com',
    username: 'staff',
    password: await bcrypt.hash('staff123', 12),
    role: 'staff',
  },
])
console.log(`✔ ${users.length} usuários criados`)
console.log('\nCredenciais:')
console.log('  master@cineprime.com / master123  (role: master)')
console.log('  staff@cineprime.com  / staff123   (role: staff)')

await mongoose.disconnect()
console.log('\nSeed concluído!')
