var prompt = require('prompt');
var request = require('request');
var cheerio = require('cheerio');
var url = require('url-parse');
var Sitemapper = require('sitemapper');
var cliProgress = require('cli-progress');
const fs = require('fs');
var jsonfile = require('jsonfile');
const forEP = require('foreach-promise');

// Instantiate new Sitemapper, progress bar, and json file.
var sitemap = new Sitemapper();
var bar = new cliProgress.Bar({}, cliProgress.Presets.shades_classic);
var file = './results.json';

// Create form / node pages.
var formTypes, nodeTypes = {};

// Create prompt input.
var properties = [
  {
    name: 'url',
    validator: /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_.~#?&//=]*)?/gi,
    warning: 'URL must include HTTP or HTTPS.'
  }
];

// Start capturing input.
prompt.start();
prompt.get(properties, function (err, result) {
  if (err) { return onErr(err); }
  console.log('Command-line input received:');
  console.log('  URL: ' + result.url);

  // Use URL as part of JSON file name (in case running multiple scans.)
  file = './results/' + result.url.split('.')[1] + '-results.json';
  parseSitemap(result.url);
  // Parse page.
  // parseWebpage(result.url);
});

/*
 * Process sitemap.
 */
function parseSitemap(url) {
  sitemap.fetch(url).then(function(sites) {
    // start the progress bar with total value of sites.
    // console.log(sites.sites.length);
    bar.start(sites.sites.length, 0);

    for (var i = 0; i < sites.sites.length; i++) {
      parseWebpage(sites.sites[i]);
    }

    // stop the progress bar
    bar.stop();

    // Write to file.
    var results = {
      "nodes": nodeTypes,
      "forms": formTypes
    }
    jsonfile.writeFile(file, results, function (err) {
      console.error(err)
    });
    // Kill process.
    process.exit();

  });
}

/*
 * Process webpage for classes.
 */
function parseWebpage(page) {
  // Make request for page content.
  request(page, function(error, response, body) {
    if (error) {
      // onErr(error);
    }
    // Sometimes there isn't always a response.
    if (response) {
      // Check status code (200 is HTTP OK)
      // console.log("Status code: " + response.statusCode);
      if(response.statusCode === 200 && body) {
        // Parse the document body
        var $ = cheerio.load(body);
        // Extract from body.
        let htmlBody = $('body');
        let forms = $('form', htmlBody);
        extractNodeTypes(htmlBody, this.uri.href, nodeTypes);
        // extractFormTypes(forms, this.uri.href, formTypes);

      }
    }
    // Update the current value of progress by 1, even if request fails.
    bar.increment();
  });
}

/**
 * Extract node data.
 */
function extractNodeTypes(body, url, docstore) {
  let classes = body.attr('class');
  let nodeType = null;
  for (className of classes.split(' ')) {
    if (className.includes('node-type-')) {
      storeResults(nodeTypes, className.substr(10), url)
      break;
    }
  }
}

/**
 * Extract form data.
 */
function extractFormTypes(forms, url, docstore) {
  if (forms.length > 0) {
    forms.forEach(function(form) {
      storeResults(formTypes, form.attr('id'), url);
    });

  }
}

/**
 * Create a section in the larger doctore object to keep node and form data
 * while we're processing each request. Keep an array of URLs attached to each
 * keyed ID or name.
 */
function storeResults(docstore, name, url) {
  // Init count and type.
  if (!docstore[name]) {
    docstore[name] = {
      count: 0,
      urls: []
    };
  }

  docstore[name].count = docstore[name].count + 1;
  docstore[name].urls.push(url);
}

// Helper error function.
function onErr(err) {
  console.log(err);
  return 1;
}
