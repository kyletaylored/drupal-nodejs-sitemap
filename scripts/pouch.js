const PouchDB = require('pouchdb')

let sitemaps = new PouchDB('Sitemaps')
console.log(sitemaps.adapter)
sitemaps
  .put({ _id: 'ag.ny.gov', name: 'ag govner' })
  .then(info => console.log(info))
  .then(err => console.log(err))

// Create / update master list of sitemaps stored in db.
sitemaps
  .get('masterList')
  .then(function (doc) {
    console.log(doc)
    doc.sitemaps.push('generic')
    sitemaps.put(doc)
  })
  .catch(function (err) {
    console.log(err)
    // Create the list.
    if (err.name === 'not_found') {
      sitemaps.put({ _id: 'masterList', sitemaps: ['generic'] })
    }
  })
