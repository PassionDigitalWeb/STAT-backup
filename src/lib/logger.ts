// Imports the Google Cloud client library for Bunyan
import { LoggingBunyan } from '@google-cloud/logging-bunyan'
// @ts-ignore
import pretty from '@mechanicalhuman/bunyan-pretty'
import bunyan, { LoggerOptions } from 'bunyan'
import CONFIG from '@root/config'

const bunyanOptions: LoggerOptions = {
    name: 'stat_backup',
}

if (CONFIG.NODE_ENV === 'production') {
    // Creates a Bunyan Cloud Logging client
    const loggingBunyan = new LoggingBunyan({
        projectId: CONFIG.PROJECT_ID,
    })
    bunyanOptions['streams'] = [
        { stream: process.stdout, level: 'info' },
        loggingBunyan.stream('info'),
    ]
} else {
    bunyanOptions.stream = pretty(process.stdout, { timeStamps: false })
}

// Create a Bunyan logger that streams to Cloud Logging
// Logs will be written to: "projects/YOUR_PROJECT_ID/logs/bunyan_log"
const logger = bunyan.createLogger(bunyanOptions)

export { logger }
