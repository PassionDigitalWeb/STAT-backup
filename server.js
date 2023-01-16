import "./lib/setup.js";
import express from "express";
import syncSites from './lib/actions.js'

const app = express()

const PORT = process.env.PORT || 8080
app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Server listening on port ${PORT}...`)
})

// ensure that request comes from cron
function isCron(req, res, next) {
    if (req.header('X-Appengine-Cron') !== 'true') {
        res.status(403).send('Cron only endpoint')
        next()
        return false
    }

    return true
}

app.get('/synchronize', (req, res, next) => {
    if (isCron(req, res, next)) {
        syncSites()
        res.send('syncing sites!')
    }
})