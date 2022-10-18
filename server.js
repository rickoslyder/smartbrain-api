const express = require('express')
const bcrypt = require('bcrypt-nodejs')
const cors = require('cors');
const pg = require('pg')
const knex = require('knex')
const redis = require('redis');
const helmet = require('helmet')
const winston = require('winston')
const morgan = require('morgan')
const compression = require('compression')

const register = require('./controllers/register')
const signIn = require('./controllers/signin')
const profile = require('./controllers/profile')
const image = require('./controllers/image.js')
const auth = require('./controllers/authorization')
// process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0; 

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logfile.log' })
  ]
});

(async () => {
 const redisClient = redis.createClient({
  url: process.env.REDIS_URI
});

redisClient.on("error", console.error)

await redisClient.connect()

await redisClient.set("key", "value");
const value = await redisClient.get('key')
console.log(value)
})()


const db = knex({
    client: 'pg',
    connection: {
      connectionString : process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    }
  });

const app = express()

app.use(morgan('combined'))
app.use(express.urlencoded({extended: false}));
app.use(express.json());
app.use(cors());
app.use(helmet())
app.use(compression())

app.get('/', (req, res) => { res.send('success') })

app.post('/signin', signIn.signinAuthentication(db,bcrypt))

app.post('/register', register.handleRegister(db,bcrypt))

app.get('/profile/:id', auth.requireAuth, profile.getProfile(db))

app.post('/profile/:id', auth.requireAuth, profile.updateProfile(db))

app.post('/facedetect', auth.requireAuth, image.handleFaceDetectApiCall())

app.put('/image', auth.requireAuth, profile.incrementEntries(db))

/*
/ --> res = this is working
/signin --> POST = success/fail
/register --> POST = new user object
/profile/:userId --> GET = user
/image --> PUT --> user/count object
*/

// console.log(process.env)

const PORT = process.env.PORT

app.listen(process.env.PORT || 3000, () => {
    console.log(`App is running on port ${PORT}`)
})

