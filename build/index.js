"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("./lib/setup");
const express_1 = __importDefault(require("express"));
const actions_1 = __importDefault(require("./lib/actions"));
const middleware_1 = require("./lib/middleware");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Server listening on port ${PORT}...`);
});
// ensure that request comes from app engine cron
if (process.env.NODE_ENV === 'production') {
    app.use(middleware_1.isAppEngineCron);
}
app.get('/synchronize', (req, res, next) => {
    (0, actions_1.default)();
    res.send('syncing sites!');
});
