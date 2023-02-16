"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.monthsAgoDate = exports.daysAgoDate = exports.datasetIdFromSite = exports.formatDateTime = exports.addMonths = exports.formatDate = void 0;
const node_url_1 = __importDefault(require("node:url"));
const datasetIdFromSite = (site) => {
    let siteUrl = site.Url;
    //remove trailing slash
    if (siteUrl[siteUrl.length - 1] === '/') {
        siteUrl = siteUrl.substring(0, siteUrl.length - 1);
    }
    const q = node_url_1.default.parse(siteUrl);
    const prefix = site.Id + '_';
    return prefix + q.href.replace(/[.-/]/g, '_');
};
exports.datasetIdFromSite = datasetIdFromSite;
const daysAgoDate = (backDays = 3) => {
    const dateFullToBackup = new Date();
    dateFullToBackup.setDate(dateFullToBackup.getDate() - backDays);
    return dateFullToBackup;
};
exports.daysAgoDate = daysAgoDate;
function addMonths(numOfMonths, date = new Date()) {
    date.setMonth(date.getMonth() + numOfMonths);
    return date;
}
exports.addMonths = addMonths;
const monthsAgoDate = (monthsAgo = 16) => {
    const dateFullToBackup = new Date();
    dateFullToBackup.setMonth(dateFullToBackup.getMonth() - monthsAgo);
    return dateFullToBackup;
};
exports.monthsAgoDate = monthsAgoDate;
function padTo2Digits(num) {
    return num.toString().padStart(2, '0');
}
function formatDate(date) {
    return [
        date.getFullYear(),
        padTo2Digits(date.getMonth() + 1),
        padTo2Digits(date.getDate()),
    ].join('-');
}
exports.formatDate = formatDate;
function formatDateTime(date) {
    return ([
        date.getFullYear(),
        padTo2Digits(date.getMonth() + 1),
        padTo2Digits(date.getDate()),
    ].join('-') +
        ' ' +
        [
            padTo2Digits(date.getHours()),
            padTo2Digits(date.getMinutes()),
            padTo2Digits(date.getSeconds()),
        ].join(':'));
}
exports.formatDateTime = formatDateTime;
