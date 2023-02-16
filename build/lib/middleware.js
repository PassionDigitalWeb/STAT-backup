"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAppEngineCron = void 0;
const logger_1 = require("./logger");
function isAppEngineCron(req, res, next) {
    if (req.header('X-Appengine-Cron') !== 'true') {
        res.status(403);
        logger_1.logger.error('Cron only endpoint');
    }
    else {
        next();
    }
}
exports.isAppEngineCron = isAppEngineCron;
