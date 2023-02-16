import { logger } from './logger'
import { getAllSitesSTAT } from './stat'
/* Importing the `datasetIdFromSite` function from the `helpers.js` file. */
import { datasetIdFromSite } from './helpers'
import Sync from './stat/sync'

import Sentry from './sentry'
import { createNewPool } from './database'
import { Site } from '../types/stat'
import { Pool } from 'mysql'

/**
 * It creates a new Sync object, creates the necessary tables, initializes the sync, syncs the keywords, and syncs the
 * rankings
 *
 * @param site - The site to sync.
 * @param connection - The connection to the database.
 */
async function syncSite(site: Site, connection: Pool) {
    const dbPrefix = datasetIdFromSite(site)
    const sync = new Sync(dbPrefix, site, connection)

    await sync.createTables()
    await sync.init()
    await sync.syncKeywords()
    await sync.syncRankings()
}

/**
 * It gets all the sites from the STAT API, then for each site, it syncs the site's data to the database
 */
export default async function syncSites() {
    logger.info('Started')

    const transaction = Sentry?.startTransaction({
        op: 'sync',
        name: 'Sync Sites',
    })

    const sites = await getAllSitesSTAT()
    const errors: {
        siteId?: string,
        siteURL?: string,
        error: string,
    }[] = []
    const connection = createNewPool()

    if (sites) {
        const promises = sites.map((site) =>
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
                }))


        try {
            const result = await Promise.allSettled(promises)
            const rejected = result?.filter(({ status }) => status !== 'fulfilled')
            logger.info('allSettled results',
                {
                    sites: sites.length,
                    fulfilled: result.length - rejected.length,
                    rejected: rejected.length,
                },
            )
        } catch (e) {
            Sentry?.captureException(e)
        }
    }

    logger.info('Finished')
    transaction?.finish()
    connection.end()
}