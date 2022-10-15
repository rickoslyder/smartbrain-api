const winston = require('winston');
const redis = require('redis');
const jwt = require('jsonwebtoken')

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


const signToken = (email) => {
    const jwtPayload = { email };
    return jwt.sign(jwtPayload, 'JWTsecret', { expiresIn: '2 days' })
}

const setToken = async (key, value) => {
    return await redisClient.set(key,value)
}

const createSessions = async (res, user) => {
    const { email, id } = user;
    logger.info(`creating token for user id ${id} - email ${email}`)
    const token = signToken(email);
    try {
        await setToken(token, id);
        logger.info(`token created ${token}`)
        return res.json({ success: 'true', userId: id, token });
    } catch (message) {
        logger.error(`error - ${message}`);
    }
}

const handleRegister = (db, bcrypt) => (req, res) => {
    if (req.body.name && req.body.email && req.body.password) {
        const { name, email, password } = req.body
        const hash = bcrypt.hashSync(password)
        db.transaction(trx => {
                if (!trx.returning('*').select('*').from('users').where("email",'=',email)) {
                logger.info(`Registration attempt failed - Email ${email} already exists`)
                return res.status(400).json(`Email ${email} already exists`)
            }
            trx.insert({
                hash: hash,
                email: email
            })
            .into('logins')
            .returning('email')
            .then(loginEmail => {
                logger.info(`loginEmail = ${loginEmail}`)
                return trx('users')
                    .returning('*')
                    .insert({
                        name: name,
                        email: loginEmail[0].email,
                        joined: new Date()
                    })
                    .then(async(data) => {
                        const user = await data[0]
                        logger.info(`New user object = ${user}`)
                        return await createSessions(res, user)
                    })
            })
            .then(trx.commit)
            .catch(trx.rollback)
        }).catch(err => {
            logger.error(`Registration failed - error details: ${err}`)
            res.status(400).json("Registration failed - please try again")
        })
        
    } else {
        logger.error(`Registration failed - Form didn't have: ${req.body.name ? '' : 'name,'} ${req.body.email ? '' : 'email,'} ${req.body.password ? '' : 'password'}`)
        res.status(400).json("Registration failed - please try again")
    } 
}

module.exports = {
    handleRegister: handleRegister
}