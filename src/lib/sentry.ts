import { RewriteFrames } from '@sentry/integrations'
import * as Sentry from '@sentry/node'
import CONFIG from '@root/config'

let sentry: any
if (CONFIG.SENTRY_DSN) {
    Sentry.init({
        dsn: CONFIG.SENTRY_DSN,
        environment: CONFIG.NODE_ENV || 'development',
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
