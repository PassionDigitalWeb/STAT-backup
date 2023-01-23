# STAT Backup

# !!READ_ME INCOMPLETE!!

## File/Folder Structure

-   `lib/` - Used for all JS code
-   `.env` - Used locally for environment variables. Accessed via `process.env`.
-   `.env.template` - As `.env` is git ignored, this file can be used as a template.
-   `.gitignore` - a list of files and folders to ignore from the git repository.
-   `server.js` - DESCRIPTION NEEDED
-   `sync-sites.js` - DESCRIPTION NEEDED

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

### App Engine Cron jobs
1. `/synchronize` - 