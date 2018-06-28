const jsonfile = require('jsonfile')

// Update master list.
let masterFile = './results/sitemaps.json'
jsonfile.readFile(masterFile, (err, obj) => {
  if (err) {
    switch (err.code) {
      case 'ENOENT':
        jsonfile.writeFile(masterFile, { list: [] }, err => console.error(err))
        console.log('Created new sitemap.json file.')
        break
      default:
        console.log(err)
    }
  } else {
    if (!obj.list.includes(key)) {
      obj.list.push(key)
      jsonfile.writeFile(masterFile, obj, err => console.error(err))
    }
  }
})
