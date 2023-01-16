import './lib/setup.js'
import {
    getAllKeywords,
    insertKeywordRankings,
    insertKeywords,
    KEYWORD_RANKINGS_TABLE,
    KEYWORDS_TABLE,
} from './lib/db_queries.js'
import { logger } from './lib/logger.js'
import { getAllSitesSTAT, getSiteDataSTAT } from './lib/stat.js'
import connection from './lib/database.js'
import { datasetIdFromSite } from './lib/helpers.js'
import Sync from './lib/stat/sync.js'


async function main() {
    logger.info('Started')
    const sites = await getAllSitesSTAT()

    for (const site of sites) {
        try {
            const dbPrefix = datasetIdFromSite(site)
            const table = `${dbPrefix}_${KEYWORD_RANKINGS_TABLE}`
            const table2 = `${dbPrefix}_${KEYWORDS_TABLE}`

            connection.query(
                `DROP TABLE ??`,
                [table],
                (error, results, fields) => {
                    if (error) {
                        throw error
                    }
                },
            )

            connection.query(
                `DROP TABLE ??`,
                [table2],
                (error, results, fields) => {
                    if (error) {
                        throw error
                    }
                },
            )
        } catch (e) {
            logger.error(`Sync Error: #${site.Id}`, {
                error: e.message,
            })
        }
    }

    logger.info('Finished')
}


main()