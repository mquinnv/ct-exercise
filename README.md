# ct-exercise

To run the program, clone the repo, npm install, and then create in var/key.json a file containing your etsy api key such as:

```
{
  "api_key": "your_key"
}
```

Then to run against etsy and the local data store,

`npm run sync shop1 [shop2] ... [shopN]`

to empty the local data store,
`npm run clean`

or to run the test suite:
`npm run test`

