"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.insertKeywordRankings = exports.insertKeywords = exports.createTables = exports.getAllKeywords = exports.KEYWORD_RANKINGS_TABLE = exports.KEYWORDS_TABLE = void 0;
const logger_1 = require("./logger");
exports.KEYWORDS_TABLE = `Keywords`;
exports.KEYWORD_RANKINGS_TABLE = `KeywordRankings`;
function runQuery(conn, query, values = []) {
    return new Promise((resolve, reject) => {
        try {
            conn.query(query, values, (error, results, fields) => {
                if (error) {
                    throw error;
                }
                resolve(results);
            });
        }
        catch (e) {
            logger_1.logger.error('runQuery', e);
            reject(e.message);
        }
    });
}
function getAllKeywords(conn, siteID = null) {
    let query = `SELECT * FROM ${exports.KEYWORDS_TABLE}`;
    if (siteID) {
        query += ` WHERE SiteID = ${siteID}`;
    }
    return runQuery(conn, query);
}
exports.getAllKeywords = getAllKeywords;
function createTables(conn, database_prefix) {
    return __awaiter(this, void 0, void 0, function* () {
        const keywordsTable = `${database_prefix}_${exports.KEYWORDS_TABLE}`;
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
        `;
        yield runQuery(conn, createKeywordsQuery);
        const keywordRankingTable = `${database_prefix}_${exports.KEYWORD_RANKINGS_TABLE}`;
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
        `;
        yield runQuery(conn, createKeywordRankingsQuery);
    });
}
exports.createTables = createTables;
function insertKeywords(conn, database_prefix, keywords) {
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
    const keywordInserts = [];
    for (const keyword of keywords) {
        if (!keyword.SiteID) {
            throw Error('Missing SiteID');
        }
        if (!keyword.ID) {
            throw Error('Missing ID');
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
        };
        keywordInserts.push(Object.values(insert));
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
    ];
    const table = `${database_prefix}_${exports.KEYWORDS_TABLE}`;
    const query = `REPLACE INTO \`${table}\`(??) VALUES ?`;
    return runQuery(conn, query, [insertKeys, keywordInserts]);
}
exports.insertKeywords = insertKeywords;
function insertKeywordRankings(conn, database_prefix, rankings) {
    const rankingInserts = [];
    for (const rank of rankings) {
        if (!rank.SiteID) {
            throw Error('Missing SiteID');
        }
        const insert = {
            'ID': `${rank.date}_${rank.KeywordID}`,
            'SiteID': rank.SiteID,
            'KeywordID': rank.KeywordID,
            'Rank': rank.Rank || 0,
            'BaseRank': rank.BaseRank || 0,
            'Url': rank.Url || '',
            'date': rank.date,
        };
        rankingInserts.push(Object.values(insert));
    }
    const insertKeys = [
        'ID',
        'SiteID',
        'KeywordID',
        'Rank',
        'BaseRank',
        'Url',
        'date',
    ];
    const table = `${database_prefix}_${exports.KEYWORD_RANKINGS_TABLE}`;
    const query = `REPLACE INTO \`${table}\`(??) VALUES ?`;
    return runQuery(conn, query, [insertKeys, rankingInserts]);
}
exports.insertKeywordRankings = insertKeywordRankings;
