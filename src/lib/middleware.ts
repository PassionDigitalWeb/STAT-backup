import { NextFunction, Request, Response } from 'express'
import { logger } from '@lib/logger'

export function isAppEngineCron(
    req: Request,
    res: Response,
    next: NextFunction
) {
    if (req.header('X-Appengine-Cron') !== 'true') {
        res.status(403)
        logger.error('Cron only endpoint')
    } else {
        next()
    }
}
