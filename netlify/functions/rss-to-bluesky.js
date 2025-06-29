const Parser = require('rss-parser');
const { AtpAgent } = require('@atproto/api');

const parser = new Parser();
const Jimp = require('jimp');

const MAX_THUMB_BYTES = 1_000_000;
async function postNewEntries() {
  const rssUrl = process.env.RSS_FEED_URL;
  if (!rssUrl) throw new Error('Missing RSS_FEED_URL environment variable');
  const feed = await parser.parseURL(rssUrl);
  // Determine cutoff by fetching the most recent post's createdAt timestamp from Bluesky
  const agent = new AtpAgent({
    service: process.env.BLUESKY_SERVICE_URL || 'https://bsky.social',
  });
  await agent.login({
    identifier: process.env.BLUESKY_USERNAME,
    password: process.env.BLUESKY_PASSWORD,
  });
  const authorFeed = await agent.getAuthorFeed({ actor: agent.did, limit: 1 });
  const lastPost = authorFeed.data.feed[0];
  const lastTs = lastPost ? new Date(lastPost.post.createdAt).getTime() : 0;
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
    const dateStr = item.isoDate || item.pubDate;
    const createdAt = dateStr ? new Date(dateStr).toISOString() : undefined;
    const title = item.title?.trim() || '';
    const description = item.contentSnippet?.trim() || item.content?.trim() || '';
    let thumb;
    const html = item.content || item.description || '';
    const imgUrl =
      item.enclosure?.url && item.enclosure.type?.startsWith('image/')
        ? item.enclosure.url
        : html.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1];
    if (imgUrl) {
      try {
        const resp = await fetch(imgUrl);
        if (resp.ok) {
          const mimeType = resp.headers.get('content-type') || undefined;
          const buffer = Buffer.from(await resp.arrayBuffer());
          if (buffer.byteLength <= MAX_THUMB_BYTES) {
            const {
              data: { blob: thumbRef },
            } = await agent.uploadBlob(buffer, { encoding: mimeType });
            thumb = thumbRef;
          } else {
            try {
              const image = await Jimp.read(buffer);
              let width = image.bitmap.width;
              let quality = 80;
              let outBuffer;
              while (true) {
                outBuffer = await image
                  .clone()
                  .resize(width, Jimp.AUTO)
                  .quality(quality)
                  .getBufferAsync(Jimp.MIME_JPEG);
                if (
                  outBuffer.byteLength <= MAX_THUMB_BYTES ||
                  (width < 200 && quality <= 30)
                ) {
                  break;
                }
                width = Math.floor(width * 0.7);
                quality = Math.max(quality - 10, 30);
              }
              if (outBuffer.byteLength <= MAX_THUMB_BYTES) {
                const {
                  data: { blob: thumbRef },
                } = await agent.uploadBlob(outBuffer, { encoding: 'image/jpeg' });
                thumb = thumbRef;
              } else {
                console.warn(
                  `Resized thumbnail still too large: ${outBuffer.byteLength} bytes, skipping`
                );
              }
            } catch (err) {
              console.warn('Failed resizing thumbnail:', err);
            }
          }
        } else {
          console.warn('Unable to fetch thumbnail:', resp.status, resp.statusText);
        }
      } catch (err) {
        console.warn('Failed to fetch/upload thumbnail:', err);
      }
    }

    const record = {
      text: '',
      embed: {
        $type: 'app.bsky.embed.external',
        external: {
          uri: link,
          title: title || link,
          description,
          ...(thumb ? { thumb } : {}),
        },
      },
      createdAt: createdAt || new Date().toISOString(),
    };
    console.log(
      'Posting link embed to Bluesky:',
      link,
      title ? `(${title})` : '',
      thumb ? '(with thumbnail)' : '',
      'at',
      record.createdAt
    );
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