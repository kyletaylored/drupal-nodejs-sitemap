const express = require('express-alias')
const results = require('../results/sitemap-results.json')
const http = require('http')
const path = require('path')
const reload = require('reload')
const bodyParser = require('body-parser')
const logger = require('morgan')
const app = express()

// Set up middle layer
app.set('view engine', 'ejs')
app.use(express.static('public'))
app.set('port', process.env.PORT || 3000)
app.use(logger('dev'))
app.use(bodyParser.json()) // Parses json, multi-part (file), url-encoded

// Create routes
app.get('/', (req, res) => res.render('dashboard'))
app.get('/icons', (req, res) => res.render('icons'))
app.get('/user', (req, res) => res.render('user'))
app.get('/tables', (req, res) => res.render('tables'))

// Aliases
app.alias('/', 'dashboard', 'dashboard.html')
app.alias('user', 'user.html')

// Fetch results.
app.get('/results', function(req, res) {
  res.send(Object.keys(results))
})
app.get('/results/:id', function(req, res) {
  res.send(results[req.params.id])
})


// Load server
var server = http.createServer(app)

// Reload code here
reload(app);

server.listen(app.get('port'), function () {
  console.log('Web server listening on port ' + app.get('port'))
})
