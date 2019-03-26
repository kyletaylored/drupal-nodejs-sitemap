const prompt = require("prompt");
const cheerio = require("cheerio");
const Sitemapper = require("sitemapper");
const fetch = require("node-fetch");
const axios = require("axios");
const jsonfile = require("jsonfile");
const cliProgress = require("cli-progress");
const URL = require("url").URL;
const path = require("path");
const extract = require("meta-extractor");
const lang = require("./scripts/lang.js");
const pLimit = require("p-limit");
const limit = pLimit(6);

// Instansiate utilities.
let sitemap = new Sitemapper();
let bar = new cliProgress.Bar({}, cliProgress.Presets.shades_classic);
let log = console.log.bind(this);
let fileUrlSample = "";
const debugMode = false;
let https = true;

// Debugging
// let loopLimit = 20

// Docstore.
let nodeTypes = {};
let formTypes = {};
let fileTypes = {};
let langCodes = {};
let statusCodes = {};
let metadata = {};
let headers = {
  responseTimes: {
    values: []
  }
};
let loopCount = 0;

// Main function to run.
async function main(sitemapUrl) {
  https = !sitemapUrl.match("^http://");
  try {
    // Process sitemap for URLs
    await sitemap
      .fetch(sitemapUrl)
      .then(sites => {
        // Get sample URL
        fileUrlSample = new URL(sites.sites[0]);
        metadata["pageCount"] = sites.sites.length;
        extractMeta(fileUrlSample.origin);

        // Start loop.
        bar.start(sites.sites.length, 0);
        getAllUrls(sites.sites).then(() => {
          // Use URL sample as part of JSON file name (in case running multiple scans.)
          let key = fileUrlSample.hostname;
          let file = "results/" + key + ".json";

          // Kill progress bar.
          bar.stop();

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
            formTypes: formTypes,
            statusCodes: statusCodes,
            langCodes: langCodes,
            headers: headers
          };

          // Print results
          log(metaObj);

          // Write to own file
          jsonfile.writeFile(file, metaObj, err => console.error(err));

          // Update master list.
          let masterFile = "./results/sitemap-results.json";
          jsonfile.readFile(masterFile, (err, obj) => {
            if (err !== null) {
              if (err.code === "ENOENT") {
                let tmpObj = {};
                tmpObj[key] = key;
                jsonfile.writeFile(masterFile, tmpObj, err =>
                  console.error(err)
                );
                console.log("Created new sitemap-results.json file.");
              }
            } else {
              obj[key] = key;
              jsonfile.writeFile(masterFile, obj, err => console.error(err));
            }
          });
        });
      })
      .catch(err => {
        console.log(funcName(arguments), err);
      });
  } catch (err) {
    debug("Err: ", err);
  }
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
  await axios(uri)
    .then(resp => {
      if (resp) {
        extract({ uri: resp.config.url }, (_err, res) => {
          metadata = Object.assign(res, metadata);
        });
      }
    })
    .catch(err => {
      debug(funcName(arguments), err);
    });
}

// Process the URL in the sitemap, store results in docstore.
async function processSitemapPage(uri) {
  // Start timer.
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
    await axios({ maxRedirects: 0, method: "get", url: uri })
      .then(resp => {
        // Capture response time.
        let endTime = new Date().getTime();
        headers.responseTimes.values.push(endTime - startTime);
        // Process request.
        processRequest(resp, uri);
      })
      .catch(err => {
        debug(funcName(arguments), err);
        // If response fails, store that record.
        storeResults(statusCodes, err.response.status, uri);
      });
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
      if (className.includes("node-type-")) {
        storeResults(docstore, className.substr(10), uri);
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
      storeResults(docstore, forms[i].attribs.id, uri);
    }
  }
}

/**
 * Extract language from data.
 * @param {object} html
 * @param {string} uri
 * @param {object} docstore
 */
async function extractLanguage(html, uri, docstore) {
  if (html.attr("lang")) {
    let name = lang.getName(html.attr("lang"));
    storeResults(docstore, name, uri);
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
    .catch(err => {
      debug(funcName(arguments), err);
    });
}

/**
 *
 * @param {object} resp Response from Axios.
 */
async function processRequest(resp, uri) {
  // Store headers for first request.
  if (loopCount < 1) {
    for (let atr in resp.headers) {
      headers[atr] = resp.headers[atr];
    }
    loopCount++;
  }

  // Parse the document body
  let $ = cheerio.load(resp.data);
  // Extract from body.
  let html = $("html");
  let htmlBody = $("body");
  let forms = $("form", htmlBody);
  extractLanguage(html, uri, langCodes);
  extractNodeTypes(htmlBody, uri, nodeTypes);
  extractFormTypes(forms, uri, formTypes);
  storeResults(statusCodes, resp.status, uri);
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

/**
 * Process all URLs with increased concurrency.
 * @param {array} urls An array of URLs to process.
 */
async function getAllUrls(urls) {
  const promiseList = urls.map(uri => {
    return limit(() => processSitemapPage(uri));
  });
  try {
    await Promise.all(promiseList);
  } catch (error) {
    debug(error);
    // throw error;
  }
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
function debug() {
  if (debugMode) {
    console.log.apply(console, arguments);
    return 1;
  }
}

/**
 * Get function name.
 * @param {Object} args Native function arguments.
 */
function funcName(args) {
  return args.callee.toString().match(/function ([^\(]+)/)[1];
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
      return debug(err);
    }
    // console.log('Command-line input received:')
    // console.table(result)

    // Parse sitemap.
    let masterStart = new Date().getTime();
    main(result.url);
    console.log("Total time: ", new Date().getTime() - masterStart);
  });
}
