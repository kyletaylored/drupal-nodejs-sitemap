const cheerio = require('cheerio')
const Sitemapper = require('sitemapper')
const fetch = require('node-fetch')
const jsonfile = require('jsonfile')

let sitemap = new Sitemapper()
let pagetypes = {}
let statusCodes = {}
let file = './results/sitemap-results.json'
let log = console.log.bind(this)

async function asyncForEach (array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array)
  }
}

async function main () {
  try {
    let sites = await sitemap.fetch('https://www.macouncil.org/sitemap.xml')
    await asyncForEach(sites.sites, async url => processSitemapPage(url))
  } catch (err) {
    console.log('Err: ', err)
  }

  await log({ 'Page Types': pagetypes, statusCodes: statusCodes })
  await jsonfile.writeFile(
    file,
    {
      nodes: pagetypes,
      statusCodes: statusCodes
    },
    err => console.error(err)
  )
}

async function processSitemapPage (url) {
  await fetch(url)
    .then(resp =>
      resp.text().then(body => {
        if (resp.status === 200 && body) {
          // Parse the document body
          let $ = cheerio.load(body)
          // Extract from body.
          let htmlBody = $('body')
          extractNodeTypes(htmlBody, url, pagetypes)
        } else {
          // TODO: this never gets called...
          log('STATUS: ', resp.status)
          storeResults(statusCodes, resp.status, url)
        }
      })
    )
    .catch(err => console.log(err))
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

main()
