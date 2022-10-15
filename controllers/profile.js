const winston = require('winston');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
      new winston.transports.Console(),
      new winston.transports.File({ filename: 'logfile.log' })
    ]
  });

const getProfile = (db) => (req, res) => {
    const { id } = req.params
    db('users').select().where('id','=', id).then(profiles => {
        // if query result isn't an empty array
        if (profiles.length) {
            logger.info(`Successfully fetched profile for user id ${id}`)
            res.json(profiles[0])
        } else {
            logger.error(`Attempt to fetch user ${id} failed - no results found`)
            res.status(400).json(`User id ${id} does not exist - please try again`)
        }
    }).catch(err => res.status(400).json(`Error retrieving user ${id}`))
}

const incrementEntries = (db) => (req, res) => {
    const { id } = req.body

    db('users').where('id','=',id).increment('entries',1).returning('entries').then(entries => {
        res.json(entries[0].entries)
        logger.info(`Successfully updated user id ${id} entries count - ${entries[0].entries}`)
    }).catch(err => {
        logger.error(`Failed to increment entries for user id ${id} - error: ${err}`)
        res.status(400).json("Error updating entry count - please try again")
    })
}

const updateProfile = (db) => (req, res) => {
    const { id } = req.params
    console.log(id)
    if (req.body.name || req.body.age || req.body.pet || req.body.email) {
        const { name, age, pet, email } = req.body
        db('users').returning('*').where('id','=', id).update({
            ...(name !== '' && {name: name}),
            ...(age !== '' && {age: age}),
            ...(pet !== '' && {pet: pet}),
            ...(email !== '' && {email: email})
        })
            .then(profiles => {
            // if query result isn't an empty array
            if (profiles.length) {
                logger.info(`Successfully updated profile for user id ${id}`)
                res.status(200).json(profiles[0])
            } else {
                logger.error(`Attempt to update user ${id} failed - no results found`)
                res.status(400).json(`Error updating user id ${id} - please try again`)
            }
        }).catch(err => res.status(400).json(`Error updating user ${id}`))
    } else {
        logger.error(`Profile update failed - no name, age or pet was specified}`)
        res.status(400).json("Profile update failed - invalid input, please try again")
    }
}

module.exports = {
    getProfile: getProfile,
    incrementEntries: incrementEntries,
    updateProfile: updateProfile
}