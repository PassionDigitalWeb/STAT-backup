# Storing Google Search Console into Google Big Query

## Brief

As GSC only stores up to 16 months of data, we would like to create a script that would download the data daily for our clients into databases in GBQ. There are a few repo that give some information on how to do it but they mainly focus on one account and it will be quite time consuming to do it manually for each one of ours.
The idea is to have a logic that would loop through our GSC client properties in our analytics@passiondigital.co.uk account and:
Create a new database and tables if it doesn’t exist

-   Table 1 'dimensions': ['date']
-   Table 2 'dimensions': ['date', ‘url’]
-   Table 3 'dimensions': ['date', ‘query’]
-   Table 4 'dimensions': ['date', ‘url’, ‘query’]
-   Table 5 'dimensions': ['date',’country’]

Append to the right tables if the client exists

-   Table 1 'dimensions': ['date']
-   Table 2 'dimensions': ['date', ‘url’]
-   Table 3 'dimensions': ['date', ‘query’]
-   Table 4 'dimensions': ['date', ‘url’, ‘query’]
-   Table 5 'dimensions': ['date',’country’]

## File/Folder Structure

-   `lib/` - Used for all JS code
-   `.env` - Used locally for environment variables. Accessed via `process.env`.
-   `.env.template` - As `.env` is git ignored, this file can be used as a template.
-   `.gitignore` - a list of files and folders to ignore from the git repository.
-   `server.js` - DESCRIPTION NEEDED
-   `setup-sites.js` - DESCRIPTION NEEDED
-   `sync-sites.js` - DESCRIPTION NEEDED
-   `service-account.json` - DESCRIPTION NEEDED

**Google App Engine fields**

-   `.gcloudignore` - Similar to .gitignore, this file will list all the files and folder which will be ignored from Google Cloud.
-   `app.yaml` - DESCRIPTION NEEDED
-   `cron.yaml` - DESCRIPTION NEEDED
-   `env_variables.yaml` - DESCRIPTION NEEDED

## Local Setup

-   Run `npm install`
-   Create `.env` file from `.env.template` file. Add relevant variables.

## App Engine Setup

-  [Install Google Cloud CLI](https://cloud.google.com/sdk/docs/install), which provides the gcloud command-line tool. Ensure gcloud is configured to use the Google Cloud project you want to deploy to.
- Run `gcloud_deploy` or `gcloud app deploy` to deploy the codebase to App Engine.
- To deploy the CRON jobs, run `gcloud app deploy cron.yaml`. Apparently simply deploying isn't enough.

# Backing up 16 months
Below is a run down on how the 16 months backup works. FYI 16 months is the maximum date range.

## Starting from fresh

-   Get start date from 16 months ago.
-   Get end date from 3 days ago(GSC restriction).
-   Store the start and end date in a new table called 'backup schedule'. This table will consist of
    `Start Date:Date`, `End Date:Date`, `Progress Date:Date, Completed:Boolean`.
-   Due to possible usage limits from GSC, we'll need to breakup the 16 months in to smaller chunks.
    We can start off with 1 month and decrease if we have errors.
-   Start querying data from `Start Date` till `Start Date` + 1 month.
-   Add data to GBQ.
-   Add the last synced date to `Progress Date` within the table `backup schedule`.
-   Repeat for each site.

## Continuing backup

-   Check 'backup schedule' to see if it's completed via `Completed`.
-   If it is, halt backup.
-   If it isn't, the backup can continue.
-   Delete data from `Progress Date` till `Progress Date` + 1 month within current table. This will prevent duplications.
-   Query for data from `Progress Date` till `Progress Date` + 1 month.
-   Add data to GBQ.
-   Add the last synced date to `Progress Date` within the table `backup schedule`. If `Progress Date` is the same as `End Date`,
    set backup has completed via `Completed`.
-   Repeat for each site.

### App Engine Cron jobs
All cron jobs MUST start on the same day and in this order.
1. `/setup-sites` - This will create the datasets and the tables needed for each site. New sites will be added as they're available.
2. `/synchronize` - This will back up the latest data from 3 days ago. 
3. `/archive-backup` - This will back up the data from 16 months to 4 days ago. It's important that this CRON job 
starts on the same day as `/synchronize`, otherwise data will be duplicated for the previous day.