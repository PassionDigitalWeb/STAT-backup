import { logger } from '../logger.js'
import { getSiteDataSTAT } from '../stat.js'
import { createTables, insertKeywordRankings, insertKeywords } from '../db_queries.js'


// - get all sites
// - for each site, get all keywords
// - for each keyword, get rankings from previous day.
export default class Sync {
    static ROW_LIMIT = 5000
    //TODO: Error check
    //TODO: Recursion for sites with lots of keywords
    #databasePrefix
    #site
    #keywords = []

    constructor(databasePrefix, site) {
        this.#databasePrefix = databasePrefix
        this.#site = site
    }

    async init() {

        //get all keywords
        let finished = false
        let startRow = 0
        let iteration = 0

        //data for synced schedule
        const results = {
            total: 0,
        }

        let keywords = []

        while (!finished) {
            iteration++

            const res = await getSiteDataSTAT(this.#site.Id, startRow, Sync.ROW_LIMIT)

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

        this.#keywords = keywords

        logger.info(
            `Found ${this.#keywords.length} keywords in to ${this.#databasePrefix}`,
        )
    }

    createTables() {
        return createTables(this.#databasePrefix)
    }

    async syncKeywords() {
        if (!this.#keywords.length) {
            logger.error('Missing Keywords')
            throw Error('Missing Keywords')
        }

        const site = this.#site
        logger.info(`Started syncKeywords for db: ${this.#databasePrefix} - #${site.Id}`)

        const keywords = this.#keywords
        const keywordInserts = []

        for (const keyword of keywords) {
            const insert = {
                'SiteID': parseInt(site.Id),
                'ID': parseInt(keyword.Id),
                'Keyword': keyword?.Keyword || '',
                'KeywordMarket': keyword?.KeywordMarket || '',
                'KeywordLocation': keyword?.KeywordLocation || '',
                'KeywordDevice': keyword?.KeywordDevice || '',
                'KeywordTranslation': keyword?.KeywordTranslation || '',
                'KeywordTags': keyword?.KeywordTags || '',
                'GlobalSearchVolume': keyword?.KeywordStats?.GlobalSearchVolume || '',
                'RegionalSearchVolume': keyword?.KeywordStats?.RegionalSearchVolume || '',
                'CreatedAt': keyword?.CreatedAt || '',
            }

            keywordInserts.push(insert)
        }

        logger.info(`Site #${site.Id} : keywords to insert`, {
            keywords: keywordInserts.length,
        })

        if (keywordInserts.length) {
            const result = await insertKeywords(this.#databasePrefix, keywordInserts)
            logger.info(`Site #${site.Id} : keywords`, {
                message: result.message,
                affectedRows: result.affectedRows,
                changedRows: result.changedRows,
            })
            logger.info(`Finished for #${site.Id}`)
            return this.syncRankings(site.Id, keywords)
        }
    }


    //TODO: Error check
    //TODO: Recursion for sites with lots of keywords
    async syncRankings() {
        if (!this.#keywords.length) {
            logger.error('Missing Keywords')
            throw Error('Missing Keywords')
        }

        const site = this.#site

        const rankingInserts = []
        for (const keyword of this.#keywords) {
            if (keyword?.KeywordRanking?.date) {
                const rankingInsert = {
                    'SiteID': parseInt(site.Id),
                    'KeywordID': parseInt(keyword.Id),
                    'date': keyword?.KeywordRanking?.date || '',
                    'Rank': keyword?.KeywordRanking?.Google?.Rank || '',
                    'BaseRank': keyword?.KeywordRanking?.Google?.BaseRank || '',
                    'Url': keyword?.KeywordRanking?.Google?.Url || '',
                }
                rankingInserts.push(rankingInsert)
            }
        }

        logger.info(`Site #${site.Id} : rankings`, {
            rankings: rankingInserts.length,
        })

        if (rankingInserts.length) {
            logger.info(`Started syncRankings for db: ${this.#databasePrefix} - #${site.Id}`)
            return insertKeywordRankings(this.#databasePrefix, rankingInserts).then(r => {
                logger.info(`Finished syncRankings for db: ${this.#databasePrefix} - #${site.Id}`)
                return r
            })
        }

        logger.info(`No rankings to sync ${this.#databasePrefix} - #${site.Id}`)
    }
}