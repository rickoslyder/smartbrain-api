const winston = require('winston');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
      new winston.transports.Console(),
      new winston.transports.File({ filename: 'logfile.log' })
    ]
  });

const handleRegister = (db, bcrypt) => (req, res) => {
    if (req.body.name && req.body.email && req.body.password) {
        const { name, email, password } = req.body
        const hash = bcrypt.hashSync(password)
        db.transaction(trx => {
            if (trx.select('*').from('users').where("email",'=',email)) {
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
                return trx('users')
                    .returning('*')
                    .insert({
                        name: name,
                        email: loginEmail[0].email,
                        joined: new Date()
                    })
                    .then(user => {
                        res.json(user[0])
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