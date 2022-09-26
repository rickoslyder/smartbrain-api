const winston = require('winston');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
      new winston.transports.Console(),
      new winston.transports.File({ filename: 'logfile.log' })
    ]
  });

const handleSignIn = (db, bcrypt) => (req, res) => {
    const { email, password } = req.body
    if (!email || !password) {
        logger.error(`Sign-in failed - Form didn't have: ${req.body.email ? '' : 'email,'} ${req.body.password ? '' : 'password'}`)
        res.status(400).json("Incorrect form submission - please try again")
    }
    db.transaction(trx => {
        trx.select('email','hash').from('logins').where('email', '=', email)
        .then(data => {
            bcrypt.compare(password, data[0].hash, (err, resp) => {
                if (err) {
                    winston.error(`Login failed (incorrect password) - error details: ${err}`)
                    res.status(400).json("Login failed - please try again")
                } else {
                    return data[0].email
                }
            })
        }).then(loginEmail => {
            return trx('users')
            .returning('*')
            .select('*')
            .where('email', '=', email)
        }).then(user => res.json(user[0])).then(trx.commit).catch(trx.rollback)
    }).catch(err => {console.log(err); res.status(400).json("Your username/password combination was invalid - please try again")})
}

module.exports = {
    handleSignIn: handleSignIn
}