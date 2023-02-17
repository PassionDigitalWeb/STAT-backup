import 'module-alias/register'
import '@lib/setup'

import express, { NextFunction, Request, Response } from 'express'
import syncSites from '@lib/actions'
import { isAppEngineCron } from '@lib/middleware'

const app = express()
const PORT = process.env.PORT || 8080

app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Server listening on port ${PORT}...`)
})

// ensure that request comes from app engine cron
if (process.env.NODE_ENV === 'production') {
    app.use(isAppEngineCron)
}

app.get('/synchronize', (req: Request, res: Response, next: NextFunction) => {
    syncSites()
    res.send('syncing sites!')
})
