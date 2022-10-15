const winston = require('winston');
const jwt = require('jsonwebtoken')
const redis = require('redis')

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
      new winston.transports.Console(),
      new winston.transports.File({ filename: 'logfile.log' })
    ]
  });

const redisClient = redis.createClient({
    url: process.env.REDIS_URI
});

redisClient.connect()
.then(logger.info('connected to redis'))


const handleSignIn = (db, bcrypt) => (req, res) => {
    const { email, password } = req.body
    if (!email || !password) {
        logger.error(`Sign-in failed - Form didn't have: ${req.body.email ? '' : 'email,'} ${req.body.password ? '' : 'password'}`)
        return Promise.reject("Incorrect form submission - please try again")
    }
    return db.transaction(trx => {
        trx.select('email','hash').from('logins').where('email', '=', email)
        .then(data => {
            bcrypt.compare(password, data[0].hash, (err, resp) => {
                if (err) {
                    winston.error(`Login failed (incorrect password) - error details: ${err}`)
                    Promise.reject("Login failed - please try again")
                } else {
                    return data[0].email
                }
            })
        }).then(loginEmail => {
            return trx('users')
            .returning('*')
            .select('*')
            .where('email', '=', email)
        }).then(user => user[0]).then(trx.commit).catch(trx.rollback)
    }).catch(err => {console.log(err); Promise.reject("Your username/password combination was invalid - please try again")})
}


const getAuthTokenId = async (req, res) => {
    const { authorization } = req.headers;
    logger.info(`auth token = ${authorization}`)
    try {
        const data = await redisClient.get(authorization).then((data) => {
            return data;
          });
        if (!data) {
            return res.status(401).json('Unauthorized')
        }
        logger.info(`grabbed token's id from redis`)
        return res.json({id: data})
    } catch (error) {
        logger.error(`failed to grab token's id from redis - ${error}`)
    }
}

const signToken = (email) => {
    const jwtPayload = { email };
    return jwt.sign(jwtPayload, 'JWTsecret', { expiresIn: '2 days' })
}

const setToken = async (key, value) => {
    return await redisClient.set(key,value)
}

const createSessions = async (user) => {
    const { email, id } = user;
    const token = signToken(email);
    try {
        await setToken(token, id);
        logger.info(`token created ${token}`)
        return { success: 'true', userId: id, token };
    } catch (message) {
        logger.error(`error - ${message}`);
    }
}


const signinAuthentication = (db, bcrypt) => (req, res) => {
    const { authorization } = req.headers;
    logger.info(authorization ? `session ${authorization}` : 'no existing session')
    return (authorization ? getAuthTokenId(req, res) : handleSignIn(db, bcrypt)(req, res).then(data => {
                                                   return (data.id && data.email ? createSessions(data) : Promise.reject(data))
                                                })
                                                .then(session => res.json(session))
                                                .catch(err => res.status(400).json(err)))
}

module.exports = {
    handleSignIn: handleSignIn,
    signinAuthentication: signinAuthentication,
    redisClient: redisClient
}