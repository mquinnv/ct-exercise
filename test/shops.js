'use strict'
const assert = require('assert')
const {sync, getEtsyListings} = require('../shops')
describe('Shops', () => {
  describe('getEtsyListings', () => {
    it('should return not found on bogus id', () => {
      assert.rejects(getEtsyListings, {status: 404})
    })
  })
  const getTestListings = (data) => async () => Promise.resolve({body:{results:data}})
  const testDb = {
    data: {},
    get: shopId => Promise.resolve(testDb.data[shopId] || []),
    put: (shopId,listings) => { testDb.data[shopId] = listings;  return Promise.resolve()}
  }
  describe('sync', () => {
    const testListing = {listing_id:1,title:'blah'}
    it('should return one change log for an add on an empty db', async () => {
      const one = await sync('1',getTestListings([testListing]), testDb)
      assert.equal(one.length, 2)
      assert.equal(one[1], `+ added listing 1 "blah"`);
    })
    it('should have the correct listing in the db', () => {
      assert.deepEqual(testDb.data[1],[testListing])
    })
    it('should return no changes on a subsequent get', async () => {
      const one = await sync('1',getTestListings([testListing]), testDb)
      assert.equal(one.length, 2)
      assert.equal(one[1], `No Changes since last sync`);
    })
    const multi = [ {listing_id:1, title:'one'},{listing_id:2,title:'two'},{listing_id:5,title:'five'}]
    const manyChanges = [ {listing_id:2,title:'two'},{listing_id:5,title:'five'},{listing_id:7,title:'seven'}]
    testDb.put(2,multi)
    it('should process adds and removals correctly', async () => {
      const changes = await sync('2',getTestListings(manyChanges), testDb)
      assert.equal(changes.length, 3)
      assert.equal(changes[1],'- removed listing 1 "one"')
      assert.equal(changes[2],'+ added listing 7 "seven"')
    })

  })
})
