var Sitemapper = require('sitemapper');

var sitemap = new Sitemapper();

sitemap.fetch('https://ag.ny.gov/sitemap.xml').then(function(sites) {
  // console.log(sites);
  sites.sites.forEach(url => processSitemapPage(url));
});

function processSitemapPage(url) {
  console.log(url);
}
