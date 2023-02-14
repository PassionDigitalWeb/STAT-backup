# STAT Backup
Synchronize data between STAT and Cloud SQL.

## Stack
- **Node.js** >=14.0.0: A JavaScript runtime environment that allows developers to run JavaScript on the server-side.
- **Express**: A popular web framework for Node.js that simplifies the process of building web applications and APIs.
- **Bunyan logger**: A logging library for Node.js that provides a structured way to log data and can be configured to output logs to various destinations.
- **Google Cloud SQL**: A cloud-based relational database service provided by Google that allows developers to easily manage databases on the cloud.
- **Google Monitoring**: A service provided by Google that enables monitoring and alerting for cloud resources and applications, including logs, metrics, and traces.

## How it works

The `syncSite()` function is a key part of the Node.js application that synchronizes data between two web
services: [STAT](https://getstat.com) and [Cloud SQL](https://cloud.google.com/sql). Once this function is called, the
script fetches the list of websites from STAT. However, only those websites that are currently being tracked are
considered valid. This is determined by the `getAllSitesSTAT()` function.

For each valid website, the script creates two tables in the Cloud SQL database. One table is used to store the keywords
being tracked for that website, and the other is used to store the daily rankings for each keyword. Keywords are stored
only once in the database, as their rankings will change over time. Each time `syncSite()` is called, the latest ranking
score for each keyword is stored in the appropriate table. See section [Tables](#sql-tables) for more details.

The `syncSite()` function is triggered by a cron job set up in Google App Engine. The job calls the `/synchronize`
endpoint using an HTTP request. This endpoint is accessible only via the App Engine cron job, which is configured to run
the `syncSite()` function every day at 6:00 PM GMT. This ensures that all tracked websites are synchronized with the
Cloud SQL database on a daily basis.

Because the cron job runs automatically, any new websites added to STAT will be automatically added to their own Cloud
SQL tables. This eliminates the need for manual intervention to ensure that all tracked websites are synchronized
properly.

The script includes error handling to help identify and resolve any issues that arise during synchronization. The
logger.js file contains code for logging errors with [Bunyan](https://github.com/trentm/node-bunyan) to [Google Cloud Monitoring](https://cloud.google.com/monitoring). Additionally, the script can be configured
to send email notifications in the event of an error. This ensures that any issues with the synchronization process can
be addressed quickly, minimizing any impact on the web services being synchronized.

The website's keyword and ranking tables can then be pulled in
to [Google Data Studio](https://support.google.com/looker-studio/answer/7020436?hl=en) with this custom query.

```mysql-sql
SELECT
	keyword.*, 
	rankings.`Rank` 'keyword_rank', 
	rankings.`BaseRank` 'keyword_base_rank',
	rankings.`url`,
	rankings.`date`
FROM
	1234_passion_digital_Keywords keyword
LEFT JOIN 1234_passion_digital_KeywordRankings rankings 
ON
	keyword.ID = rankings.KeywordID
ORDER BY
	keyword.ID;
```

## TL;DR

1. `syncSite()` function syncs data between __STAT__ and __Cloud SQL__, storing daily keyword rankings.
2. `syncSite()` function is triggered by a __Google App Engine__ cron job running every day at 6:00 PM GMT.
3. Error handling included with logging to __Google Cloud Monitoring__ and email notifications.

## File/Folder Structure

| File/Folder     | Description                                                                                                                                                                                                                           |
|-----------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `lib/`          | Library folder used for all code.                                                                                                                                                                                                     |
| `.env`          | Used locally for environment variables. Accessed via `process.env`.                                                                                                                                                                   |
| `.env.template` | As `.env` is git ignored, this file can be used as a template.                                                                                                                                                                        |
| `.gitignore`    | a list of files and folders to ignore from the git repository.                                                                                                                                                                        |
| `server.js`     | This file typically contains the code for your Node.js server application. It defines the behavior of the server and specifies how it responds to incoming requests from clients. Utilising Express to handle routing and middleware. |
| `sync-sites.js` | Used while calling `npm sync-sites`. This file will call `syncSite()` function.                                                                                                                                                       |

## Google App Engine fields

| File/Folder          | Description                                                                                                                                                                                                                                                                                                                                                   |
|----------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `.gcloudignore`      | Similar to .gitignore, this file will list all the files and folder which will be ignored from Google Cloud.                                                                                                                                                                                                                                                  |
| `app.yaml`           | This file is used to configure and deploy applications to Google App Engine. It specifies details about the runtime environment, scaling settings, and other options necessary for the app to run correctly. The file is written in YAML format and can be used to configure both the standard and flexible App Engine environments.                          |
| `cron.yaml`          | This file is used to schedule recurring tasks (cron jobs) in Google App Engine. It specifies the name of the job, the schedule at which it should run, and the URL of the handler that should execute the job. The file is also written in YAML format and can be used to configure both the standard and flexible App Engine environments.                   |
| `env_variables.yaml` | This file is used to define environment variables for an application in Google App Engine. It contains a list of key-value pairs, where the keys are the names of the environment variables and the values are their associated values. This file can be used in conjunction with app.yaml to set environment variables for a specific deployment of the app. |

## Setup
### Local Setup
- Run `npm install`
- Create `.env` file from `.env.template` file. Add relevant variables.

### App Engine Setup

- [Install Google Cloud CLI](https://cloud.google.com/sdk/docs/install), which provides the gcloud command-line tool.
  Ensure gcloud is configured to use the Google Cloud project you want to deploy to.
- Run `gcloud_deploy` or `gcloud app deploy` to deploy the codebase to App Engine.
- To deploy the CRON jobs, run `gcloud app deploy cron.yaml`. Apparently simply deploying isn't enough.

### App Engine Cron jobs

1. `/synchronize` - App Engine will call this endpoint every day at 18:00 GMT. This will synchronize each website on
   STAT to Cloud SQL.
## SQL Tables
- `1234_passion_digital_Keywords`
- `1234_passion_digital_KeywordRankings`

For all tables a prefix is added. This will consist of the website ID within STAT, `1234`, and the parsed domain name, `passion_digital`.

### Keyword table
Example : `1234_passion_digital_Keywords`

| Field Name           | Data Type     | Constraints           |
|----------------------|---------------|-----------------------|
| ID                   | INT           | NOT NULL, PRIMARY KEY |
| SiteID               | INT           | NOT NULL              |
| Keyword              | VARCHAR(100)  | NULL DEFAULT NULL     |
| KeywordMarket        | VARCHAR(100)  | NULL DEFAULT NULL     |
| KeywordLocation      | VARCHAR(100)  | NULL DEFAULT NULL     |
| KeywordDevice        | VARCHAR(100)  | NULL DEFAULT NULL     |
| KeywordTranslation   | VARCHAR(100)  | NULL DEFAULT NULL     |
| KeywordTags          | VARCHAR(1000) | NULL DEFAULT NULL     |
| GlobalSearchVolume   | INT           | NULL DEFAULT 0        |
| RegionalSearchVolume | INT           | NULL DEFAULT 0        |
| CreatedAt            | DATE          |                       |


### Keyword Rankings table
Example : `1234_passion_digital_KeywordRankings`

| Field Name | Data Type     | Constraints                                          |
|------------|---------------|------------------------------------------------------|
| ID         | VARCHAR(100)  | NOT NULL, UNIQUE                                     |
| SiteID     | INT           | NOT NULL                                             |
| KeywordID  | INT           | NOT NULL                                             |
| Rank       | INT           | NULL DEFAULT 0                                       |
| BaseRank   | INT           | NULL DEFAULT 0                                       |
| Url        | VARCHAR(1000) | NULL DEFAULT NULL                                    |
| date       | DATE          | NULL DEFAULT NULL                                    |
| CreatedAt  | TIMESTAMP     | NOT NULL, DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY(ID) |

## Future Additions and improvements
- Integrate Typescript
- Integrate Sentry for better error handling
- Add automated tests
- Deployment from GitHub Actions, so we can test before deploying to App Engine and remove the need for `env_variables.yaml`