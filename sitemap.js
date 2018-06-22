const prompt = require('prompt')
const cheerio = require('cheerio')
const Sitemapper = require('sitemapper')
const fetch = require('node-fetch')
const jsonfile = require('jsonfile')
const cliProgress = require('cli-progress')

let sitemap = new Sitemapper()
let bar = new cliProgress.Bar({}, cliProgress.Presets.shades_classic)
let file = './results/sitemap-results.json'
let log = console.log.bind(this)

// Docstore.
let nodeTypes = {}
let formTypes = {}
let statusCodes = {}

// Create prompt input.
var properties = [
  {
    name: 'url',
    validator: /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_.~#?&//=]*)?/gi,
    warning: 'URL must include HTTP or HTTPS.'
  }
]

// Main function to run.
async function main (sitemapUrl) {
  try {
    let sites = await sitemap.fetch(sitemapUrl)
    bar.start(sites.sites.length, 0)
    await asyncForEach(sites.sites, async url => processSitemapPage(url))
  } catch (err) {
    console.log('Err: ', err)
  }

  await bar.stop()
  await log({ 'Node Types': nodeTypes, statusCodes: statusCodes })
  await jsonfile.writeFile(
    file,
    {
      nodes: nodeTypes,
      forms: formTypes,
      statusCodes: statusCodes
    },
    err => console.error(err)
  )
}

// Helper function for async processing in a for loop.
async function asyncForEach (array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array)
  }
}

// Process the URL in the sitemap, store results in docstore.
async function processSitemapPage (url) {
  await fetch(url)
    .then(resp =>
      resp.text().then(body => {
        if (resp.status === 200 && body) {
          // Parse the document body
          let $ = cheerio.load(body)
          // Extract from body.
          let htmlBody = $('body')
          let forms = $('form', htmlBody)
          extractNodeTypes(htmlBody, url, nodeTypes)
          extractFormTypes(forms, url, formTypes)
        } else {
          // TODO: this never gets called...
          log('STATUS: ', resp.status)
          storeResults(statusCodes, resp.status, url)
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
async function extractNodeTypes (body, url, docstore) {
  let classes = await body.attr('class')
  for (let className of classes.split(' ')) {
    if (className.includes('node-type-')) {
      storeResults(docstore, className.substr(10), url)
      break
    }
  }
}

/**
 * Extract form data.
 */
async function extractFormTypes (forms, url, docstore) {
  if (forms.length > 0) {
    for (var i = 0; i < forms.length; i++) {
      storeResults(docstore, forms[i].attribs.id, url)
    }
  }
}

/**
 * Create a section in the larger doctore object to keep node and form data
 * while we're processing each request. Keep an array of URLs attached to each
 * keyed ID or name.
 */
function storeResults (docstore, name, url) {
  // Init count and type.
  if (!docstore[name]) {
    docstore[name] = {
      count: 0,
      urls: []
    }
  }

  docstore[name].count = docstore[name].count + 1
  docstore[name].urls.push(url)
}

// Launch script.
// Start capturing input.
prompt.start()
prompt.get(properties, function (err, result) {
  if (err) {
    return onErr(err)
  }
  console.log('Command-line input received:')
  // console.log('  URL: ' + result.url)
  console.tabple(result)

  // Use URL as part of JSON file name (in case running multiple scans.)
  file = './results/' + result.url.split('.')[1] + '-results.json'

  // Parse sitemap.
  main(result.url)
})
