const prompt = require("prompt");
const cheerio = require("cheerio");
const Sitemapper = require("sitemapper");
const fetch = require("node-fetch");
const jsonfile = require("jsonfile");
const cliProgress = require("cli-progress");
const URL = require("url").URL;
const path = require("path");
const extract = require("meta-extractor");
const lang = require("./scripts/lang.js");

// Instansiate utilities.
let sitemap = new Sitemapper();
let bar = new cliProgress.Bar({}, cliProgress.Presets.shades_classic);
let log = console.log.bind(this);
let fileUrlSample = "";
let https = true;

// Debugging
// let loopLimit = 20

// Docstore.
let nodeTypes = {};
let formTypes = {};
let langCodes = {};
let statusCodes = {};
let fileTypes = {};
let metadata = {};
let headers = {
  responseTimes: {
    values: []
  }
};
let loopCount = 0;

// Main function to run.
async function main(sitemapUrl, file) {
  try {
    // Process sitemap for URLs
    let sites = await sitemap.fetch(sitemapUrl);
    https = !sitemapUrl.match("^http://");
    // Get sample URL
    fileUrlSample = new URL(sites.sites[0]);
    metadata["pageCount"] = sites.sites.length;
    await extractMeta(fileUrlSample.origin);
    // Start loop.
    bar.start(sites.sites.length, 0);
    await asyncForEach(sites.sites, async uri => processSitemapPage(uri));
  } catch (err) {
    console.log("Err: ", err);
  }

  // Use URL sample as part of JSON file name (in case running multiple scans.)
  let key = fileUrlSample.hostname;
  file = "results/" + key + ".json";

  // Kill progress bar.
  await bar.stop();

  // Process math for response times, merge in.
  let respObj = {
    average: headers.responseTimes.values.average(),
    min: headers.responseTimes.values.min(),
    max: headers.responseTimes.values.max()
  };
  headers.responseTimes = Object.assign(respObj, headers.responseTimes);

  // Merge into single object.
  let metaObj = {
    metadata: metadata,
    nodeTypes: nodeTypes,
    fileTypes: fileTypes,
    formTypes: formTypes,
    statusCodes: statusCodes,
    langCodes: langCodes,
    headers: headers
  };

  // Get final filename.

  // Print results
  await log(metaObj);

  // Write to own file
  await jsonfile.writeFile(file, metaObj, err => console.error(err));

  // Update master list.
  let masterFile = "./results/sitemap-results.json";
  jsonfile.readFile(masterFile, (err, obj) => {
    if (err !== null) {
      if (err.code === "ENOENT") {
        let tmpObj = {};
        tmpObj[key] = key;
        jsonfile.writeFile(masterFile, tmpObj, err => console.error(err));
        console.log("Created new sitemap-results.json file.");
      }
    } else {
      obj[key] = key;
      jsonfile.writeFile(masterFile, obj, err => console.error(err));
    }
  });
}

/**
 * Helper function for async processing in a for loop.
 * @param {array} array An array to process
 * @param {function} callback A callback function
 */
