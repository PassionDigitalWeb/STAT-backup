"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _StatClient_instances, _StatClient_getURL, _StatClient_getPath;
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSiteDataSTAT = exports.getAllSitesSTAT = exports.client = void 0;
const node_fetch_1 = __importDefault(require("node-fetch"));
const sync_1 = __importDefault(require("./stat/sync"));
class HTTPResponseError extends Error {
    constructor(response) {
        super(`HTTP Error Response: ${response.status} ${response.statusText}`);
        this.response = response;
    }
}
class StatClient {
    constructor() {
        _StatClient_instances.add(this);
    }
    query(endpoint, searchParams = '') {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const newSearchParams = new URLSearchParams(searchParams);
            const url = new URL(__classPrivateFieldGet(this, _StatClient_instances, "m", _StatClient_getPath).call(this, endpoint), __classPrivateFieldGet(this, _StatClient_instances, "m", _StatClient_getURL).call(this));
            newSearchParams.set('format', 'json');
            url.search = newSearchParams.toString();
            const href = url.href;
            const response = yield (0, node_fetch_1.default)(href);
            const data = yield response.json();
            const responseCode = parseInt((_a = data === null || data === void 0 ? void 0 : data.Response) === null || _a === void 0 ? void 0 : _a.responsecode);
            if (!response.ok || responseCode === 500) {
                throw new HTTPResponseError(response);
            }
            return data;
        });
    }
}
_StatClient_instances = new WeakSet(), _StatClient_getURL = function _StatClient_getURL() {
    return `${process.env.STAT_APP_URL}`;
}, _StatClient_getPath = function _StatClient_getPath(endpoint) {
    return `/api/v2/${process.env.STAT_API_KEY}/${endpoint}`;
};
exports.client = new StatClient();
function getAllSitesSTAT() {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        const data = yield exports.client.query('sites/all', 'start=0&results=1000');
        return (_b = (_a = data.Response) === null || _a === void 0 ? void 0 : _a.Result) === null || _b === void 0 ? void 0 : _b.filter(({ Tracking }) => Tracking === 'true');
    });
}
exports.getAllSitesSTAT = getAllSitesSTAT;
function getSiteDataSTAT(siteID, start = 0, results = sync_1.default.ROW_LIMIT) {
    return __awaiter(this, void 0, void 0, function* () {
        const data = yield exports.client.query('keywords/list', `site_id=${siteID}&start=${start}&results=${results}`);
        return data === null || data === void 0 ? void 0 : data.Response;
    });
}
exports.getSiteDataSTAT = getSiteDataSTAT;
