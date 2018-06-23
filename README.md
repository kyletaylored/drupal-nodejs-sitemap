# Drupal NodeJS Sitemap Analyzer

This is a simple node.js script that will process a sitemap to extract content types and other information for research purposes.

All you need to do is install the node modules, then run the sitemap script.

```bash
npm install
node sitemap.js
```

You will be prompted to enter the URL for the sitemap.xml file. The script will then begin analyze each page to detect node type body classes, forms, and any pages returned with non-success HTTP statuses.

The output will look similar to the following:

```json
{
  "nodeTypes": {
    "site-page": {
      "count": 1254,
      "urls": [Array]
    },
    "press-release": {
      "count": 5224,
      "urls": [Array]
    },
    "webform": {
      "count": 38,
      "urls": [Array]
    },
    "job-posting": {
      "count": 42,
      "urls": [Array]
    }
  },
  "formTypes": {
    "publication": {
      "count": 4,
      "urls": [Array]
    },
    "webform-client-form-34560": {
      "count": 1,
      "urls": [Array]
    },
    "searchForm": {
      "count": 2,
      "urls": [Array]
    },
    "undefined": {
      "count": 3,
      "urls": [Array]
    },
    "webform-client-form-47196": {
      "count": 1,
      "urls": [Array]
    }
  },
  "statusCodes": {
    "403": {
      "count": 711,
      "urls": [Array]
    },
    "404": {
      "count": 757,
      "urls": [Array]
    }
  }
}
```
