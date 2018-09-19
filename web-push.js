const express = require('express')
const bodyParser = require('body-parser')
const sqlite = require('sqlite')
const dbPromise = sqlite.open('./reader.db', {Promise})

const app = express()
app.use(bodyParser.json())

app.post('/', async (req, res) => {
  const db = await dbPromise
  const {
    endpoint,
    expirationTime,
    keys: {p256dh, auth}
  } = req.body
  await db.run('INSERT INTO push_subscriptions VALUES(?, ?, ?, ?)', [endpoint, p256dh, auth, expirationTime])
  return res.json({ok: true})
})

module.exports = app
