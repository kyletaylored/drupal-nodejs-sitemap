const express = require('express')
const results = require('../results/sitemap-results.json')
const http = require('http')
const path = require('path')
const reload = require('reload')
const bodyParser = require('body-parser')
const logger = require('morgan')
const jsonFile = require('jsonfile')
const app = express()

// Set up middle layer
app.set('view engine', 'ejs')
app.use(express.static('production'))
app.use(express.static('vendors'))
app.set('port', process.env.PORT || 3002)
app.use(logger('dev'))
app.use(bodyParser.json()) // Parses json, multi-part (file), url-encoded

// Create routes
app.get('/', (req, res) => res.render('dashboard'))

// Fetch results.
app.get('/results', function(req, res) {
  res.send(Object.keys(results))
})
app.get('/results/:id', function(req, res) {
  let fileName = '../results/' + req.params.id + '.json'
  jsonFile.readFile(fileName, function(err, jsonData) {
    if (err) res.send(err)
    res.send(jsonData)
  })
  // res.send(results[req.params.id])
})

// Load server
var server = http.createServer(app)

// Reload code here
reload(app)

server.listen(app.get('port'), function() {
  console.log('Web server listening on port ' + app.get('port'))
})
