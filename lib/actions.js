import {datasetIdFromURL} from "./helpers";
import {logger} from "./logger";
import {sendErrorEmail} from "./email";
import {getAllSiteUrls} from "./stat";
import {createGSCTables} from "./gbq/table";
import {createDataset, getDataset} from "./gbq/dataset";
import GBQSync from "./gbq/sync";

async function addSitesToGBQ() {
    logger.info(`Starting to add sites to GBQ`)
    const siteURls = await getAllSiteUrls()

    if (!siteURls) {
        logger.error(`No sites to sync`)
        return
    }

    for (const siteURl of siteURls) {
        const dataSetId = datasetIdFromURL(siteURl)

        const dataset = await createDataset(dataSetId)
        if (dataset) {
            await createGSCTables(dataset)
        }
    }
    logger.info(`Finished adding sites to GBQ`)
}

async function syncGSCtoGBQ(type = 'daily') {
    logger.info(`Starting to sync sites to GBQ`)
    const siteURls = await getAllSiteUrls()

    if (!siteURls) {
        logger.info(`No sites to sync`)
        return
    }

    const errors = []

    for (const siteURl of siteURls) {
        const dataSetId = datasetIdFromURL(siteURl)
        const dataset = await getDataset(dataSetId)

        if (dataset) {
            const sync = new GBQSync(dataset, siteURl, type)
            const result = await sync.syncGSCTables()
            if (result?.errors?.length) {
                errors.push({
                    dataSetId: dataset.id,
                    errors: result.errors,
                })
                logger.error(`Errors on ${dataset.id}`, result.errors)
            }
        }
    }

    if (process.env.EMAIL_ERRORS && errors.length) {
        const htmlErrors = errors.map(({dataSetId, errors}) => {
            const errorsHTML = errors
                .map((error) => `<li>${error}</li>`)
                .join('')
            return `<b>Dataset : ${dataSetId}</b>` + `<p>${errorsHTML}</p><br/>`
        })

        sendErrorEmail({
            subject: 'Error while syncing',
            html: htmlErrors.join(''),
        })
    }
    logger.info(`Finished syncing sites to GBQ`)
}

export {
    syncGSCtoGBQ,
    addSitesToGBQ,
}
