import { logger } from '../logger'
import { getSiteDataSTAT } from '../stat'
import { createTables, insertKeywordRankings, insertKeywords } from '../db_queries'
import { Keyword, Site } from '../../types/stat'
import { Pool } from 'mysql'
import { KeywordInsert, KeywordRankingInsert } from '../../types/db'


/* It takes a site object, gets all the keywords from the STAT API, and inserts them into the database */
export default class Sync {
    static ROW_LIMIT = 5000

    private readonly databasePrefix: string
    private readonly site: Site
    private readonly connection: Pool

    private keywords: Keyword[] = []

    constructor(databasePrefix: string, site: Site, connection: Pool) {
        this.databasePrefix = databasePrefix
        this.site = site
        this.connection = connection
    }

    /**
     * This function gets all keywords from the STAT API and stores them in the `keywords` property
     */
    async retrieveKeywords() {
        //get all keywords
        let finished = false
        let startRow = 0

        //data for synced schedule
        const results = {
            total: 0,
        }

        let keywords: Keyword[] = []

        while (!finished) {
            const res = await getSiteDataSTAT(this.site.Id, startRow, Sync.ROW_LIMIT)

            const noResults = res.resultsreturned === '0'

            if (res && res.Result?.length) {
                keywords = [...keywords, ...res.Result]
                results.total += res.Result.length

                if (keywords.length >= parseInt(res.totalresults)) {
                    finished = true
                } else if (!noResults) {
                    startRow += Sync.ROW_LIMIT
                }
            } else {
                finished = true
            }
        }

        this.keywords = keywords

        logger.info(
            `Found ${this.keywords.length} keywords in to ${this.databasePrefix}`,
        )
    }

    createTables() {
        return createTables(this.connection, this.databasePrefix)
    }

    /**
     * It takes the keywords from the site object and inserts them into the database
     * @returns The syncRankings function is being returned.
     */
    async syncKeywords() {
        if (!this.keywords.length) {
            logger.error('Missing Keywords')
            throw Error('Missing Keywords')
        }

        const site = this.site
        logger.info(`Started syncKeywords for db: ${this.databasePrefix} - #${site.Id}`)

        const keywords = this.keywords
        const keywordInserts: KeywordInsert[] = keywords.map((keyword) => ({
            'SiteID': parseInt(site.Id),
            'ID': parseInt(keyword.Id),
            'Keyword': keyword?.Keyword || '',
            'KeywordMarket': keyword?.KeywordMarket || '',
            'KeywordLocation': keyword?.KeywordLocation || '',
            'KeywordDevice': keyword?.KeywordDevice || '',
            'KeywordTranslation': keyword?.KeywordTranslation || '',
            'KeywordTags': keyword?.KeywordTags || '',
            'GlobalSearchVolume': parseInt(keyword?.KeywordStats?.GlobalSearchVolume) || 0,
            'RegionalSearchVolume': parseInt(keyword?.KeywordStats?.RegionalSearchVolume) || 0,
            'CreatedAt': keyword?.CreatedAt || '',
        }))

        logger.info(`Site #${site.Id} : keywords to insert`, {
            keywords: keywordInserts.length,
        })

        const result = await insertKeywords(this.connection, this.databasePrefix, keywordInserts)
        logger.info(`Site #${site.Id} : keywords`, {
            message: result.message,
            affectedRows: result.affectedRows,
            changedRows: result.changedRows,
        })
        logger.info(`Finished for #${site.Id}`)

        return this.syncRankings()
    }

    /**
     * It takes the keywords from the site object, and inserts them into the database
     * @returns An array of objects
     */
    async syncRankings() {
        if (!this.keywords.length) {
            logger.error('Missing Keywords')
            throw Error('Missing Keywords')
        }

        const site = this.site

        const rankingInserts: KeywordRankingInsert[] = []
        for (const keyword of this.keywords) {
            if (keyword?.KeywordRanking?.date) {
                const rankingInsert: KeywordRankingInsert = {
                    'SiteID': parseInt(site.Id),
                    'KeywordID': parseInt(keyword.Id),
                    'date': keyword?.KeywordRanking?.date || '',
                    'Rank': parseInt(keyword?.KeywordRanking?.Google?.Rank) || 0,
                    'BaseRank': parseInt(keyword?.KeywordRanking?.Google?.BaseRank) || 0,
                    'Url': keyword?.KeywordRanking?.Google?.Url || '',
                }
                rankingInserts.push(rankingInsert)
            }
        }

        logger.info(`Site #${site.Id} : rankings`, {
            rankings: rankingInserts.length,
        })

        if (rankingInserts.length) {
            logger.info(`Started syncRankings for db: ${this.databasePrefix} - #${site.Id}`)
            return insertKeywordRankings(this.connection, this.databasePrefix, rankingInserts).then(r => {
                logger.info(`Finished syncRankings for db: ${this.databasePrefix} - #${site.Id}`)
                return r
            })
        }

        logger.info(`No rankings to sync ${this.databasePrefix} - #${site.Id}`)
    }
}