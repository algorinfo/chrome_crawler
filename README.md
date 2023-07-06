# Chrome Crawler

This service uses puppeteer(to be deprecated), playwright and axios to crawl pages.

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
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser
```

If `JWT_ALG` is "ES512", then `JWT_SECRET` must contain the absolute or relative path to the public key:

```
JWT_ALG = "ES512"
JWT_SECRET = ".secrets/public.key"
```

`PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` is set by default and is related to where Alpine install the chromiun browser. 
This variable doesn't belong to playwright, and it is used becose playwright uses their own browser binaries, which are not compatible for alpine. 

> ⚠️ In the future a Dockerfile.debian version could be provided. It requires a change in how the dockerfile is structured.

## API

> ⚠️ New V4 endpoint, it uses Playwright instead of puppeteer

> ⚠️ V3 will be deprecated soon 

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

- POST /v4/chrome
  - 200 if everything ok
  - body
    - `url` [string]: 
    - `ts`: number (in secs)
    - `waitElement` [string | null]: Visible text of an element to wait
    - `screenshot` [bool]:  Take a screenshot of the fullpage
    - `autoscroll`: bool (not used)
    - `headers`: not used
    - `proxy` [object]: Configure a proxy to be used
      - `server` [string]: required, without protocol
      - `username` [string]: optional
      - `password` [string]: optional
    - `emulation` [object]: 
      - `locale` [string]: default "en-US"
      - `timezoneId`[string]: default "America/New_York"
      - `isMobile` [bool]: default False
      - `viewport` [object]: 
        - `width` [number]: default 1280
        - `height` [number]: default 720
      - `geoEnabled` [bool]: default True, add geolocation to permissions
      - `geolocation` [object]: (default New York)
        - `longitude` [number]: default 40.6976312 
        - `latitude` [number]: default -74.1444858
  - response:
    - `content` [string]: Raw html of the response
    - `headers` [object]: not used
    - `status` [number]: status code, 200 or 500
    - `fullLoaded` [bool]: if the page was loaded completly
    - `screenshot` [string]: Base64 encoded image

- POST /v4/axios
  - 200 if everything ok
  - body
    - `url` [string]: 
    - `ts`[number]: timeout (in secs)
    - `waitElement` [string | null]: Not used
    - `screenshot` [bool]:  Not used
    - `autoscroll`: bool (not used)
    - `headers`: any, to be used with axios
    - `proxy` [object]: **Not implemented right now**
      - `server` [string]: required
      - `username` [string]: optional
      - `password` [string]: optional

- POST /v4/google-search
  - 200 if everything ok
  - body
    - `text` [string]: a query to search in google
    - `url` [string]: optional, the google's url to use. default: https://www.google.com
    - `nextPage` [string|null]: Used to iterate over the google results
    - `ts` [number]: timeout (in secs)
    - `waitElement` [string | null]: Not used
    - `screenshot` [bool]:  Take and screenshot
    - `autoscroll`: bool (not used)
    - `headers` [any]: not used 
    - `proxy` [object]: 
      - `server` [string]: required
      - `username` [string]: optional
      - `password` [string]: optional
  - response:
    - `query` [string]: Parsed query 
    - `content` [string]: Raw html of the response
    - `status` [number]: status code, 200 or 500
    - `next` [string]: uri of the next page
    - `links` [List[{href:text}]]: uri of the next page
    - `screenshot` [string]: Base64 encoded image


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
