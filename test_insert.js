import './lib/setup.js'
import { getAllKeywords, insertKeywordRankings, insertKeywords } from './lib/db_queries.js'
import { logger } from './lib/logger.js'
import { getAllSitesSTAT, getSiteDataSTAT } from './lib/stat.js'
import connection from './lib/database.js'
import { datasetIdFromSite } from './lib/helpers.js'
import Sync from './lib/stat/sync.js'


async function main() {
    logger.info('Started')
    const sites = await getAllSitesSTAT()

    for (const site of sites) {
        const dbPrefix = datasetIdFromSite(site)
        const sync = new Sync(dbPrefix);
        sync.createTables()
        //sync.sync()
    }

    logger.info('Finished')
    connection.end()
}


main()