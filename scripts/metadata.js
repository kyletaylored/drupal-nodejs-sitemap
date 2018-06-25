const extract = require('meta-extractor')
const jsonfile = require('jsonfile')

let sitemapUrl = process.argv[2]
let path = new URL(sitemapUrl)

extract({ uri: path.origin }, (err, res) => {
  jsonfile.writeFile(
    'results/metadata.json',
    {
      metadata: res
    },
    err => console.error(err)
  )
})
