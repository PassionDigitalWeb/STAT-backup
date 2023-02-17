import { RewriteFrames } from '@sentry/integrations'
import * as Sentry from '@sentry/node'

// import * as Tracing from '@sentry/tracing';

let sentry: any
if (process.env.SENTRY_DSN) {
    Sentry.init({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.NODE_ENV || 'development',
        tracesSampleRate: 1.0,
        integrations: [
            new RewriteFrames({
                root: global.__dirname,
            }),
        ],
    })

    sentry = Sentry
}

export default sentry
