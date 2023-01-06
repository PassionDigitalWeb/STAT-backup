import bunyan from "bunyan";
import pretty from "@mechanicalhuman/bunyan-pretty";
// Imports the Google Cloud client library for Bunyan
import {LoggingBunyan} from "@google-cloud/logging-bunyan";


const bunyanOptions = {
    name: 'gsc_to_gbq_logger',
}

if (process.env.NODE_ENV === 'production') {
    // Creates a Bunyan Cloud Logging client
    const loggingBunyan = new LoggingBunyan({
        keyFilename: process.env.GBQ_KEY_FILENAME,
        projectId: process.env.PROJECT_ID,
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

export {logger}
