import { logger } from './logger'
import { OkPacket, Pool } from 'mysql'

import { KeywordInsert, KeywordRankingInsert } from '../types/db'

export const KEYWORDS_TABLE = `Keywords`
export const KEYWORD_RANKINGS_TABLE = `KeywordRankings`

function runQuery(conn: Pool, query: string, values: any[] = []): Promise<OkPacket> {
    return new Promise((resolve, reject) => {
        try {
            conn.query(
                query,
                values,
                (error, results, fields) => {
                    if (error) {
                        throw error
                    }
                    resolve(results)
                },
            )
        } catch (e: any) {
            logger.error('runQuery', e)
            reject(e.message)
        }
    })
}

export function getAllKeywords(conn: Pool, siteID = null) {

    let query = `SELECT * FROM ${KEYWORDS_TABLE}`

    if (siteID) {
        query += ` WHERE SiteID = ${siteID}`
    }

    return runQuery(conn, query)
}

export async function createTables(conn: Pool, database_prefix: string) {
    const keywordsTable = `${database_prefix}_${KEYWORDS_TABLE}`
    const createKeywordsQuery = `
        CREATE TABLE IF NOT EXISTS  \`${keywordsTable}\`
            (
                ID INT NOT NULL PRIMARY KEY,
                \`SiteID\` INT NOT NULL,
                \`Keyword\` VARCHAR(100) NULL DEFAULT NULL,
                \`KeywordMarket\` VARCHAR(100) NULL DEFAULT NULL,
                \`KeywordLocation\` VARCHAR(100) NULL DEFAULT NULL,
                \`KeywordDevice\` VARCHAR(100) NULL DEFAULT NULL,
                \`KeywordTranslation\` VARCHAR(100) NULL DEFAULT NULL,
                \`KeywordTags\` VARCHAR(1000) NULL DEFAULT NULL,
                \`GlobalSearchVolume\` INT NULL DEFAULT 0,
                \`RegionalSearchVolume\` INT NULL DEFAULT 0,
                \`CreatedAt\` DATE
            );
        `

    await runQuery(conn, createKeywordsQuery)

    const keywordRankingTable = `${database_prefix}_${KEYWORD_RANKINGS_TABLE}`
    const createKeywordRankingsQuery = `
        CREATE TABLE IF NOT EXISTS \`${keywordRankingTable}\`
            (
                ID VARCHAR(100) NOT NULL UNIQUE,
                \`SiteID\` INT NOT NULL,
                \`KeywordID\` INT NOT NULL,
                \`Rank\` INT NULL DEFAULT 0,
                \`BaseRank\` INT NULL DEFAULT 0,
                \`Url\` VARCHAR(1000) NULL DEFAULT NULL,
                \`date\` DATE DEFAULT NULL,
                \`CreatedAt\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, 
                PRIMARY KEY (ID)
            );
        `

    await runQuery(conn, createKeywordRankingsQuery)
}

export function insertKeywords(conn: Pool, database_prefix: string, keywords: KeywordInsert[]) {

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
//     `CreatedAt` DATE


    const keywordInserts: KeywordInsert[] = []
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
            'GlobalSearchVolume': keyword.GlobalSearchVolume || 0,
            'RegionalSearchVolume': keyword.RegionalSearchVolume || 0,
            'CreatedAt': keyword.CreatedAt || '',
        }

        keywordInserts.push((Object as any).values(insert))
    }

    const insertKeys = [
        'SiteID',
        'ID',
        'Keyword',
        'KeywordMarket',
        'KeywordLocation',
        'KeywordDevice',
        'KeywordTranslation',
        'KeywordTags',
        'GlobalSearchVolume',
        'RegionalSearchVolume',
        'CreatedAt',
    ]

    const table = `${database_prefix}_${KEYWORDS_TABLE}`

    const query = `REPLACE INTO \`${table}\`(??) VALUES ?`

    return runQuery(conn, query, [insertKeys, keywordInserts])
}


export function insertKeywordRankings(conn: Pool, database_prefix: string, rankings: KeywordRankingInsert[]) {
    const rankingInserts = []
    for (const rank of rankings) {
        if (!rank.SiteID) {
            throw Error('Missing SiteID')
        }

        const insert = {
            'ID': `${rank.date}_${rank.KeywordID}`,
            'SiteID': rank.SiteID,
            'KeywordID': rank.KeywordID,
            'Rank': rank.Rank || 0,
            'BaseRank': rank.BaseRank || 0,
            'Url': rank.Url || '',
            'date': rank.date,
        }

        rankingInserts.push(Object.values(insert))
    }

    const insertKeys = [
        'ID',
        'SiteID',
        'KeywordID',
        'Rank',
        'BaseRank',
        'Url',
        'date',
    ]

    const table = `${database_prefix}_${KEYWORD_RANKINGS_TABLE}`
    const query = `REPLACE INTO \`${table}\`(??) VALUES ?`

    return runQuery(conn, query, [insertKeys, rankingInserts])
}


