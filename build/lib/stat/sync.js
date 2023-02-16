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
const logger_1 = require("../logger");
const stat_1 = require("../stat");
const db_queries_1 = require("../db_queries");
/* It takes a site object, gets all the keywords from the STAT API, and inserts them into the database */
class Sync {
    constructor(databasePrefix, site, connection) {
        this.keywords = [];
        this.databasePrefix = databasePrefix;
        this.site = site;
        this.connection = connection;
    }
    /**
     * This function gets all keywords from the STAT API and stores them in the `keywords` property
     */
    init() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            //get all keywords
            let finished = false;
            let startRow = 0;
            //data for synced schedule
            const results = {
                total: 0,
            };
            let keywords = [];
            while (!finished) {
                const res = yield (0, stat_1.getSiteDataSTAT)(this.site.Id, startRow, Sync.ROW_LIMIT);
                const noResults = res.resultsreturned === '0';
                if (res && ((_a = res.Result) === null || _a === void 0 ? void 0 : _a.length)) {
                    keywords = [...keywords, ...res.Result];
                    results.total += res.Result.length;
                    if (keywords.length >= parseInt(res.totalresults)) {
                        finished = true;
                    }
                    else if (!noResults) {
                        startRow += Sync.ROW_LIMIT;
                    }
                }
                else {
                    finished = true;
                }
            }
            this.keywords = keywords;
            logger_1.logger.info(`Found ${this.keywords.length} keywords in to ${this.databasePrefix}`);
        });
    }
    createTables() {
        return (0, db_queries_1.createTables)(this.connection, this.databasePrefix);
    }
    /**
     * It takes the keywords from the site object and inserts them into the database
     * @returns The syncRankings function is being returned.
     */
    syncKeywords() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.keywords.length) {
                logger_1.logger.error('Missing Keywords');
                throw Error('Missing Keywords');
            }
            const site = this.site;
            logger_1.logger.info(`Started syncKeywords for db: ${this.databasePrefix} - #${site.Id}`);
            const keywords = this.keywords;
            const keywordInserts = keywords.map((keyword) => {
                var _a, _b;
                return ({
                    'SiteID': parseInt(site.Id),
                    'ID': parseInt(keyword.Id),
                    'Keyword': (keyword === null || keyword === void 0 ? void 0 : keyword.Keyword) || '',
                    'KeywordMarket': (keyword === null || keyword === void 0 ? void 0 : keyword.KeywordMarket) || '',
                    'KeywordLocation': (keyword === null || keyword === void 0 ? void 0 : keyword.KeywordLocation) || '',
                    'KeywordDevice': (keyword === null || keyword === void 0 ? void 0 : keyword.KeywordDevice) || '',
                    'KeywordTranslation': (keyword === null || keyword === void 0 ? void 0 : keyword.KeywordTranslation) || '',
                    'KeywordTags': (keyword === null || keyword === void 0 ? void 0 : keyword.KeywordTags) || '',
                    'GlobalSearchVolume': parseInt((_a = keyword === null || keyword === void 0 ? void 0 : keyword.KeywordStats) === null || _a === void 0 ? void 0 : _a.GlobalSearchVolume) || 0,
                    'RegionalSearchVolume': parseInt((_b = keyword === null || keyword === void 0 ? void 0 : keyword.KeywordStats) === null || _b === void 0 ? void 0 : _b.RegionalSearchVolume) || 0,
                    'CreatedAt': (keyword === null || keyword === void 0 ? void 0 : keyword.CreatedAt) || '',
                });
            });
            logger_1.logger.info(`Site #${site.Id} : keywords to insert`, {
                keywords: keywordInserts.length,
            });
            const result = yield (0, db_queries_1.insertKeywords)(this.connection, this.databasePrefix, keywordInserts);
            logger_1.logger.info(`Site #${site.Id} : keywords`, {
                message: result.message,
                affectedRows: result.affectedRows,
                changedRows: result.changedRows,
            });
            logger_1.logger.info(`Finished for #${site.Id}`);
            return this.syncRankings();
        });
    }
    /**
     * It takes the keywords from the site object, and inserts them into the database
     * @returns An array of objects
     */
    syncRankings() {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.keywords.length) {
                logger_1.logger.error('Missing Keywords');
                throw Error('Missing Keywords');
            }
            const site = this.site;
            const rankingInserts = [];
            for (const keyword of this.keywords) {
                if ((_a = keyword === null || keyword === void 0 ? void 0 : keyword.KeywordRanking) === null || _a === void 0 ? void 0 : _a.date) {
                    const rankingInsert = {
                        'SiteID': parseInt(site.Id),
                        'KeywordID': parseInt(keyword.Id),
                        'date': ((_b = keyword === null || keyword === void 0 ? void 0 : keyword.KeywordRanking) === null || _b === void 0 ? void 0 : _b.date) || '',
                        'Rank': parseInt((_d = (_c = keyword === null || keyword === void 0 ? void 0 : keyword.KeywordRanking) === null || _c === void 0 ? void 0 : _c.Google) === null || _d === void 0 ? void 0 : _d.Rank) || 0,
                        'BaseRank': parseInt((_f = (_e = keyword === null || keyword === void 0 ? void 0 : keyword.KeywordRanking) === null || _e === void 0 ? void 0 : _e.Google) === null || _f === void 0 ? void 0 : _f.BaseRank) || 0,
                        'Url': ((_h = (_g = keyword === null || keyword === void 0 ? void 0 : keyword.KeywordRanking) === null || _g === void 0 ? void 0 : _g.Google) === null || _h === void 0 ? void 0 : _h.Url) || '',
                    };
                    rankingInserts.push(rankingInsert);
                }
            }
            logger_1.logger.info(`Site #${site.Id} : rankings`, {
                rankings: rankingInserts.length,
            });
            if (rankingInserts.length) {
                logger_1.logger.info(`Started syncRankings for db: ${this.databasePrefix} - #${site.Id}`);
                return (0, db_queries_1.insertKeywordRankings)(this.connection, this.databasePrefix, rankingInserts).then(r => {
                    logger_1.logger.info(`Finished syncRankings for db: ${this.databasePrefix} - #${site.Id}`);
                    return r;
                });
            }
            logger_1.logger.info(`No rankings to sync ${this.databasePrefix} - #${site.Id}`);
        });
    }
}
exports.default = Sync;
Sync.ROW_LIMIT = 5000;
