# Chrome Crawler

This service uses puppeteer and axios to crawl pages.

It allows to scroll, take screenshots and get images encoded as Base64.

**Out of scope**: it allows to get apps from playstore, in the future it will be migrated to a new service. 

## How to run?

Dev environment

```
yarn start
```
### Docker

A `Dockerfile` is provided which install chrome inside the container. 

### Environment variables

```
WEB_PORT = 3000
WEB_TIMEOUT = 150 # segs
JWT_SECRET = my-secret-hash
JWT_ALG = HS256
```

If `JWT_ALG` is "ES512", then `JWT_SECRET` must contain the absolute or relative path to the public key:

```
JWT_ALG = "ES512"
JWT_SECRET = ".secrets/public.key"
```
## API

> ⚠️ V1 and v2 of chrome&axios apis are disabled in the code

> ⚠️ Playstore API could be very inestable, for more information refer to
> https://github.com/facundoolano/google-play-scraper

### General endpoints

- GET /
  - 200 Root status

- GET /metrics
  - 200 prometheus stats

### Chrome and axios endpoints

- GET /v1/chrome
  - Uses chrome to render the site
  - Query Params: url
  
- GET /v2/chrome
  - Uses chrome to render the site
  - Query Params: url, screen
  
- POST /v2/chrome
  - Uses chrome to render the site
  - body params: url, ts, scroll, screenshot
 
- GET /v2/axios
  - Uses axios to craw a site
  - Query Params: url
  
- GET /v2/image
  - Uses axios to get an image encoded as base64
  - Query Params: url
 
- POST /v3/axios
  - 200 if everything ok
  - body
    - url: string
    - ts: number (in secs)
    - screenshot: bool
    - autoscroll: bool
    - userAgent: string
  
- POST /v3/chrome
  - 200 if everything ok
  - body
    - url: string
    - ts: number (in secs)
    - screenshot: bool
    - autoscroll: bool
    - userAgent: string

- GET /v3/image
  - Uses axios to get an image encoded as base64
  - Query Params: url

- POST /v4/axios
  - 200 if everything ok
  - body
    - url: string
    - ts: number (in secs)
    - screenshot: bool
    - autoscroll: bool
    - headers: any (A map which will used as headers for axios)
 

### Playstore endpoints

- GET /v1/playstore/:appid 
  - Get app detail based on the appid

- POST /v1/playstore/list
  - Get a list of apps
  - body
    - collection: Available options can bee found [here](https://github.com/facundoolano/google-play-scraper/blob/dev/lib/constants.js#L58)
    - category: Available options can bee found [here](https://github.com/facundoolano/google-play-scraper/blob/dev/lib/constants.js#L3).
    - num:  (optional, defaults to 500): the amount of apps to retrieve.
    - country:  (optional, defaults to 'us'): the two letter country code used to retrieve the applications.
  
- POST /v1/playstore/search
  - Perform a search in google playstore
  - body
    * `term`: the term to search by.
    * `num` (optional, defaults to 20, max is 250): the amount of apps to retrieve.
    * `lang` (optional, defaults to `'en'`): the two letter language code used to retrieve the applications.
    * `country` (optional, defaults to `'us'`): the two letter country code used to retrieve the applications.
    * `fullDetail` (optional, defaults to `false`): if `true`, an extra request will be made for every resulting app to fetch its full detail.
    * `price` (optional, defaults to `all`): allows to control if the results apps are free, paid or both.
        * `all`: Free and paid
        * `free`: Free apps only
        * `paid`: Paid apps only

- POST /v1/playstore/similar
  - Returns a list of similar apps to the one specified
  - body:
    * `appId`: the Google Play id of the application to get similar apps for.
    * `lang` (optional, defaults to `'en'`): the two letter language code used to retrieve the applications.
    * `country` (optional, defaults to `'us'`): the two letter country code used to retrieve the applications.
    * `fullDetail` (optional, defaults to `false`): if `true`, an extra request will be made for every resulting app to fetch its full detail.

  
Example:

```
curl http://localhost:3000/v1/chrome?url=https://www.google.com/doodles/

```

**url must have the protocol**
**screen is a optional param, any value  is taked as true**


## Changelog
- **screen** param added for chrome's endpoint in the version 2 of the api. If is true, then an screenshot will be taken and encoded in base64. After that, could be decoded as a png file, throught the key `screenshot`. 
- **/image** endpoint added to download images as base64.
- **image.py** a script to test image endpoint.

## Resources

- [Catch timeout error](https://github.com/puppeteer/puppeteer/issues/2574)
- [Catch error](https://stackoverflow.com/questions/52716109/puppeteer-page-waitfornavigation-timeout-error-handling)
- [BrowserContext](https://pptr.dev/#?product=Puppeteer&version=v8.0.0&show=api-event-targetdestroyed-1)
- [Using Puppeteer for scrap](https://medium.com/@e_mad_ehsan/getting-started-with-puppeteer-and-chrome-headless-for-web-scrapping-6bf5979dee3e)
- [Docker image for puppeteer](https://github.com/browserless/chrome)
```
