const express = require('express')
const bodyParser = require('body-parser')
const MongoClient = require('mongodb').MongoClient
const app = express()

// ========================
// Link to Database
// ========================
// Updates environment variables
require('./dotenv')

// Replace process.env.DB_URL with your actual connection string
const connectionString = process.env.DB_URL

MongoClient.connect(connectionString, { useUnifiedTopology: true })
  .then(client => {
    createApp(client)
  })
  .catch((e) => console.log(e))

function createApp(client) {
  console.log('Connected to Database')
  const db = client.db(process.env.DB_NAME)
  const quotesCollection = db.collection('quotes')

  // ========================
  // Middlewares
  // ========================
  app.set('view engine', 'ejs')
  app.use(bodyParser.urlencoded({ extended: true }))
  app.use(bodyParser.json())
  app.use(express.static('public'))

  // ========================
  // Routes
  // ========================
  app.get('/', (req, res) => {
    db.collection('quotes').find().toArray()
      .then(quotes => {
        res.render('index.ejs', { quotes: quotes })
      })
      .catch(/* ... */)
  })

  app.get('/quotes', (req, res) => {
    db.collection('quotes').find().toArray().then(quotes => {
      res.json({ quotes: quotes })
    })
  })

  app.post('/quotes', (req, res) => {
    quotesCollection.insertOne(req.body)
      .then(result => {
        res.redirect('/')
      })
      .catch(error => console.error(error))
  })

  app.put('/quotes', (req, res) => {
    quotesCollection.findOneAndUpdate(
      { name: 'Yoda' },
      {
        $set: {
          name: req.body.name,
          quote: req.body.quote
        }
      },
      {
        upsert: true
      }
    )
      .then(result => {
        console.log(result)
        res.json(result)
      })
      .catch(error => console.error(error))
  })
  app.put('/quotes/:attr/:value', (req, res) => {
    quotesCollection.findOneAndUpdate(
      { [req.params.attr]: req.params.value },
      {
        $set: {
          name: req.body.name,
          quote: req.body.quote
        }
      },
      {
        upsert: true
      }
    )
      .then(result => {
        console.log(result)
        res.json(result)
      })
      .catch(error => console.error(error))
  })

  app.delete('/quotes', (req, res) => {
    quotesCollection.deleteOne(
      { name: req.body.name }
    )
      .then(result => {
        if (result.deletedCount === 0) {
          return res.json('No quote to delete')
        }
        res.json('Deleted Darth Vadar\'s quote')
      })
      .catch(error => console.error(error))
  })

  // ========================
  // Listen
  // ========================
  const isProduction = process.env.NODE_ENV === 'production'
  const port = isProduction ? process.env.PORT || 7500 : 3000
  console.log(`Trying listening on ${port}`)
  app.listen(port, function () {
    console.log(`listening on ${port}`)
  })
}