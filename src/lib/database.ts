import mysql, { Pool } from 'mysql'
import CONFIG from '@root/config'
import { DBConfig } from '@app-types/db'

const config: DBConfig = {
    connectionLimit: 10,
    user: CONFIG.DB_USER,
    database: CONFIG.DB_NAME,
    password: CONFIG.DB_PASS,
}

/**
 * Checking if the app is running in production or not. If it is, it will connect to the DB through the socket. If not, it
 * will connect to the DB directly.
 */
if (CONFIG.NODE_ENV === 'production') {
    // eslint-disable-next-line no-console
    console.log('Running from cloud. Connecting to DB through GCP socket.')
    config.socketPath = `/cloudsql/${CONFIG.INSTANCE_CONNECTION_NAME}`
} else {
    // eslint-disable-next-line no-console
    console.log('Running from localhost. Connecting to DB directly.')
    config.host = CONFIG.DB_HOST
}

/**
 * It creates a new connection pool.
 * @returns A connection pool
 */
export function createNewPool(): Pool {
    const pool = mysql.createPool(config)

    pool.getConnection((err, connection) => {
        if (err) throw err
        // eslint-disable-next-line no-console
        console.log('Connected as thread id: ' + connection.threadId)
        connection.release()
    })

    pool.on('error', function (err) {
        // eslint-disable-next-line no-console
        console.error(err.code)
    })

    return pool
}
