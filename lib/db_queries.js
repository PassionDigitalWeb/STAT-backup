import connection, { KEYWORDS_TABLE } from './database.js'

function runQuery(query, values = []) {
    return new Promise((resolve, reject) => {
        try {
            connection.query(
                query,
                values,
                (error, results, fields) => {
                    if (error) throw error
                    resolve(results)
                },
            )
        } catch (e) {
            console.error(e.message)
            reject(e.message)
        }
    })
}

export function getAllKeywords(siteID = null) {

    let query = `SELECT * FROM ${KEYWORDS_TABLE}`

    if (siteID) {
        query += ` WHERE SiteID = ${siteID}`
    }

    return runQuery(query)
}


export function insertKeywords(keywords) {

    // `SiteID` INT NULL NOT NULL,
//     `Keyword` VARCHAR(100) NULL DEFAULT NULL,
//     `KeywordMarket` VARCHAR(100) NULL DEFAULT NULL,
//     `KeywordLocation` VARCHAR(100) NULL DEFAULT NULL,
//     `KeywordDevice` VARCHAR(100) NULL DEFAULT NULL,
//     `KeywordTranslation` VARCHAR(100) NULL DEFAULT NULL,
//     `KeywordTags` VARCHAR(100) NULL DEFAULT NULL,
//     `GlobalSearchVolume` VARCHAR(100) NULL DEFAULT NULL,
//     `RegionalSearchVolume` VARCHAR(100) NULL DEFAULT NULL,
//     `date` DATE,
//     `KeywordRanking_Rank` VARCHAR(100) NULL DEFAULT NULL,
//     `KeywordRanking_BaseRank` VARCHAR(100) NULL DEFAULT NULL,
//     `KeywordRanking_Url` VARCHAR(200) NULL DEFAULT NULL,
//     `CreatedAt` DATE

    const keywordInserts = []
    for (const keyword of keywords) {
        if (!keyword.SiteID) {
            throw Error('Missing SiteID')
        }

        if (!keyword.ID) {
            throw Error('Missing ID')
        }

        const insert = {
            'SiteID': keyword.SiteID,
            'ID': keyword.ID,
            'Keyword': keyword.Keyword || '',
            'KeywordMarket': keyword.KeywordMarket || '',
            'KeywordLocation': keyword.KeywordLocation || '',
            'KeywordDevice': keyword.KeywordDevice || '',
            'KeywordTranslation': keyword.KeywordTranslation || '',
            'KeywordTags': keyword.KeywordTags || '',
            'GlobalSearchVolume': keyword.GlobalSearchVolume || '',
            'RegionalSearchVolume': keyword.RegionalSearchVolume || '',
            'date': keyword.date || '',
            'KeywordRanking_Rank': keyword.KeywordRanking_Rank || '',
            'KeywordRanking_BaseRank': keyword.KeywordRanking_BaseRank || '',
            'KeywordRanking_Url': keyword.KeywordRanking_Url || '',
            'CreatedAt': keyword.CreatedAt || '',
        }

        keywordInserts.push(insert)
    }

    let query = `REPLACE INTO ${KEYWORDS_TABLE} SET ?`

    return runQuery(query, keywordInserts)
}



