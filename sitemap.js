const prompt = require('prompt')
const cheerio = require('cheerio')
const Sitemapper = require('sitemapper')
const fetch = require('node-fetch')
const jsonfile = require('jsonfile')
const cliProgress = require('cli-progress')
const url = require('url')
const extract = require('meta-extractor')

let sitemap = new Sitemapper()
let bar = new cliProgress.Bar({}, cliProgress.Presets.shades_classic)
let file = './results/sitemap-results.json'
let log = console.log.bind(this)

// Debugging
// let loopLimit = 20

// Docstore.
let nodeTypes = {}
let formTypes = {}
let statusCodes = {}
let metadata = {}

// Main function to run.
async function main (sitemapUrl, file) {
  // Use URL as part of JSON file name (in case running multiple scans.)
  let path = new URL(sitemapUrl)
  file = 'results/' + path.hostname + '.json'

  // Get metadata.
  extract({ uri: path.origin }, (err, res) => (metadata = res))

  try {
    let sites = await sitemap.fetch(sitemapUrl)
    bar.start(sites.sites.length, 0)
    await asyncForEach(sites.sites, async uri => processSitemapPage(uri))
  } catch (err) {
    console.log('Err: ', err)
  }

  // Kill progress bar.
  await bar.stop()

  // Merge into single object.
  let metaObj = {
    metadata: metadata,
    nodeTypes: nodeTypes,
    formTypes: formTypes,
    statusCodes: statusCodes
  }

  // Print results
  await log(metaObj)

  // Write results to json.
  await jsonfile.writeFile(file, metaObj, err => console.error(err))
}

// Helper function for async processing in a for loop.
async function asyncForEach (array, callback) {
  // let limit = loopLimit || array.length
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array)
  }
}

// Process the URL in the sitemap, store results in docstore.
async function processSitemapPage (uri) {
  await fetch(uri)
    .then(resp =>
      resp.text().then(body => {
        if (resp.status === 200 && body) {
          // Parse the document body
          let $ = cheerio.load(body)
          // Extract from body.
          let htmlBody = $('body')
          let forms = $('form', htmlBody)
          extractNodeTypes(htmlBody, uri, nodeTypes)
          extractFormTypes(forms, uri, formTypes)
        } else {
          // If response fails, store that record.
          storeResults(statusCodes, resp.status, uri)
        }
      })
    )
    .catch(err => console.log(err))

  // Update the current value of progress by 1, even if request fails.
  bar.increment()
}

/**
 * Extract node data.
 */
async function extractNodeTypes (body, uri, docstore) {
  let classes = await body.attr('class')
  for (let className of classes.split(' ')) {
    if (className.includes('node-type-')) {
      storeResults(docstore, className.substr(10), uri)
      break
    }
  }
}

/**
 * Extract form data.
 */
async function extractFormTypes (forms, uri, docstore) {
  if (forms.length > 0) {
    for (var i = 0; i < forms.length; i++) {
      storeResults(docstore, forms[i].attribs.id, uri)
    }
  }
}

/**
 * Create a section in the larger doctore object to keep node and form data
 * while we're processing each request. Keep an array of URLs attached to each
 * keyed ID or name.
 */
function storeResults (docstore, name, uri) {
  // Init count and type.
  if (!docstore[name]) {
    docstore[name] = {
      count: 0,
      urls: []
    }
  }

  docstore[name].count = docstore[name].count + 1
  docstore[name].urls.push(uri)
}

// Create prompt input.
var properties = [
  {
    name: 'url',
    validator: /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_.~#?&//=]*)?/gi,
    warning: 'URL must include HTTP or HTTPS.'
  }
]

// Launch script.
// Start capturing input.
prompt.start()
prompt.get(properties, function (err, result) {
  if (err) {
    return onErr(err)
  }
  // console.log('Command-line input received:')
  // console.table(result)

  // Parse sitemap.
  main(result.url, file)
})