async function asyncForEach(array, callback) {
  // let limit = loopLimit || array.length
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

/**
 * Get metadata.
 * Check for redirect, then use final path as URL
 * @param {string} uri A URL to be processed.
 */
async function extractMeta(uri) {
  await fetch(uri).then(resp => {
    if (resp) {
      extract({ uri: resp.url }, (_err, res) => {
        res = res || {};
        metadata = Object.assign(res, metadata);
      });
    }
  });
}

// Process the URL in the sitemap, store results in docstore.
async function processSitemapPage(uri) {
  let startTime = new Date().getTime();

  // Normalize URLs
  uri =
    https && uri.match("^http://") ? uri.replace("http://", "https://") : uri;

  // Check if URI is a file.
  let ext = path.extname(uri);
  let extensions = ["", ".html", ".org", ".com", ".io", ".net", ".biz"];
  if (!extensions.includes(ext)) {
    processFileType(uri, ext);
    let endTime = new Date().getTime();
    headers.responseTimes.values.push(endTime - startTime);
  } else {
    await fetch(uri)
      .then(resp => {
        let endTime = new Date().getTime();

        resp.text().then(body => {
          if (resp.status === 200 && body && !resp.redirected) {
            // Store headers for first request.
            if (loopCount < 1) {
              resp.headers.forEach(function(value, name) {
                headers[name] = value;
              });
              loopCount++;
            }

            // Capture response time.
            headers.responseTimes.values.push(endTime - startTime);

            // Parse the document body
            let $ = cheerio.load(body);
            // Extract from body.
            let html = $("html");
            let htmlBody = $("body");
            let forms = $("form", htmlBody);
            extractLanguage(html, uri, langCodes);
            extractNodeTypes(htmlBody, uri, nodeTypes);
            extractFormTypes(forms, uri, formTypes);
            storeResults(statusCodes, resp.status, uri);
          } else {
            if (resp.redirected) {
              let redCodes = {
                follow: "301 / 302",
                error: "500",
                manual: "manual"
              };
              storeResults(statusCodes, redCodes[resp.redirected], uri);
            } else {
              // If response fails, store that record.
              storeResults(statusCodes, resp.status, uri);
            }
          }
        });
      })
      .catch(err => console.log(err));
  }

  // Update the current value of progress by 1, even if request fails.
  bar.increment();
}

/**
 * Extracts node data.
 * @param {object} body
 * @param {string} uri
 * @param {object} docstore
 */
async function extractNodeTypes(body, uri, docstore) {
  let classes = await body.attr("class");
  if (classes) {
    for (let className of classes.split(" ")) {
      cName = className;
      // Multiple types of regex. Uncomment the one you need.
      // Drupal (default)
      var regex = /(?:.*node-type-)/g;
      var cName = className.replace(regex, "").trim();
      // WordPress
      // var regex = /(?:.*-template-)/g;
      // var cName = className.trim();
      if (className.match(regex)) {
        storeResults(docstore, cName, uri);
        break;
      }
    }
  } else {
    storeResults(docstore, "NO BODY CLASSES", uri);
  }
}

/**
 * Extracts form data.
 * @param {array} forms
 * @param {string} uri URL being processed.
 * @param {object} docstore Object to store results in.
 */
async function extractFormTypes(forms, uri, docstore) {
  if (forms.length > 0) {
    for (var i = 0; i < forms.length; i++) {
      let form = forms[i];

      let formId = form.attribs.id || false;
      if (!formId) {
        if (form.attribs.class !== "") {
          for (let className of form.attribs.class) {
            formId = className;
            break;
          }
        } else {
          formId = "undefined";
        }
      }
      storeResults(docstore, formId, uri);
    }
  }
}

async function extractLanguage(html, uri, docstore) {
  if (html.attr("lang")) {
    // let name = lang.getName(html.attr("lang"));
    storeResults(docstore, html.attr("lang"), uri);
  }
}

/**
 * Process file.
 * @param {string} uri The url of the file.
 */
async function processFileType(uri, ext) {
  // It's a file.
  storeResults(fileTypes, ext, uri);
  await fetch(uri)
    .then(resp => {
      storeResults(statusCodes, resp.status, uri);
    })
    .catch(err => {});
}

/**
 * Create a section in the larger doctore object to keep node and form data
 * while we're processing each request. Keep an array of URLs attached to each
 * keyed ID or name.
 *
 * @param {object} docstore The object where this data is being stored, like nodeType.
 * @param {string} name The key space in the docstore.
 * @param {string} uri The URL being processed.
 */
function storeResults(docstore, name, uri) {
  // Init count and type.
  if (!docstore[name]) {
    docstore[name] = {
      count: 0,
      urls: []
    };
  }

  docstore[name].count = docstore[name].count + 1;
  docstore[name].urls.push(uri);
}

// Add calculation functions to Array prototype
Array.prototype.average = function() {
  return (this.reduce((sume, el) => sume + el, 0) / this.length).toFixed(2);
};
Array.prototype.max = function() {
  return this.reduce((a, b) => Math.max(a, b), []);
};
Array.prototype.min = function() {
  return this.reduce((a, b) => Math.min(a, b), []);
};

/**
 * Report errors.
 * @param {*} err Any object.
 */
function onErr(err) {
  console.log(err);
  return 1;
}

// Create prompt input.
var properties = [
  {
    name: "url",
    validator: /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_.~#?&//=]*)?/gi,
    warning: "URL must include HTTP or HTTPS."
  }
];

// Launch script.
// Start capturing input - use CLI or prompt.
if (process.argv[2]) {
  main(process.argv[2]);
} else {
  prompt.start();
  prompt.get(properties, function(err, result) {
    if (err) {
      return onErr(err);
    }
    // console.log('Command-line input received:')
    // console.table(result)

    // Parse sitemap.
    main(result.url);
  });
}
