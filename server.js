import "./lib/setup";
import express from "express";
import {addSitesToGBQ, syncGSCtoGBQ} from "./lib/actions";

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

app.get('/setup-sites', (req, res, next) => {
    if (isCron(req, res, next)) {
        addSitesToGBQ()
        res.send('setup new sites!')
    }
})

app.get('/synchronize', (req, res, next) => {
    if (isCron(req, res, next)) {
        syncGSCtoGBQ()
        res.send('syncing sites!')
    }
})