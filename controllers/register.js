
const handleRegister = (db, bcrypt) => (req, res) => {
    if (req.body.name && req.body.email && req.body.password) {
        const { name, email, password } = req.body
        const hash = bcrypt.hashSync(password)
        db.transaction(trx => {
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
            console.log(err)
            res.status(400).json("Registration failed - please try again")
        })
        
    } else {
        res.status(400).json("Registration failed - please try again")
    } 
}

module.exports = {
    handleRegister: handleRegister
}