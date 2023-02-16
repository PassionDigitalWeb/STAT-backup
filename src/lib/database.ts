import mysql, { Pool } from 'mysql'
import { DBConfig } from '../types/db'

const config: DBConfig = {
    connectionLimit: 10,
    user: process.env.DB_USER,
    database: process.env.DB_NAME,
    password: process.env.DB_PASS,
}

/**
 * Checking if the app is running in production or not. If it is, it will connect to the DB through the socket. If not, it
 * will connect to the DB directly.
 */
if (process.env.NODE_ENV === 'production') {
    // eslint-disable-next-line no-console
    console.log('Running from cloud. Connecting to DB through GCP socket.')
    config.socketPath = `/cloudsql/${process.env.INSTANCE_CONNECTION_NAME}`
} else {
    // eslint-disable-next-line no-console
    console.log('Running from localhost. Connecting to DB directly.')
    config.host = process.env.DB_HOST
}

/**
 * It creates a new connection pool.
 * @returns A connection pool
 */
export function createNewPool(): Pool {
    const pool = mysql.createPool(config)

    pool.getConnection((err, connection) => {
        if (err)
            throw err
        // eslint-disable-next-line no-console
        console.log('Connected as thread id: ' + connection.threadId)
        connection.release()
    })

    pool.on('error', function(err) {
        // eslint-disable-next-line no-console
        console.error(err.code)
    })

    return pool
}