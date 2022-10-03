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
    }).catch(err => res.status(400).json(`Error retrieving user`, id))
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

module.exports = {
    getProfile: getProfile,
    incrementEntries: incrementEntries
}