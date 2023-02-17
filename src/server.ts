import express, { Request, Response } from 'express'
import '@config/setup'
import CONFIG from '@root/config'
import syncSites from '@lib/actions'
import { logger } from '@lib/logger'
import { isAppEngineCron } from '@lib/middleware'

const app = express()
const PORT = CONFIG.PORT || 8080

app.listen(PORT, () => {
    logger.info(`Server listening on port ${PORT}...`)
})

// ensure that request comes from app engine cron
if (CONFIG.NODE_ENV === 'production') {
    app.use(isAppEngineCron)
}

app.get('/synchronize', async (req: Request, res: Response) => {
    try {
        const isProcessing = req.app.get('isProcessing')
        if (isProcessing) {
            logger.error('Syncing locked, cannot process request.')
            return res.status(400).send('Processing in progress, please wait.')
        }

        req.app.set('isProcessing', true)
        logger.info('Syncing locked')

        syncSites().then(() => {
            req.app.set('isProcessing', false)
            logger.info('Syncing unlocked')
        })

        res.send('syncing sites!')
    } catch (error) {
        logger.error('An error occurred while processing:', error)
        res.status(500).send('An error occurred while processing.')
    }
})
