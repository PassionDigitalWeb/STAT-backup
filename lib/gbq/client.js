// Create a client
const { BigQuery } = require('@google-cloud/bigquery')
const { logger } = require('../logger')
const bigqueryOptions = {
    projectId: process.env.PROJECT_ID,
}

if (process.env.GBQ_KEY_FILENAME) {
    bigqueryOptions['keyFilename'] = process.env.GBQ_KEY_FILENAME
}

if (!global.bigquery) {
    logger.trace('Set bigquery global')
    global.bigquery = new BigQuery(bigqueryOptions)
}

module.exports = global.bigquery
