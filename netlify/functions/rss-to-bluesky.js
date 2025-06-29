const Parser = require('rss-parser');
const { AtpAgent } = require('@atproto/api');

const parser = new Parser();

async function postNewEntries() {
  const rssUrl = process.env.RSS_FEED_URL;
  if (!rssUrl) throw new Error('Missing RSS_FEED_URL environment variable');
  const feed = await parser.parseURL(rssUrl);
  // Determine cutoff by fetching the most recent post from Bluesky
  const agent = new AtpAgent({
    service: process.env.BLUESKY_SERVICE_URL || 'https://bsky.social',
  });
  await agent.login({
    identifier: process.env.BLUESKY_USERNAME,
    password: process.env.BLUESKY_PASSWORD,
  });
  const authorFeed = await agent.getAuthorFeed({ actor: agent.did, limit: 1 });
  const lastPost = authorFeed.data.feed[0];
  const lastTs = lastPost ? new Date(lastPost.post.indexedAt).getTime() : 0;
  const newItems = feed.items
    .filter(item => {
      const date = item.isoDate || item.pubDate;
      const ts = date ? new Date(date).getTime() : 0;
      return ts > lastTs;
    })
    .sort(
      (a, b) => new Date(a.isoDate || a.pubDate).getTime() - new Date(b.isoDate || b.pubDate).getTime()
    );
  if (newItems.length === 0) {
    console.log('No new RSS items to post');
    return;
  }
  for (const item of newItems) {
    const link = item.link?.trim() || '';
    const date = item.pubDate || item.isoDate;
    const createdAt = date ? new Date(date).toISOString() : undefined;
    const record = { text: link };
    if (createdAt) {
      record.createdAt = createdAt;
    }
    console.log('Posting link to Bluesky:', link, 'at', createdAt);
    await agent.post(record);
  }
}

exports.handler = async function () {
  try {
    await postNewEntries();
    return { statusCode: 200, body: 'RSS processed successfully' };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: `Error: ${err.message}` };
  }
};