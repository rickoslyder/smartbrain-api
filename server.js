const express = require('express')
const bcrypt = require('bcrypt-nodejs')
const cors = require('cors');
const pg = require('pg')
const knex = require('knex')

const register = require('./controllers/register')
const signIn = require('./controllers/signin')
const profile = require('./controllers/profile')
const image = require('./controllers/image.js')

const db = knex({
    client: 'pg',
    connection: {
      host : process.env.DATABASE_URL,
      ssl: true
    }
  });

const app = express()

app.use(express.urlencoded({extended: false}));
app.use(express.json());
app.use(cors())

app.get('/', (req, res) => { res.send('success') })

app.post('/signin', signIn.handleSignIn(db,bcrypt))

app.post('/register', register.handleRegister(db,bcrypt))

app.get('/profile/:id', profile.getProfile(db))

app.post('/facedetect', image.handleFaceDetectApiCall())

app.put('/image', profile.incrementEntries(db))


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

