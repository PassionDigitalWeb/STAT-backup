import url from 'node:url'
import { Site } from '@app-types/stat'

const datasetIdFromSite = (site: Site) => {
    let siteUrl = site.Url

    //remove trailing slash
    if (siteUrl[siteUrl.length - 1] === '/') {
        siteUrl = siteUrl.substring(0, siteUrl.length - 1)
    }

    const q = url.parse(siteUrl)
    const prefix = site.Id + '_'
    return prefix + q.href.replace(/[.-/]/g, '_')
}

const daysAgoDate = (backDays = 3) => {
    const dateFullToBackup = new Date()
    dateFullToBackup.setDate(dateFullToBackup.getDate() - backDays)

    return dateFullToBackup
}

function addMonths(numOfMonths: number, date = new Date()) {
    date.setMonth(date.getMonth() + numOfMonths)

    return date
}

const monthsAgoDate = (monthsAgo = 16) => {
    const dateFullToBackup = new Date()
    dateFullToBackup.setMonth(dateFullToBackup.getMonth() - monthsAgo)

    return dateFullToBackup
}

function padTo2Digits(num: number) {
    return num.toString().padStart(2, '0')
}

function formatDate(date: Date) {
    return [
        date.getFullYear(),
        padTo2Digits(date.getMonth() + 1),
        padTo2Digits(date.getDate()),
    ].join('-')
}

function formatDateTime(date: Date) {
    return (
        [
            date.getFullYear(),
            padTo2Digits(date.getMonth() + 1),
            padTo2Digits(date.getDate()),
        ].join('-') +
        ' ' +
        [
            padTo2Digits(date.getHours()),
            padTo2Digits(date.getMinutes()),
            padTo2Digits(date.getSeconds()),
        ].join(':')
    )
}

export {
    formatDate,
    addMonths,
    formatDateTime,
    datasetIdFromSite,
    daysAgoDate,
    monthsAgoDate,
}
