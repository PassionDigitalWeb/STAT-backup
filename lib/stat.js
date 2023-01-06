import fetch from 'node-fetch'
import { re } from '@babel/core/lib/vendor/import-meta-resolve.js'
import { logger } from './logger.js'

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

const client = global.STATClient ?? new StatClient()
global.STATClient = client

async function getAllSites() {
    const response = await client.query('sites/all', 'start=0&results=1000')

    if (response.responsecode === 500) {
        logger.error(`Error on getAllSites`, response)
        return false
    }

    return response?.Response?.Result?.filter(({ Tracking }) => Tracking === 'true')

}

async function getSiteData() {
    const response = await client.query('sites/all', 'start=0&results=1000')

    return response

    //return response?.data?.siteEntry?.map(({siteUrl}) => siteUrl)
}

export { client, getAllSites, getSiteData }

