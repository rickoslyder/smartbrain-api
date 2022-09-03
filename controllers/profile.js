const getProfile = (db) => (req, res) => {
    const { id } = req.params
    db('users').select().where('id','=', id).then(profiles => {
        // if query result isn't an empty array
        if (profiles.length) {
            res.json(profiles[0])
        } else {
            res.status(400).json(`User id ${id} does not exist - please try again`)
        }
    }).catch(err => res.status(404).json(`Error retrieving user`, id))
}

const incrementEntries = (db) => (req, res) => {
    const { id } = req.body

    db('users').where('id','=',id).increment('entries',1).returning('entries').then(entries => {
        res.json(entries[0].entries)
        console.log(entries[0].entries)
    }).catch(err => res.status(400).json("Error updating entry count - please try again"))
}

module.exports = {
    getProfile: getProfile,
    incrementEntries: incrementEntries
}