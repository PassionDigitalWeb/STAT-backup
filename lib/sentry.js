// or use es6 import statements
// import * as Sentry from '@sentry/node';
import Tracing from '@sentry/tracing'

import Sentry from '@sentry/node'
// or use es6 import statements
// import * as Tracing from '@sentry/tracing';

let sentry;
if (process.env.SENTRY_DSN) {
    Sentry.init({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.NODE_ENV || 'development',
        tracesSampleRate: 1.0,
    })

    sentry = Sentry
}

export default sentry