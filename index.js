var prompt = require('prompt');
var request = require('request');
var cheerio = require('cheerio');
var url = require('url-parse');
var Sitemapper = require('sitemapper');

// Instantiate new Sitemapper.
var sitemap = new Sitemapper();

// Create prompt input.
var properties = [
  {
    name: 'url',
    validator: /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)?/gi,
    warning: 'URL must include HTTP or HTTPS.'
  }
];

prompt.start();

prompt.get(properties, function (err, result) {
  if (err) { return onErr(err); }
  console.log('Command-line input received:');
  console.log('  URL: ' + result.url);

  parseSitemap(result.url);
  // Parse page.
  // parseWebpage(result.url);
});


function parseSitemap(url) {
  sitemap.fetch(url).then(function(sites) {
    // console.log(sites);
    sites.sites.forEach(url => processSitemapPage(url));
  });

}

function processSitemapPage(url) {
  parseWebpage(url);
}

function parseWebpage(page) {
  console.log("Visiting page " + page);
  request(page, function(error, response, body) {
    if (error) {
      console.log("Error: " + error);
    }
    if (response) {
      // Check status code (200 is HTTP OK)
      console.log("Status code: " + response.statusCode);
      if(response.statusCode === 200) {
        // Parse the document body
        var $ = cheerio.load(body);
        console.log("Page title:  " + $('title').text());
      }
    }
  });
}

// Helper error function.
function onErr(err) {
  console.log(err);
  return 1;
}
