import { logger } from './logger.js'
import { getAllSitesSTAT } from './stat.js'
import { datasetIdFromSite } from './helpers.js'
import Sync from './stat/sync.js'
import connection from './database.js'
import { sendErrorEmail } from './email.js'

export default async function syncSites() {
    logger.info('Started')
    const sites = await getAllSitesSTAT()
    const errors = [];

    for (const site of sites) {
        try {
            const dbPrefix = datasetIdFromSite(site)
            const sync = new Sync(dbPrefix, site)
            await sync.init()
            await sync.createTables()
            await sync.syncKeywords()
            await sync.syncRankings()
        } catch (e) {
            logger.error(`Sync Error: #${site.Id}`, {
                error: e.message,
            })
            errors.push({
                siteId: site.Id,
                siteURL: site.Url,
                error: e.message,
            })
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

    connection.end()
    logger.info('Finished')
}