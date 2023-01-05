const {
    daysAgoDate,
    formatDate,
    monthsAgoDate,
    formatDateTime,
    addMonths,
} = require('../helpers')
const { logger } = require('../logger')
const { getSiteData } = require('../stat')
const bigquery = require('./client')
const {
    SYNC_TABLE_ID,
    getGSCTables,
    BACKUP_SCHEDULE_TABLE_ID,
    BY_DATE_TABLE_ID,
    BY_PAGE_QUERY_TABLE_ID,
    BY_QUERY_TABLE_ID,
    BY_PAGE_TABLE_ID,
    BY_COUNTRY_TABLE_ID,
} = require('./table')

class GBQSync {
    static ROW_LIMIT = 25000
    static MONTH_BACKUP = 16

    static TABLE_QUERIES = {
        [BY_DATE_TABLE_ID]: { dimensions: ['date'] },
        [BY_PAGE_TABLE_ID]: { dimensions: ['date', 'page'] },
        [BY_QUERY_TABLE_ID]: { dimensions: ['date', 'query'] },
        [BY_PAGE_QUERY_TABLE_ID]: { dimensions: ['date', 'page', 'query'] },
        [BY_COUNTRY_TABLE_ID]: { dimensions: ['date', 'country'] },
    }
    #dataset = ''
    #siteUrl = ''
    #type = 'daily'

    constructor(dataset, siteUrl, type = 'daily') {
        this.#dataset = dataset
        this.#siteUrl = siteUrl
        this.#type = type
    }

    async #checkIsSynced(tableID, date) {
        const query = `SELECT Date
      FROM \`${this.#dataset.id}.${SYNC_TABLE_ID}\`
      WHERE Table = '${tableID}' AND
      Date = '${date}'
      LIMIT 1`

        // For all options, see https://cloud.google.com/bigquery/docs/reference/rest/v2/jobs/query
        const options = {
            query: query,
            location: 'europe-west2',
        }

        // Run the query as a job
        const [job] = await bigquery.createQueryJob(options)

        // Wait for the query to finish
        const [rows] = await job.getQueryResults()

