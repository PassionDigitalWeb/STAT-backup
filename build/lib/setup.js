"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
function checkRequiredEnvVars(requiredEnvVars) {
    requiredEnvVars.forEach(envVar => {
        if (!Object.prototype.hasOwnProperty.call(process.env, envVar)) {
            throw new Error(`Required environment variable ${envVar} is missing.`);
        }
    });
}
checkRequiredEnvVars([
    'STAT_APP_URL',
    'STAT_API_KEY',
    'DB_HOST',
    'DB_INSTANCE',
    'DB_NAME',
    'DB_USER',
    'DB_PASS',
    'PROJECT_ID',
]);
