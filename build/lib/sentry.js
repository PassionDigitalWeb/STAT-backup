"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_1 = __importDefault(require("@sentry/node"));
// import * as Tracing from '@sentry/tracing';
let sentry;
if (process.env.SENTRY_DSN) {
    node_1.default.init({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.NODE_ENV || 'development',
        tracesSampleRate: 1.0,
    });
    sentry = node_1.default;
}
exports.default = sentry;
