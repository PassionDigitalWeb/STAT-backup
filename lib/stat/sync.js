import { logger } from '../logger.js'
import { getAllSitesSTAT, getSiteDataSTAT } from '../stat.js'
import { insertKeywordRankings, insertKeywords } from '../db_queries.js'


// - get all sites
// - for each site, get all keywords
// - for each keyword, get rankings from previous day.
export default class Sync {
    //TODO: Error check
    //TODO: Recursion for sites with lots of keywords
    #databasePrefix

    constructor(databasePrefix) {
        this.databasePrefix = databasePrefix
    }

    createTables() {
        //TODO: create keywords and ranking tables with databasePrefix
    }

    async sync() {
        logger.info('Started')
        const sites = await getAllSitesSTAT()

        for (const site of sites) {
            const res = await getSiteDataSTAT(site.Id)

            const keywords = res.Result
            const keywordInserts = []

            for (const keyword of keywords) {
                try {
                    const insert = {
                        'SiteID': site.Id,
                        'ID': keyword.Id,
                        'Keyword': keyword.Keyword || '',
                        'KeywordMarket': keyword.KeywordMarket || '',
                        'KeywordLocation': keyword.KeywordLocation || '',
                        'KeywordDevice': keyword.KeywordDevice || '',
                        'KeywordTranslation': keyword.KeywordTranslation || '',
                        'KeywordTags': keyword.KeywordTags || '',
                        'GlobalSearchVolume': keyword.KeywordStats.GlobalSearchVolume || '',
                        'RegionalSearchVolume': keyword.KeywordStats.RegionalSearchVolume || '',
                        'CreatedAt': keyword.CreatedAt || '',
                    }

                    keywordInserts.push(insert)
                } catch (e) {
                    logger.error(e.message)
                }
            }

            logger.info(`Site #${site.Id}`, {
                keywords: keywordInserts.length,
            })

            if (keywordInserts.length) {
                const result = await insertKeywords(this.databasePrefix, keywordInserts)
                console.log({ keywords: result })

                //TODO: sync rankings
                this.syncRankings(site.Id, keywords)
            }
        }

        logger.info('Finished')
    }

    //TODO: Error check
    //TODO: Recursion for sites with lots of keywords
    async syncRankings(siteID, keywords) {
        logger.info('Started')

        for (const keyword of keywords) {
            try {
                if (keyword?.KeywordRanking?.date) {
                    const rankingInsert = {
                        'SiteID': siteID,
                        'KeywordID': keyword.Id,
                        'date': keyword.KeywordRanking.date || '',
                        'Rank': keyword.KeywordRanking.Google.Rank || '',
                        'BaseRank': keyword.KeywordRanking.Google.BaseRank || '',
                        'Url': keyword.KeywordRanking.Google.Url || '',
                    }
                    rankingInserts.push(rankingInsert)
                }
            } catch (e) {
                logger.error(e.message)
            }
        }

        logger.info(`Site #${siteID}`, {
            rankings: rankingInserts.length,
        })

        if (rankingInserts.length) {
            const result = await insertKeywordRankings(this.databasePrefix, rankingInserts)
            console.log({ rankings: result })
        }

        logger.info('Finished')
    }
}