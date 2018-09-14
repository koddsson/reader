const express = require('express')
const bodyParser = require('body-parser')

const app = express()
app.set('view engine', 'hbs')
app.use(express.static('public'))
app.use(bodyParser.json())

const Parser = require('rss-parser')
const parser = new Parser()

const port = process.env.PORT || 3000

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

const feeds = {
  replyall: {
    title: 'Reply All',
    image:
      'https://static.megaphone.fm/podcasts/05f71746-a825-11e5-aeb5-a7a572df575e/image/uploads_2F1516902193862-jqkml22bswo-cee641b4533ddb31a5a7ab656fe45116_2FCURRENT_Reply%2BAll%2BLogo.png',
    url: 'http://feeds.gimletmedia.com/hearreplyall'
  }
}

app.post('/feed', async (req, res) => {
  const {title, items} = await parser.parseURL(req.body.url)

  const episodes = items
    .map(item => {
      if (!item.enclosure) {
        return null
      }
      return {title: item.title, url: item.enclosure.url}
    })
    .filter(x => x)

  return res.json({title, episodes})
})

app.get('/:feed', async (req, res) => {
  return res.render('series')
})

app.post('/feeds', async (req, res) => {
  let response

  try {
    response = await parser.parseURL(req.body.url)
  } catch (error) {
    return res.status(500).json({error})
  }

  const {
    title,
    image: {url: image}
  } = response
  return res.json({title, url: req.body.url, image, id: slugify(title)})
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
