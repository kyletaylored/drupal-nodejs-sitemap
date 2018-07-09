# Drupal NodeJS Sitemap Analyzer

This is a simple node.js script that will process a sitemap to extract content types and other information for research purposes.

<a href="https://www.useloom.com/embed/1b0335cf171a4240839682ccd3fab4fa" target="_blank">Demo video</a>

## Scraper

All you need to do is install the node modules, then run the sitemap script.

```bash
npm install
node sitemap-json.js
```

You will be prompted to enter the URL for the sitemap.xml file. The script will then begin analyze each page to detect metadata, node type body classes, forms, and any pages returned with non-success HTTP statuses.

Alternatively, you can either pass in the sitemap URL as an argument, or wait for the prompt.

```bash
node sitemap-json.js https://www.example.com/sitemap.xml
```

The output will look similar to the following:

```json
{
  "metadata": {
    "host": "www.example.com",
    "path": "/",
    "title": "Example website description.",
    "charset": "utf-8",
    "feeds": []
  },
  "nodeTypes": {
    "press-release": {
      "count": 889,
      "urls": ["Array"]
    },
    "gallery": {
      "count": 764,
      "urls": ["Array"]
    },
    "video": {
      "count": 977,
      "urls": ["Array"]
    },
    "publication": {
      "count": 1812,
      "urls": ["Array"]
    },
    "country": {
      "count": 85,
      "urls": ["Array"]
    },
    "article": {
      "count": 6318,
      "urls": ["Array"]
    },
    "page": {
      "count": 1362,
      "urls": ["Array"]
    }
  },
  "formTypes": {
    "mc-embedded-subscribe-form": {
      "count": 7,
      "urls": ["Array"]
    },
    "search-block-form": {
      "count": 4,
      "urls": ["Array"]
    },
    "webform-client-form-16622": {
      "count": 1,
      "urls": ["Array"]
    },
    "newsletter": {
      "count": 1,
      "urls": ["Array"]
    }
  },
  "statusCodes": {
    "403": {
      "count": 1235,
      "urls": ["Array"]
    },
    "404": {
      "count": 4,
      "urls": ["Array"]
    }
  },
  "langCodes": {
    "Vietnamese": {
      "count": 139,
      "urls": ["Array"]
    },
    "English": {
      "count": 205,
      "urls": ["Array"]
    },
    "Serbian": {
      "count": 1,
      "urls": ["Array"]
    },
    "Albanian": {
      "count": 233,
      "urls": ["Array"]
    },
    "Romanian": {
      "count": 1,
      "urls": ["Array"]
    },
    "Portuguese": {
      "count": 1,
      "urls": ["Array"]
    },
    "Mongolian": {
      "count": 4,
      "urls": ["Array"]
    },
    "Khmer": {
      "count": 14,
      "urls": ["Array"]
    }
  }
}
```

## Dashboard

To view the dashboard (currently in dev), run the following and visit [localhost:3002](http://localhost:3002):

```bash
cd dashboard
node app.js
```
