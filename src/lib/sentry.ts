import Sentry from '@sentry/node'
// import * as Tracing from '@sentry/tracing';

let sentry: any
if (process.env.SENTRY_DSN) {
    Sentry.init({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.NODE_ENV || 'development',
        tracesSampleRate: 1.0,
    })

    sentry = Sentry
}

export default sentry