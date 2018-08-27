const express = require('express')
const app = express()
app.set('view engine', 'hbs')

const Parser = require('rss-parser')
const parser = new Parser()

const port = process.env.PORT || 3000

const feeds = {
  replyall: {
    title: 'Reply All',
    image:
      'https://static.megaphone.fm/podcasts/05f71746-a825-11e5-aeb5-a7a572df575e/image/uploads_2F1516902193862-jqkml22bswo-cee641b4533ddb31a5a7ab656fe45116_2FCURRENT_Reply%2BAll%2BLogo.png',
    url: 'http://feeds.gimletmedia.com/hearreplyall'
  }
}

app.get('/:feed', async (req, res) => {
  const url = feeds[req.params.feed].url
  const feed = await parser.parseURL(url)

  const episodes = feed.items.map(item => {
    return {title: item.title, url: item.enclosure.url}
  })

  return res.render('series', {episodes})
})

app.get('/', async (req, res) => {
  return res.render('index', {
    feeds: Object.entries(feeds).reduce((acc, [key, curr]) => {
      curr.id = key
      return [...acc, curr]
    }, [])
  })
})

// eslint-disable-next-line no-console
app.listen(port, () => console.log(`App listening on port ${port}`))
