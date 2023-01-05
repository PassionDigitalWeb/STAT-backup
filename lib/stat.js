import fetch from 'node-fetch';

class StatClient {
    #getURL() {
        return `${process.env.STAT_APP_URL}`;
    }

    #getPath(endpoint) {
        return `/api/v2/${process.env.STAT_API_KEY}/${endpoint}`;
    }

    query(endpoint, searchParams = '') {
        const newSearchParams = new URLSearchParams(searchParams);
        const url = new URL(this.#getPath(endpoint), this.#getURL())

        newSearchParams.set('format', 'json');
        url.search = newSearchParams;

        const href = url.href

        return fetch(href).then(res => res.json())
    }
}

const client = global.STATClient ?? new StatClient();
global.STATClient = client;

async function getAllSiteUrls() {
    const response = await client.query('sites/all', 'start=0&results=1000');

    return response;

    //return response?.data?.siteEntry?.map(({siteUrl}) => siteUrl)
}

export {client, getAllSiteUrls}

