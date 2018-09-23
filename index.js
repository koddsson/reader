const express = require('express')
const bodyParser = require('body-parser')
const sqlite = require('sqlite')
const dbPromise = sqlite.open('./reader.db', {Promise})
const hbs = require('hbs')
const markdown = require('helper-markdown')
const debug = require('debug')('app')
const webpush = require('web-push')
const CronJob = require('cron').CronJob
require('dotenv').config()

const webPush = require('./web-push')

const app = express()
app.set('view engine', 'hbs')
app.use(express.static('public'))
app.use(bodyParser.json())

hbs.registerHelper('markdown', markdown({linkify: true}))

const Parser = require('rss-parser')
const parser = new Parser()

const port = process.env.PORT || 3000

webpush.setVapidDetails(
  `mailto:${process.env.VAPID_EMAIL}`,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
)

// From: https://gist.github.com/mathewbyrne/1280286
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w-]+/g, '') // Remove all non-word chars
    .replace(/--+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, '') // Trim - from end of text
}

async function getFeed(url) {
  return await parser.parseURL(req.body.url)
}

async function syncFeed() {
  debug('running tick!')
  const db = await dbPromise

  let sendNotifications = false

  for (const feed of await db.all('SELECT * FROM feeds')) {
    let response

    try {
      response = await parser.parseURL(feed.url)
    } catch (error) {
      debug(error)
      return
    }

    const feedLastUpdated = new Date(feed.lastUpdated)
    if (new Date(response.lastBuildDate) > feedLastUpdated) {
      debug('There are new posts!')
      sendNotifications = true
      for (const item of response.items) {
        const itemPubDate = new Date(item.pubDate)
        if (itemPubDate > new Date(response.lastBuildDate)) return
        try {
          await db.run('INSERT INTO posts VALUES(?, ?, ?, ?, ?, ?)', [
            item.guid.trim(),
            item.title,
            item.content,
            itemPubDate.getTime(),
            item.link,
            feed.id
          ])
        } catch (error) {
          debug(`Failed to insert ${JSON.stringify(feed)} into posts`)t
        }
      }
      await db.run('UPDATE feeds SET lastUpdated = ? WHERE id = ?', [response.lastBuildDate, feed.id])
    } else {
      debug('There are no new posts!')
    }
  }

  if (sendNotifications) {
    for (const subscription of await db.all('SELECT * FROM push_subscriptions')) {
      debug('Sending a notification', subscription.endpoint)
      const pushSubscription = {
        endpoint: subscription.endpoint,
        keys: {
          auth: subscription.auth,
          p256dh: subscription.p256dh
        }
      }

      webpush.sendNotification(pushSubscription, 'Your Push Payload Text')
    }
  }
}

new CronJob({
  cronTime: '0 */15 * * * *',
  start: true,
  runOnInit: true,
  onTick: syncFeed
})

app.post('/feeds', async (req, res) => {
  let response

  try {
    response = await parser.parseURL(req.body.url)
  } catch (error) {
    return res.status(500).json({error})
  }

  const {title} = response
  const db = await dbPromise
  await db.run('INSERT INTO feeds VALUES(?, ?, ?, ?)', [slugify(title), title, req.body.url, null])

  await syncFeed()

  return res.json({error: null})
})

app.get('/', async (req, res) => {
  const db = await dbPromise
  const posts = await db.all(`
    SELECT posts.content, posts.link, posts.pubDate, feeds.title FROM posts, feeds
    WHERE posts.feed_id = feeds.id
    ORDER BY posts.pubDate DESC
    LIMIT 50
  `)
  for (const post of posts) {
    const date = new Date(post.pubDate)

    const month = date.getMonth() + 1
    const monthWithLeadingZero = month < 10 ? `0${month}` : month

    const day = date.getDate()
    const dayWithLeadingZero = day < 10 ? `0${day}` : day

    post.pubDate = `${date.getFullYear()}-${monthWithLeadingZero}-${dayWithLeadingZero}`

    post.favoriteUrl = `${process.env.FAVORITE_URL}${encodeURIComponent(post.link)}`
  }
  return res.render('index', {posts})
})

app.use('/web-push', webPush)

app.listen(port, () => debug(`App listening on port ${port}`))
