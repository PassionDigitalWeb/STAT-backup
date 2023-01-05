const { logger } = require('../logger')
const bigquery = require('./client')

const baseSchema =
    ', Clicks:Float, Impressions:Float, Ctr:Float, Position:Float'

//Tables
const BACKUP_SCHEDULE_TABLE_ID = 'backup_schedule'
const SYNC_TABLE_ID = 'synced_schedule'
const BY_DATE_TABLE_ID = 'byDate'
const BY_PAGE_TABLE_ID = 'byPage'
const BY_QUERY_TABLE_ID = 'byQuery'
const BY_PAGE_QUERY_TABLE_ID = 'byPageQuery'
const BY_COUNTRY_TABLE_ID = 'byCountry'

async function getTable(datasetId, tableId) {
    //check dataset and table exists
    try {
        const dataset = bigquery.dataset(datasetId)

        if (dataset) {
            const [table] = await dataset.table(tableId).get()
            if (table) {
                return {
                    table,
                }
            }
        }
    } catch (e) {
        logger.error(e.message)
    }

    return false
}

async function createTable(datasetId, tableId, schema, customOptions) {
    //check dataset and table exists
    const currentTable = await getTable(datasetId, tableId)
    if (currentTable) {
        return currentTable
    }

    // For all options, see https://cloud.google.com/bigquery/docs/reference/v2/tables#resource
    const options = {
        schema: schema,
        location: 'europe-west2',
        ...customOptions,
    }

    // Create a new table in the dataset
    const [table] = await bigquery
        .dataset(datasetId)
        .createTable(tableId, options)

    logger.info(`Table ${table.id} created.`)

    return {
        table,
        isNew: true,
    }
}

async function createGSCTables(dataset) {
    //create tables
    const backup_schedule = await createTable(
        dataset.id,
        BACKUP_SCHEDULE_TABLE_ID,
        `StartDate:Date, EndDate:Date, ProgressDate:Date, Completed:Bool, Created:Timestamp, Updated:Timestamp`
    )

    //GSC tables
    const gscCustomOptions = {
        timePartitioning: {
            type: 'MONTH',
            field: 'date',
        },
    }
    const synced_schedule = await createTable(
        dataset.id,
        SYNC_TABLE_ID,
        `Date:Date, Table:String, Total:integer, Created:Timestamp`,
        gscCustomOptions
    )
    const table1 = await createTable(
        dataset.id,
        BY_DATE_TABLE_ID,
        `Date:Date ${baseSchema}`,
        gscCustomOptions
    )
    const table2 = await createTable(
        dataset.id,
        BY_PAGE_TABLE_ID,
        `Date:Date, Page:String ${baseSchema}`,
        gscCustomOptions
    )
    const table3 = await createTable(
        dataset.id,
        BY_QUERY_TABLE_ID,
        `Date:Date, Query:String ${baseSchema}`,
        gscCustomOptions
    )
    const table4 = await createTable(
        dataset.id,
        BY_PAGE_QUERY_TABLE_ID,
        `Date:Date, Page:String, Query:String ${baseSchema}`,
        gscCustomOptions
    )
    const table5 = await createTable(
        dataset.id,
        BY_COUNTRY_TABLE_ID,
        `Date:Date, Country:String ${baseSchema}`,
        gscCustomOptions
    )

    logger.info(`All Tables for ${dataset.id} Created,`)

    return {
        backup_schedule,
        synced_schedule,
        table1,
        table2,
        table3,
        table4,
        table5,
    }
}

async function getGSCBackupTable(dataset) {
    return await getTable(dataset.id, BACKUP_SCHEDULE_TABLE_ID)
}

async function getGSCTables(dataset) {
    //create tables
    const table1 = await getTable(dataset.id, BY_DATE_TABLE_ID)
    const table2 = await getTable(dataset.id, BY_PAGE_TABLE_ID)
    const table3 = await getTable(dataset.id, BY_QUERY_TABLE_ID)
    const table4 = await getTable(dataset.id, BY_PAGE_QUERY_TABLE_ID)
    const table5 = await getTable(dataset.id, BY_COUNTRY_TABLE_ID)

    return [table1, table2, table3, table4, table5]
}

module.exports = {
    BACKUP_SCHEDULE_TABLE_ID,
    SYNC_TABLE_ID,
    BY_DATE_TABLE_ID,
    BY_PAGE_TABLE_ID,
    BY_QUERY_TABLE_ID,
    BY_PAGE_QUERY_TABLE_ID,
    BY_COUNTRY_TABLE_ID,
    getTable,
    getGSCTables,
    createGSCTables,
}
