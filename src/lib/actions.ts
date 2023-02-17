import { Pool } from 'mysql'
import { Site } from '@app-types/stat'
import { createNewPool } from '@lib/database'
import { datasetIdFromSite } from '@lib/helpers'
import { logger } from '@lib/logger'
import Sentry from '@lib/sentry'
import { getAllSitesSTAT } from '@lib/stat'
import Sync from '@lib/stat/sync'

/**
 * It creates the tables, retrieves the keywords, syncs the keywords, and syncs the rankings
 *
 * @param {Site} site - Site - this is the site object that we created earlier.
 * @param {Pool} connection - This is the connection to the database.
 */
async function syncSite(site: Site, connection: Pool) {
    const dbPrefix = datasetIdFromSite(site)
    const sync = new Sync(dbPrefix, site, connection)

    await sync.createTables()
    await sync.retrieveKeywords()
    await sync.syncKeywords()
    await sync.syncRankings()
}

/**
 * It gets all the sites from the STAT API, then for each site, it syncs the site's data to the database
 */
export default async function syncSites() {
    logger.info('Started')

    /* Creating a new transaction in Sentry. */
    const transaction = Sentry?.startTransaction({
        op: 'sync',
        name: 'Sync Sites',
    })

    const sites = await getAllSitesSTAT()
    const connection = createNewPool()

    if (sites) {
        try {
            const syncSitePromises = sites.map((site) =>
                syncSite(site, connection)
                    .then(() => site.Url)
                    .catch((e) => {
                        Sentry?.captureException(e, {
                            extra: {
                                siteId: site.Id,
                                siteURL: site.Url,
                            },
                        })

                        logger.error(`Sync Error: #${site.Id}`, {
                            error: e.message,
                        })

                        return Promise.reject(e)
                    })
            )

            const result = await Promise.allSettled(syncSitePromises)
            const rejected = result?.filter(
                ({ status }) => status !== 'fulfilled'
            )

            logger.info('allSettled results', {
                sites: sites.length,
                fulfilled: result.length - rejected.length,
                rejected: rejected.length,
            })
        } catch (e) {
            Sentry?.captureException(e)
        }
    }

    logger.info('Finished')
    transaction?.finish()
    connection.end()
}
