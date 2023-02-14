import "./lib/setup.js";
import express from "express";
import syncSites from './lib/actions.js'
import { isAppEngineCron } from './lib/middleware.js'

const app = express()

const PORT = process.env.PORT || 8080
app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Server listening on port ${PORT}...`)
})

// ensure that request comes from app engine cron
app.use(isAppEngineCron)

app.get('/synchronize', (req, res, next) => {
    syncSites()
    res.send('syncing sites!')
})