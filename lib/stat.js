import fetch from 'node-fetch'
import { logger } from './logger.js'
import Sync from './stat/sync.js'

class StatClient {
    #getURL() {
        return `${process.env.STAT_APP_URL}`
    }

    #getPath(endpoint) {
        return `/api/v2/${process.env.STAT_API_KEY}/${endpoint}`
    }

    query(endpoint, searchParams = '') {
        const newSearchParams = new URLSearchParams(searchParams)
        const url = new URL(this.#getPath(endpoint), this.#getURL())

        newSearchParams.set('format', 'json')
        url.search = newSearchParams

        const href = url.href

        return fetch(href).then(res => res.json())
    }
}

export const client = new StatClient()

export async function getAllSitesSTAT() {
    const response = await client.query('sites/all', 'start=0&results=1000')

    if (response.responsecode === 500) {
        logger.error(`Error on getAllSites`, response)
        return false
    }

    return response?.Response?.Result?.filter(({ Tracking }) => Tracking === 'true')

}

export async function getSiteDataSTAT(siteID, start = 0, results = Sync.ROW_LIMIT) {
    const response = await client.query('keywords/list', `site_id=${siteID}&start=${start}&results=${results}`)

    return response?.Response
}
