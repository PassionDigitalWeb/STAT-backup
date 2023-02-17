type EnvConfig = {
    NODE_ENV?: string
    DEBUG?: boolean
    PORT?: number | string
    STAT_APP_URL: string | undefined
    STAT_API_KEY: string | undefined
    DB_HOST: string | undefined
    DB_INSTANCE: string | undefined
    DB_NAME: string | undefined
    DB_USER: string | undefined
    DB_PASS: string | undefined
    PROJECT_ID: string | undefined
    DATASET_ID_PREFIX?: string | undefined
    SENTRY_DSN?: string
    INSTANCE_CONNECTION_NAME?: string
}

const CONFIG: EnvConfig = {
    NODE_ENV: process.env.NODE_ENV || 'development',
    DEBUG: process.env.DEBUG === '1' || false,
    PORT: process.env.PORT || 8080,
    DATASET_ID_PREFIX: process.env.DATASET_ID_PREFIX,
    DB_HOST: process.env.DB_HOST,
    DB_INSTANCE: process.env.DB_INSTANCE,
    DB_NAME: process.env.DB_NAME,
    DB_PASS: process.env.DB_PASS,
    DB_USER: process.env.DB_USER,
    PROJECT_ID: process.env.PROJECT_ID,
    SENTRY_DSN: process.env.SENTRY_DSN,
    STAT_API_KEY: process.env.STAT_API_KEY,
    STAT_APP_URL: process.env.STAT_APP_URL,
    INSTANCE_CONNECTION_NAME: process.env.INSTANCE_CONNECTION_NAME,
}

export default CONFIG
