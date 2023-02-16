export type DBConfig = {
    connectionLimit: number,
    user: string | undefined,
    database: string | undefined,
    password: string | undefined,
    socketPath?: string | undefined,
    host?: string | undefined,
}

export type KeywordInsert = {
    SiteID: number;
    ID: number;
    Keyword: string;
    KeywordMarket: string;
    KeywordLocation: string;
    KeywordDevice: string;
    KeywordTranslation: string;
    KeywordTags: string;
    GlobalSearchVolume: number;
    RegionalSearchVolume: number;
    CreatedAt: string;
}

export type KeywordRankingInsert = {
    SiteID: number;
    KeywordID: number;
    date: string;
    Rank: number;
    BaseRank: number;
    Url: string;
}