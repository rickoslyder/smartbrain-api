const redisClient = require('./signin').redisClient

const requireAuth = async (req, res, next) => {
    const { authorization } = req.headers;
    if (!authorization) {
        return res.status(401).json('Unauthorized')
    }
    
    const data = await redisClient.get(authorization).then(data => data)
    if (!data) {
        return res.status(401).json('Unauthorized')
    }
    
    return next();
}
module.exports = {
    requireAuth: requireAuth
}