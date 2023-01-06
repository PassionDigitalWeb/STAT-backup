DROP TABLE IF EXISTS `Keywords`;

CREATE TABLE `Keywords`
(
    ID INT NOT NULL PRIMARY KEY,
    `Keyword` VARCHAR(100) NULL DEFAULT NULL,
    `KeywordMarket` VARCHAR(100) NULL DEFAULT NULL,
    `KeywordLocation` VARCHAR(100) NULL DEFAULT NULL,
    `KeywordDevice` VARCHAR(100) NULL DEFAULT NULL,
    `KeywordTranslation` VARCHAR(100) NULL DEFAULT NULL,
    `KeywordTags` VARCHAR(100) NULL DEFAULT NULL,
    `GlobalSearchVolume` VARCHAR(100) NULL DEFAULT NULL,
    `RegionalSearchVolume` VARCHAR(100) NULL DEFAULT NULL,
    `date` DATE,
    `KeywordRanking_Rank` VARCHAR(100) NULL DEFAULT NULL,
    `KeywordRanking_BaseRank` VARCHAR(100) NULL DEFAULT NULL,
    `KeywordRanking_Url` VARCHAR(200) NULL DEFAULT NULL,
    `CreatedAt` DATE
);