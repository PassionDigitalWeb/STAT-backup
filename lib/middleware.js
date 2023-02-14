import { logger } from './logger.js'

export function isAppEngineCron(req, res, next) {
    if (req.header('X-Appengine-Cron') !== 'true') {
        res.status(403)
        logger.error('Cron only endpoint')
    } else {
        next()
    }
}