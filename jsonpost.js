const request = require('request')
const fs = require('fs')

var content = JSON.parse(fs.readFileSync('results/sitemap.json'))
// console.log(content)

var options = {
  url: 'https://api.jsonbin.io/b',
  headers: {
    'Content-Type': 'application/json',
    'secret-key': '',
    'collection-id': ''
  }
}

request.post(options, content, function (err, httpResponse, body) {
  if (err) {
    console.log(err)
  }
  // console.log(httpResponse)
})
