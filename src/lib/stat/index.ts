import fetch, { Response } from 'node-fetch'
import Sync from '@lib/stat/sync'
import { StatKeywordsList, StatResponse, StatSitesAll } from '@app-types/stat'

class HTTPResponseError extends Error {
    public response: Response

    constructor(response: Response) {
        super(`HTTP Error Response: ${response.status} ${response.statusText}`)
        this.response = response
    }
}

class StatClient {
    #getURL() {
        return `${process.env.STAT_APP_URL}`
    }

    #getPath(endpoint: string): string {
        return `/api/v2/${process.env.STAT_API_KEY}/${endpoint}`
    }

    async query(endpoint: string, searchParams = ''): Promise<any> {
        const newSearchParams = new URLSearchParams(searchParams)
        const url = new URL(this.#getPath(endpoint), this.#getURL())

        newSearchParams.set('format', 'json')
        url.search = newSearchParams.toString()

        const href = url.href

        const response: Response = await fetch(href)
        const data = await response.json()

        const responseCode = parseInt(
            (data as StatResponse)?.Response?.responsecode
        )
        if (!response.ok || responseCode === 500) {
            throw new HTTPResponseError(response)
        }

        return data
    }
}

export const client = new StatClient()

export async function getAllSitesSTAT() {
    const data = await client.query('sites/all', 'start=0&results=1000')
    return (data as StatSitesAll).Response?.Result?.filter(
        ({ Tracking }) => Tracking === 'true'
    )
}

export async function getSiteDataSTAT(
    siteID: string | number,
    start = 0,
    results = Sync.ROW_LIMIT
) {
    const data = await client.query(
        'keywords/list',
        `site_id=${siteID}&start=${start}&results=${results}`
    )
    return (data as StatKeywordsList)?.Response
}
