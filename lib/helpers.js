import url from "node:url";

const datasetIdFromURL = (siteURl) => {
    const q = url.parse(siteURl)
    const prefix = process.env.DATASET_ID_PREFIX || ''
    return prefix + q.host.replace(/[\.-]/g, '_')
}

const daysAgoDate = (backDays = 3) => {
    const dateFullToBackup = new Date()
    dateFullToBackup.setDate(dateFullToBackup.getDate() - backDays)

    return dateFullToBackup
}

function addMonths(numOfMonths, date = new Date()) {
    date.setMonth(date.getMonth() + numOfMonths)

    return date
}

const monthsAgoDate = (monthsAgo = 16) => {
    const dateFullToBackup = new Date()
    dateFullToBackup.setMonth(dateFullToBackup.getMonth() - monthsAgo)

    return dateFullToBackup
}

function padTo2Digits(num) {
    return num.toString().padStart(2, '0')
}

function formatDate(date) {
    return [
        date.getFullYear(),
        padTo2Digits(date.getMonth() + 1),
        padTo2Digits(date.getDate()),
    ].join('-')
}
function formatDateTime(date) {
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

export default {
    formatDate,
    addMonths,
    formatDateTime,
    datasetIdFromURL,
    daysAgoDate,
    monthsAgoDate,
};
