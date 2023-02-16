"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const bunyan_1 = __importDefault(require("bunyan"));
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const bunyan_pretty_1 = __importDefault(require("@mechanicalhuman/bunyan-pretty"));
// Imports the Google Cloud client library for Bunyan
const logging_bunyan_1 = require("@google-cloud/logging-bunyan");
const bunyanOptions = {
    name: 'stat_backup',
};
if (process.env.NODE_ENV === 'production') {
    // Creates a Bunyan Cloud Logging client
    const loggingBunyan = new logging_bunyan_1.LoggingBunyan({
        keyFilename: process.env.GBQ_KEY_FILENAME,
        projectId: process.env.PROJECT_ID,
    });
    bunyanOptions['streams'] = [
        { stream: process.stdout, level: 'info' },
        loggingBunyan.stream('info'),
    ];
}
else {
    bunyanOptions.stream = (0, bunyan_pretty_1.default)(process.stdout, { timeStamps: false });
}
// Create a Bunyan logger that streams to Cloud Logging
// Logs will be written to: "projects/YOUR_PROJECT_ID/logs/bunyan_log"
const logger = bunyan_1.default.createLogger(bunyanOptions);
exports.logger = logger;
