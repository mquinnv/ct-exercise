#!/usr/bin/env node
'use strict'
const shops = process.argv.splice(2),
  {sync} = require('./shops'),
  main = async () => {
    if (!shops.length) {
      console.log('Please specify some shop ids')
    } else {
      const changes = await Promise.all(
        shops.map(shop => sync(shop))
      )
      changes.forEach(c=>console.log(c.join('\n')))
    }
  }
main()
