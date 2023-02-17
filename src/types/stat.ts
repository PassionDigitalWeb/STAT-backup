export type Site = {
    Id: string
    ProjectId: string
    FolderId: string
    FolderName: string
    Title: string
    Url: string
    Synced: string
    TotalKeywords: number
    CreatedAt: string
    UpdatedAt: string
    RequestUrl: string
    Tracking: string
}

export type Keyword = {
    Id: string
    Keyword: string
    KeywordMarket: string
    KeywordLocation: string
    KeywordDevice: string
    KeywordTranslation: string
    KeywordTags: string
    KeywordStats: {
        AdvertiserCompetition: string
        GlobalSearchVolume: string
        RegionalSearchVolume: string
        LocalSearchTrendsByMonth: Record<string, string>
        CPC: string
    }
    KeywordRanking: {
        date: string
        Google: {
            Rank: string
            BaseRank: string
            Url: string
        }
    }
    CreatedAt: string
    RequestUrl: string
}

// noinspection SpellCheckingInspection
export type StatResponse = {
    Response: {
        responsecode: string
        totalresults: string
        resultsreturned: string
        nextpage: string
    }
}

// noinspection SpellCheckingInspection
export type StatSitesAll = StatResponse & {
    Response: {
        Result: Site[]
    }
}

export type StatKeywordsList = StatResponse & {
    Response: {
        Result: Keyword[]
    }
}
