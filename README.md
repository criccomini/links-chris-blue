# RSS to Bluesky Netlify App

This Netlify app periodically reads an RSS feed and posts new entries to Bluesky—backdating each post to the RSS pubDate and embedding each link as a preview card (including thumbnail, title, and description when available)—using your Bluesky timeline to track what’s already been posted, and limits posting to at most 5 entries per run.

## Setup

In your Netlify site settings, add the following environment variables:
  - `RSS_FEED_URL`: URL of the RSS feed to monitor.
  - `BLUESKY_USERNAME`: Your Bluesky identifier (email or handle).
  - `BLUESKY_PASSWORD`: Your Bluesky password or app password.
  - `BLUESKY_SERVICE_URL`: (optional) Bluesky endpoint, defaults to `https://bsky.social`.

## Deployment

Deploy this repository to Netlify. The `rss-to-bluesky` function runs on the schedule defined in `netlify.toml` (default: `*/15 * * * *`).
Adjust the cron schedule in `netlify.toml` as needed.
