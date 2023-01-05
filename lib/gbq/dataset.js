const { logger } = require('../logger')
const bigquery = require('./client')

async function getDataset(datasetId) {
    try {
        const [dataset] = await bigquery.dataset(datasetId).get()

        if (dataset) {
            logger.info(`Dataset ${dataset.id} Found`)
            return dataset
        }
    } catch (e) {
        logger.error(e.message)
    }

    return false
}

async function createDataset(datasetId) {
    //check dataset exists
    const currentDataset = await getDataset(datasetId)
    if (currentDataset) {
        return currentDataset
    }

    // Create a new dataset
    const options = {
        location: 'europe-west2',
    }

    const [dataset] = await bigquery.createDataset(datasetId, options)
    logger.info(`Dataset ${dataset.id} created.`)

    return dataset
}

module.exports = {
    createDataset,
    getDataset,
}
