import { logger } from './logger.js'
import { getAllSitesSTAT } from './stat.js'
import { datasetIdFromSite } from './helpers.js'
import Sync from './stat/sync.js'

import { sendErrorEmail } from './email.js'
import Sentry from './sentry.js'
import { createNewPool } from './database.js'

async function syncSite(site, connection) {
    const dbPrefix = datasetIdFromSite(site)
    const sync = new Sync(dbPrefix, site, connection)

    await sync.createTables()
    await sync.init()
    await sync.syncKeywords()
    await sync.syncRankings()
}

export default async function syncSites() {
    logger.info('Started')

    const transaction = Sentry?.startTransaction({
        op: 'sync',
        name: 'Sync Sites',
    })

    const sites = await getAllSitesSTAT()
    const errors = []
    const connection = createNewPool();

    if (sites) {
        const promises = []

        for (const site of sites) {
            const promise = new Promise(async (resolve, reject) => {
                try {
                    await syncSite(site, connection)
                    resolve(site.Url)
                } catch (e) {
                    reject(e)
                }
            }).catch((e) => {
                Sentry?.captureException(e, {
                    extra: {
                        siteId: site.Id,
                        siteURL: site.Url,
                    },
                })

                logger.error(`Sync Error: #${site.Id}`, {
                    error: e.message,
                })

                errors.push({
                    siteId: site.Id,
                    siteURL: site.Url,
                    error: e.message,
                })

                throw e
            })
            promises.push(promise)
        }

        try {
            const result = await Promise.allSettled(promises)
            logger.info(result)
        } catch (e) {
            Sentry?.captureException(e)
        }
    }

    if (process.env.EMAIL_ERRORS && errors.length) {
        const htmlErrors = errors.map(({ siteId, siteURL, error }) => {
            const errorsHTML = `<li>${error}</li>`
            return `<b>Site : #${siteId} - ${siteURL}</b>` + `<p>${errorsHTML}</p><br/>`
        })

        await sendErrorEmail({
            subject: 'Error while syncing',
            html: htmlErrors.join(''),
        })
    }

    logger.info('Finished')
    transaction?.finish()
    connection.end();
}