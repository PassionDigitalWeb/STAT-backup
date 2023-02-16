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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = require("./logger");
const stat_1 = require("./stat");
/* Importing the `datasetIdFromSite` function from the `helpers.js` file. */
const helpers_1 = require("./helpers");
const sync_1 = __importDefault(require("./stat/sync"));
const email_1 = require("./email");
const sentry_1 = __importDefault(require("./sentry"));
const database_1 = require("./database");
/**
 * It creates a new Sync object, creates the necessary tables, initializes the sync, syncs the keywords, and syncs the
 * rankings
 *
 * @param site - The site to sync.
 * @param connection - The connection to the database.
 */
function syncSite(site, connection) {
    return __awaiter(this, void 0, void 0, function* () {
        const dbPrefix = (0, helpers_1.datasetIdFromSite)(site);
        const sync = new sync_1.default(dbPrefix, site, connection);
        yield sync.createTables();
        yield sync.init();
        yield sync.syncKeywords();
        yield sync.syncRankings();
    });
}
/**
 * It gets all the sites from the STAT API, then for each site, it syncs the site's data to the database
 */
function syncSites() {
    return __awaiter(this, void 0, void 0, function* () {
        logger_1.logger.info('Started');
        const transaction = sentry_1.default === null || sentry_1.default === void 0 ? void 0 : sentry_1.default.startTransaction({
            op: 'sync',
            name: 'Sync Sites',
        });
        const sites = yield (0, stat_1.getAllSitesSTAT)();
        const errors = [];
        const connection = (0, database_1.createNewPool)();
        if (sites) {
            const promises = sites.map((site) => new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                try {
                    yield syncSite(site, connection);
                    resolve(site.Url);
                }
                catch (e) {
                    reject(e);
                }
            })).catch((e) => {
                sentry_1.default === null || sentry_1.default === void 0 ? void 0 : sentry_1.default.captureException(e, {
                    extra: {
                        siteId: site.Id,
                        siteURL: site.Url,
                    },
                });
                logger_1.logger.error(`Sync Error: #${site.Id}`, {
                    error: e.message,
                });
                errors.push({
                    siteId: site.Id,
                    siteURL: site.Url,
                    error: e.message,
                });
                throw e;
            }));
            try {
                const result = yield Promise.allSettled(promises);
                const rejected = result === null || result === void 0 ? void 0 : result.filter(({ status }) => status !== 'fulfilled');
                logger_1.logger.info('allSettled results', {
                    sites: sites.length,
                    fulfilled: result.length - rejected.length,
                    rejected: rejected.length,
                });
            }
            catch (e) {
                sentry_1.default === null || sentry_1.default === void 0 ? void 0 : sentry_1.default.captureException(e);
            }
        }
        if (process.env.EMAIL_ERRORS && errors.length) {
            const htmlErrors = errors.map(({ siteId, siteURL, error }) => {
                const errorsHTML = `<li>${error}</li>`;
                return `<b>Site : #${siteId} - ${siteURL}</b>` + `<p>${errorsHTML}</p><br/>`;
            });
            yield (0, email_1.sendErrorEmail)({
                subject: 'Error while syncing',
                html: htmlErrors.join(''),
            });
        }
        logger_1.logger.info('Finished');
        transaction === null || transaction === void 0 ? void 0 : transaction.finish();
        connection.end();
    });
}
exports.default = syncSites;
