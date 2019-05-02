const express = require("express");
let results = {};
try {results = require("../results/sitemap-results.json")} catch(e){};
const http = require("http");
const reload = require("reload");
const bodyParser = require("body-parser");
const logger = require("morgan");
const jsonFile = require("jsonfile");
const path = require('path');
const app = express();

// Set up middle layer
app.set("view engine", "ejs");
app.set('views', path.join(__dirname, '/views'));
app.use(express.static("build"));
app.set("port", process.env.PORT || 3000);
app.use(logger("dev"));
app.use(bodyParser.json()); // Parses json, multi-part (file), url-encoded

// Create routes
app.get("/", (req, res) => res.render("dashboard"));

// Fetch results.
app.get("/results", function(req, res) {
  res.send(Object.keys(results));
});
app.get("/results/:id", function(req, res) {
  let fileName = "./results/" + req.params.id + ".json";
  jsonFile.readFile(fileName, function(err, jsonData) {
    res.send(jsonData);
  });
});

// Load server
var server = http.createServer(app);

// Reload code here
reload(app);

server.listen(app.get("port"), function() {
  console.log("Web server listening on port " + app.get("port"));
});