        return !!rows?.length
    }

    async #getBackupSchedule() {
        const query = `
        SELECT *
         FROM \`${this.#dataset.id}.${BACKUP_SCHEDULE_TABLE_ID}\`
        WHERE
          (Completed IS FALSE
            OR Completed IS NULL)
          AND ProgressDate < EndDate
        ORDER BY
          StartDate
        LIMIT 1
        `

        // For all options, see https://cloud.google.com/bigquery/docs/reference/rest/v2/jobs/query
        const options = {
            query: query,
            location: 'europe-west2',
        }

        // Run the query as a job
        const [job] = await bigquery.createQueryJob(options)

        // Wait for the query to finish
        const [rows] = await job.getQueryResults()

        return rows?.[0]
    }

    async #backupSchedulesExist() {
        const query = `
        SELECT *
         FROM \`${this.#dataset.id}.${BACKUP_SCHEDULE_TABLE_ID}\`
        ORDER BY
          StartDate
        LIMIT 1
        `

        // For all options, see https://cloud.google.com/bigquery/docs/reference/rest/v2/jobs/query
        const options = {
            query: query,
            location: 'europe-west2',
        }

        // Run the query as a job
        const [job] = await bigquery.createQueryJob(options)

        // Wait for the query to finish
        const [rows] = await job.getQueryResults()
        return !!rows?.length
    }

    #getKeys(keysArray, dimensions) {
        let key = {}
        for (const dimensionIndex in dimensions) {
            const dimensionValue = dimensions[dimensionIndex]
            const dimensionValueCap =
                dimensionValue.charAt(0).toUpperCase() + dimensionValue.slice(1)
            key[dimensionValueCap] = keysArray[dimensionIndex]
        }

        return key
    }

    async #syncTable(table, queryData) {
        const { startDate, endDate, dimensions } = queryData

        let finished = false
        let startRow = 0
        let iteration = 0

        //data for synced schedule
        const results = {
            total: 0,
        }

        while (!finished) {
            iteration++
            logger.info(`Syncing table ${table.id}:`, { iteration, startRow })

            const siteData = await getSiteData({
                siteUrl: this.#siteUrl,
                startDate: startDate,
                endDate: endDate,
                dimensions: dimensions,
                rowLimit: GBQSync.ROW_LIMIT,
                startRow,
            })

            if (siteData && siteData.rows?.length) {
                const insertData = siteData.rows.map((data) => {
                    return {
                        ...this.#getKeys(data.keys, dimensions),
                        Clicks: data.clicks,
                        Impressions: data.impressions,
                        Ctr: data.ctr,
                        Position: data.position,
                    }
                })

                const result = await table.insert(insertData)
                logger.info(
                    `Inserted ${insertData.length} rows in to ${table.id}`
                )

                results.total += insertData.length

                if (siteData.rows.length >= GBQSync.ROW_LIMIT) {
                    startRow += GBQSync.ROW_LIMIT
                } else {
                    finished = true
                }
            } else {
                finished = true
            }
        }

        return results
    }

    async #dailySyncTable(table, queryData) {
        const { dimensions } = queryData

        try {
            //GSC will only provide date from 3 days ago
            const backupDate = formatDate(daysAgoDate(3))

            //check if table has already been synced
            const hasSynced = await this.#checkIsSynced(table.id, backupDate)
            if (hasSynced) {
                logger.info(
                    `Table ${table.id} has already been synced for ${backupDate}`
                )
                return false
            }

            //data for synced schedule
            const syncedData = {
                date: backupDate,
                table,
                total: 0,
            }

            const { total } = await this.#syncTable(table, {
                dimensions,
                startDate: backupDate,
                endDate: backupDate,
            })

            if (syncedData) {
                const createdDate = formatDateTime(new Date())
                await bigquery
                    .dataset(table.dataset.id)
                    .table(SYNC_TABLE_ID)
                    .insert([
                        {
                            Date: backupDate,
                            Table: table.id,
                            Total: total,
                            Created: createdDate,
                        },
                    ])
            }
        } catch (e) {
            logger.error(`Error while syncing ${table.id}`)
            logger.error(e.message)
            console.log(e.stack)
            return Promise.reject(`Table: ${table.id} - ${e.message}`)
        }
    }

    async #syncTableBy(table) {
        const tableQuery = GBQSync.TABLE_QUERIES[table.id]

        if (!tableQuery) {
            return Promise.reject(`Table query missing: ${table.id}`)
        }

        return this.#dailySyncTable(table, tableQuery)
    }

    async rangeSyncGSCTables() {
        try {
            const allTables = await getGSCTables(this.#dataset)
            const promises = []
            const backupSchedulesExist = await this.#backupSchedulesExist()

            const monthSplit = 1
            let backupStartDate = monthsAgoDate(GBQSync.MONTH_BACKUP)
            let backupEndDate = daysAgoDate(4)
            let queryEndDate = monthsAgoDate(GBQSync.MONTH_BACKUP)
            addMonths(monthSplit, queryEndDate)
            let queryStartDate = backupStartDate

            //create new backup schedule
            if (backupSchedulesExist) {
                const backSchedule = await this.#getBackupSchedule()

                if (!backSchedule) {
                    logger.info(
                        `All backups for ${this.#dataset.id} completed.`
                    )
                    return false
                }

                backupStartDate = new Date(backSchedule.StartDate.value)
                queryStartDate = new Date(backSchedule.ProgressDate.value)
                backupEndDate = new Date(backSchedule.EndDate.value)
                queryEndDate = new Date(backSchedule.ProgressDate.value)
                addMonths(monthSplit, queryEndDate)

                //Check if the query end date is past the end date of the backup schedule
                if (queryEndDate > backupEndDate) {
                    queryEndDate = backupEndDate
                }

                logger.info(
                    `starting backup schedule for ${formatDate(
                        backupStartDate
                    )} to ${formatDate(backupEndDate)}`
                )
            } else {
                const backup_insert = {
                    StartDate: formatDate(backupStartDate),
                    EndDate: formatDate(backupEndDate),
                    ProgressDate: formatDate(queryEndDate),
                }

                await this.#addBackupSchedule(backup_insert)

                logger.info(
                    `created backup schedule for ${backup_insert.StartDate} to ${backup_insert.EndDate}`
                )
            }

            for (const table of allTables) {
                const tableQuery = GBQSync.TABLE_QUERIES[table.table.id]
                promises.push(
                    this.#syncTable(table.table, {
                        ...tableQuery,
                        startDate: formatDate(queryStartDate),
                        endDate: formatDate(queryEndDate),
                    })
                )
            }

            const result = await Promise.allSettled(promises)
                .then(async (response) => {
                    let allPassed = true
                    const errors = []

                    //check is all promises have passed. Add errors to return.
                    for (const responseElement of response) {
                        if (responseElement.status === 'rejected') {
                            allPassed = false
                            errors.push(responseElement.reason)
                        }
                    }

                    if (allPassed) {
                        logger.info(
                            `Range Backup for Dataset ${this.#dataset.id} done`
                        )
                    } else {
                        logger.info(
                            `Some tables from Dataset ${
                                this.#dataset.id
                            } failed to sync`
                        )
                    }

                    //check if backup schedule has finished
                    if (queryEndDate === backupEndDate) {
                        await this.#completedBackupSchedule({
                            startDate: formatDate(backupStartDate),
                            endDate: formatDate(backupEndDate),
                        })
                        logger.info(
                            `backup schedule for ${formatDate(
                                queryStartDate
                            )} to ${formatDate(queryEndDate)} completed`
                        )
                    } else {
                        await this.#updateBackupSchedule({
                            startDate: formatDate(backupStartDate),
                            endDate: formatDate(backupEndDate),
                            progressDate: formatDate(queryEndDate),
                        })
                        logger.info(
                            `backup schedule for ${formatDate(
                                queryStartDate
                            )} to ${formatDate(queryEndDate)} updated`
                        )
                    }

                    return {
                        errors,
                    }
                })
                .catch((response) => {
                    logger.error({ response })
                    return {
                        errors: [response],
                    }
                })

            return result
        } catch (e) {
            logger.error()
            logger.error(`Error rangeSyncGSCTables`, e.message)
            logger.trace(e.stack)
            return { errors: [e.message] }
        }

        return false
    }

    async dailySyncGSCTables() {
        const allTables = await getGSCTables(this.#dataset)
        const promises = []
        for (const table of allTables) {
            table && promises.push(this.#syncTableBy(table.table))
        }

        return await Promise.allSettled(promises)
            .then((response) => {
                let allPassed = true
                const errors = []

                for (const responseElement of response) {
                    if (responseElement.status === 'rejected') {
                        allPassed = false
                        errors.push(responseElement.reason)
                    }
                }

                if (allPassed) {
                    logger.info(`Synchronized Dataset ${this.#dataset.id}`)
                } else {
                    logger.info(
                        `Some tables from Dataset ${
                            this.#dataset.id
                        } failed to sync`
                    )
                }

                return {
                    errors,
                }
            })
            .catch((response) => {
                logger.error({ response })
            })
    }

    async syncGSCTables() {
        if (this.#type === 'range') {
            return this.rangeSyncGSCTables()
        } else if (this.#type === 'daily') {
            return this.dailySyncGSCTables()
        }
    }

    async #completedBackupSchedule(backupData) {
        const { startDate, endDate } = backupData

        const query = `
        UPDATE  \`${this.#dataset.id}.${BACKUP_SCHEDULE_TABLE_ID}\`
        SET Completed = TRUE, Updated = CURRENT_TIMESTAMP(), ProgressDate = '${endDate}'
        WHERE
          StartDate = '${startDate}' AND
          EndDate = '${endDate}'
        `

        // For all options, see https://cloud.google.com/bigquery/docs/reference/rest/v2/jobs/query
        const options = {
            query: query,
            location: 'europe-west2',
        }

        // Run the query as a job
        const [job] = await bigquery.createQueryJob(options)

        // Wait for the query to finish
        const result = await job.getQueryResults()

        return result?.rows?.[0]
    }

    async #updateBackupSchedule(backupData) {
        const { startDate, endDate, progressDate } = backupData

        const query = `
        UPDATE  \`${this.#dataset.id}.${BACKUP_SCHEDULE_TABLE_ID}\`
        SET ProgressDate = '${progressDate}', Updated = CURRENT_TIMESTAMP()
        WHERE
          StartDate = '${startDate}' AND
          EndDate = '${endDate}'
        `

        // For all options, see https://cloud.google.com/bigquery/docs/reference/rest/v2/jobs/query
        const options = {
            query: query,
            location: 'europe-west2',
        }

        // Run the query as a job
        const [job] = await bigquery.createQueryJob(options)

        // Wait for the query to finish
        const [rows] = await job.getQueryResults()

        return rows?.[0]
    }

    async #addBackupSchedule(backup_insert) {
        const { StartDate, EndDate, ProgressDate } = backup_insert

        const query = `
        INSERT  \`${this.#dataset.id}.${BACKUP_SCHEDULE_TABLE_ID}\`
        (StartDate, EndDate, ProgressDate, Created, Updated)
        VALUES ('${StartDate}','${EndDate}','${ProgressDate}',CURRENT_TIMESTAMP(),CURRENT_TIMESTAMP())
        `

        // For all options, see https://cloud.google.com/bigquery/docs/reference/rest/v2/jobs/query
        const options = {
            query: query,
            location: 'europe-west2',
        }

        // Run the query as a job
        const [job] = await bigquery.createQueryJob(options)

        // Wait for the query to finish
        const [rows] = await job.getQueryResults()

        return rows?.[0]
    }

    async #clearDataSchedule(deleteData) {
        const { StartDate, EndDate } = deleteData

        const query = `
        DELETE FROM  \`${this.#dataset.id}.${BY_DATE_TABLE_ID}\`
        WHERE Date >= '${StartDate}' AND Date < '${EndDate}';
        
        DELETE FROM  \`${this.#dataset.id}.${BY_PAGE_TABLE_ID}\`
        WHERE Date >= '${StartDate}' AND Date < '${EndDate}';
        
        DELETE FROM  \`${this.#dataset.id}.${BY_QUERY_TABLE_ID}\`
        WHERE Date >= '${StartDate}' AND Date < '${EndDate}';
        
        DELETE FROM  \`${this.#dataset.id}.${BY_PAGE_QUERY_TABLE_ID}\`
        WHERE Date >= '${StartDate}' AND Date < '${EndDate}';
        
        DELETE FROM  \`${this.#dataset.id}.${BY_COUNTRY_TABLE_ID}\`
        WHERE Date >= '${StartDate}' AND Date < '${EndDate}';
        `

        // For all options, see https://cloud.google.com/bigquery/docs/reference/rest/v2/jobs/query
        const options = {
            query: query,
            location: 'europe-west2',
        }

        // Run the query as a job
        const [job] = await bigquery.createQueryJob(options)

        // Wait for the query to finish
        const result = await job.getQueryResults()

        return result?.rows?.[0]
    }
}

module.exports = GBQSync
