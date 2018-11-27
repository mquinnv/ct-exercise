#!/usr/bin/env node
const request = require('superagent'),
  key = require('./var/key.json'),
  fs = require('fs')

const format = l => `${l.listing_id} "${l.title}"`

const getEtsyListings = async shopId =>
  request
    .get(`https://openapi.etsy.com/v2/shops/${shopId}/listings/active`)
    .query(key)

const sync = async (shopId, getListings) => {
  try {
    const etsyRes = await getListings(shopId),
      currentListings = etsyRes.body.results,
      fileName = `./data/${shopId}.json`

    let lastSync = []
    try {
      lastSync = require(fileName)
    } catch (e) {
      // new shop, safe to ignore
    }
    let changes = ''
    currentListings.forEach(listing => {
      while (lastSync[0] && lastSync[0].listing_id < listing.listing_id) {
        changes += `\n- removed listing ${format(lastSync[0])}`
        lastSync.shift()
      }
      if (lastSync[0] && lastSync[0].listing_id === listing.listing_id) {
        lastSync.shift()
      } else {
        changes += `\n+ added listing ${format(listing)}`
      }
    })
    if (changes === '') {
      changes = '\nNo Changes since last sync'
    }
    fs.writeFile(fileName, JSON.stringify(currentListings), 'utf8', e => {
      if (e) {
        console.error(e)
      }
    })
    return `Shop ID ${shopId}${changes}`
  } catch (e) {
    switch (e.status) {
      case 404:
        return `Shop ID ${shopId} not found, Etsy says: ${e.response.text}`
      default:
        return `Shop ID ${shopId} error: ${e.status}, Etsy says: ${
          e.response.text
        }`
    }
  }
}
const shops = process.argv.splice(2)
const main = async () => {
  if (!shops.length) {
    console.log('Please specify some shop ids')
  } else {
    const log = await Promise.all(
      shops.map(shop => sync(shop, getEtsyListings))
    )
    console.log(log.join('\n'))
  }
}
main()
