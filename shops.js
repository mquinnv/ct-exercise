#!/usr/bin/env node
'use strict'
const request = require('superagent'),
  key = require('./var/key.json'),
  fs = require('fs')

const format = l => `${l.listing_id} "${l.title}"`

/* etsy api abstracted out in order to write tests that don't need the etsy api */
const getEtsyListings = async shopId =>
  request
    .get(`https://openapi.etsy.com/v2/shops/${shopId}/listings/active`)
    .query(key)


/* local db abstracted out in order to more easily write tests */
const fileName = (shopId) => `./data/${shopId}.json`
const fsDb = {
  get: shopId => new Promise((res,rej) =>  {
    fs.readFile(fileName(shopId), (e, data) => {
      if(e){
        res([])
      } else {
        res(JSON.parse(data))
      }})}),
  put: (shopId,data) => new Promise((res,rej) => { 
      fs.writeFile(fileName(shopId), JSON.stringify(data), 'utf8', e => {
        if(e) {
          rej(e)
        } else {
          res()
        }
      })})
}

const sync = async (shopId, getCurrentListings = getEtsyListings, db = fsDb) => {
    try {
      const etsyRes = await getCurrentListings(shopId),
        currentListings = etsyRes.body.results

      const lastSync = await db.get(shopId)
      const changes = [];
      currentListings.forEach(listing => {
        while (lastSync[0] && lastSync[0].listing_id < listing.listing_id) {
          changes.push( `- removed listing ${format(lastSync[0])}`)
          lastSync.shift()
        }
        if (lastSync[0] && lastSync[0].listing_id === listing.listing_id) {
          lastSync.shift()
        } else {
          changes.push(`+ added listing ${format(listing)}`)
        }
      })
      if (changes.length === 0) {
        changes.push('No Changes since last sync')
      }
      await db.put(shopId, currentListings);
      return [`Shop ID ${shopId}`, ...changes]
    } catch (e) {
      switch (e.status) {
        case 404:
          return [`Shop ID ${shopId} not found, Etsy says: ${e.response.text}`]
        default:
          if(e.response && e.response.text) {
            return [`Shop ID ${shopId} error: ${e.status}, Etsy says: ${ e.response.text }`]
          }
          console.error(e)
          return [`Error ${e}`]
      }
    }
  }
module.exports = {sync: sync, getEtsyListings: getEtsyListings}
