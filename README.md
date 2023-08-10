# Chrome Crawler

This service uses puppeteer(to be deprecated), playwright and axios to crawl pages.

It allows to scroll, take screenshots and get images encoded as Base64.

**Out of scope**: it allows to get apps from playstore, in the future it will be migrated to a new service. 

## How to run?

Dev environment

```
yarn start
```
or 
```
make run
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
HEADLESS = true 
REDIS = redis://127.0.0.1:6379 # with localhost it tries ipv6, redis is disabled
```
If `JWT_ALG` is "ES512", then `JWT_SECRET` must contain the absolute or relative path to the public key:

```
JWT_ALG = "ES512"
JWT_SECRET = ".secrets/public.key"
```

`PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` is set by default and is related to where Alpine install the chromiun browser. 
This variable doesn't belong to playwright, and it is used becose playwright uses their own browser binaries, which are not compatible for alpine. 

> ⚠️ In the future a Dockerfile.debian version could be provided. It requires a change in how the dockerfile is structured.

## Versioning

The project follows a [calendar version release](https://calver.org/)  as `YY.MM.DD_PATCH[-MODIFIER]`, where:

  - YY short year: 23, 24..
  - MM short month: 01, 02...
  - DD Short day: 01, 02, 03
  - PATCH: bug fix or changes 1, 2, 3
  - MODIFIER: lts, rc0, rc2...

As example, the version `23.08.10_2` means from the year 2023 of month August from day 10th, patch 0. 
MODIFIER field is optional. 

## API

### Entities

#### BrowserConfType

```
const browserConfType = 
  {
    headless: Joi.boolean().default(headless),
    emulation: Joi.object().keys(emulationType).default(emulationDefault),
    proxy: Joi.object().keys(proxyType).allow(null).default(null),
  }
```
**EmulationType**
```
const emulationType =
  {
    locale: Joi.string().default("en-US"),
    timezoneId: Joi.string().default("America/New_York"),
    isMobile: Joi.boolean().default(false),
    viewport: Joi.object().keys(viewPortType),
    geoEnabled: Joi.boolean().default(false),
    geolocation: Joi.object().keys(geoType).optional().allow(null),
  }
```
emulationDefault:
```
const emulationDefault = {
  locale: "en-US",
  timezoneId: "America/New_York",
  isMobile: false,
  viewport: { width: 1280, height: 720},
  geoEnabled: false,
  geolocation: {
    longitude: 40.6976312,
    latitude: -74.1444858
  }
}
```

**ProxyType**
```
const proxyType =
  {
    server: Joi.string().required(),
    username: Joi.string(),
    password: Joi.string()
  }

```

#### CrawlPageType
```
const crawlPageType = Joi.object(
  {
    // Valid formed url to open
    url: Joi.string().required(),
    // Timeout in secs
    ts: Joi.number().default(defaultTs),
    //  Visible text of an element to wait
    waitElement: Joi.string().optional().allow(null),
    // Take a screenshot of the fullpage
    screenshot: Joi.bool().default(false),
    // Save cookies for the domain of the url
    useCookies: Joi.bool().default(false),
    // If ture, the browser will have a fresh start
    cleanCookies: Joi.bool().default(false),
    // Derecated
    cookieId:  Joi.string().allow(null).default(null),
    // Headers used only for axios
    headers: Joi.any().allow(null),
    // Browser configuration see BrowserConfType
    browser: Joi.object().keys(browserConfType).optional().allow(null).default(defaultBrowserConf),
  }
)
```
### General endpoints

- GET /
  - 200 Root status

- GET /metrics
  - 200 prometheus stats


### Axios enpoints

- GET /v11/image
  - Uses axios to get an image encoded as base64
  - Query Params: url

- POST /v11/axios
  - 200 if everything ok, 500 if something went wrong
  - body: `CrawlPageType`
  - notes: ProxyType not used in axios

### Chrome Endpoint
- POST /v11/chrome
  - 200 if everything ok, 500 if something went wrong
  - body: `CrawlPageType`
  - response 200:
    - `fullurl` [string]: Raw html of the response
    - `content` [string]: Raw html of the response
    - `headers` [object]: not used
    - `status` [number]: status code, 200 or 500
    - `fullLoaded` [bool]: if the page was loaded completly
    - `screenshot` [string]: Base64 encoded image
    - `error` [string]: any message error
    - `cookieId` [string]: generated
  - response 500:
    - `error` [string]: message error

### Duckduckgo Endpoint

**CrawlDuckGoType**
```
const crawlDuckGoType = Joi.object(
  {
    // a query to search in duckduckgo.com
    text: Joi.string().required(),
    // timeout in secs
    ts: Joi.number().default(defaultTs),
    // How many clicks on "More Results"
    moreResults: Joi.number().default(1),
    // "ar-es" by default. 
    region: Joi.string().default("ar-es"),
    // "Any Time", "Past day", "Past week", "Past month", "Past year". Null by default
    timeFilter: Joi.string().default(null).allow(null),
    // Take a screenshot of full rendered page
    screenshot: Joi.bool().default(false),
    // It will store and load cookies
    useCookies: Joi.bool().default(true),
    // Deprecated
    cookieId:  Joi.string().allow(null).default(null),
    browser: Joi.object().keys(browserConfType).optional().allow(null).default(defaultBrowserConf),
  }
)
```
For regios codes, check see [regions codes](#regions-codes)

- POST /v5/duckduckgo
  - 200 if everything ok, 500 if something went wrong
  - body `crawlDuckGoType`
  - response 200:
    - `query` [string]: Parsed query 
    - `fullurl` [string]: Fullurl
    - `content` [string]: Raw html of the response
    - `headers` [object]: Empty
    - `status` [number]: status code, 200 or 500
    - `links` [List[{href:text}]]: uri of the next page
    - `fullLoaded` [bool]: if the page was loaded completly
    - `screenshot` [string]: Base64 encoded image
    - `error` [string]: any message error
    - `cookieId` [string]: generated
  - response 500:
    - `error` [string]: message error


### Google Endpoint

**crawlGoogleType**
```
const crawlGoogleType = Joi.object(
  {
    // a query to search in google.com
    text: Joi.string().required(),
    // timeout in secs
    ts: Joi.number().default(defaultTs),
    // It will performs a "PgDown" actions for `moreResults` times. 
    moreResults: Joi.number().default(1),
    // region: Joi.string().default("countryAR"),
    region: Joi.string().default("Argentina"),
    // "Any Time", "Past hour", "Past 24 hours", "Past week", "Past month", "Past year". Null by default
    timeFilter: Joi.string().default(null).allow(null),
    // Take and screenshot
    screenshot: Joi.bool().default(false),
    // use cookies
    useCookies: Joi.bool().default(true),
    // deprecated
    cookieId:  Joi.string().allow(null).default(null),
    browser: Joi.object().keys(browserConfType).optional().allow(null).default(defaultBrowserConf),
  }
)
```

- POST /v11/google
  - 200 if everything ok, 500 if something went wrong
  - body `crawlGoogleType`
  - response 200:
    - `query` [string]: Parsed query 
    - `fullurl` [string]: Fullurl
    - `content` [string]: Raw html of the response
    - `headers` [object]: Empty
    - `status` [number]: status code, 200 or 500
    - `links` [List[{href:text}]]: uri of the next page
    - `fullLoaded` [bool]: if the page was loaded completly
    - `screenshot` [string]: Base64 encoded image
    - `error` [string]: any message error
    - `cookieId` [string]: generated
  - response 500:
    - `error` [string]: message error


### Playstore endpoints

> ⚠️ Playstore API could be very inestable, for more information refer to
> https://github.com/facundoolano/google-play-scraper

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



## Regions codes

**duckduckgo**

Check https://duckduckgo.com/settings

Copy the value of the option:

- For "All regions" the value is `wt-wt`
- For "Argentina" the value is `ar-es`

**google**:
Check https://www.google.com/preferences
Copy as the text shown in Region settings part:
- For "Brazil", the value is `Brazil`
- For "Agentina", the value is `Argentina`

## Changelog

**2023-08-10** 
- Restarting changelog from now. 
- Main endpoints (chrome, axios, image, google and duckduck) will follow simple version schema: Breaking changes in the response or the payload for req/resp will imply a new version in the enpoint. 

- [calendar version release](https://calver.org/)  adopted for the project. More detail in [versioning](#versioning), but the new format is: `YY.MM.DD_PATCH[-MODIFIER]`.  As example, this version will be: `23.08.10_0`  

- Cookies are now per instance, stored locally. In version 5, cookies were shared cross instances using redis. Because instances could be hosted in different server with different IPs this practices is not recommended. Instead, each instance store locally the cookies, which is aligned with how actually a browser works.

- Duckduckgo parsing of links disabled by now.y
- Google try first to get the search button using "Search" if it fails, it will try "Buscar"
- A `HEADLESS` env added. If `false` it will open the browser. Useful for debugging.

**Before**

> ⚠️ From V4 endpoint, it uses Playwright instead of puppeteer

## Resources

- [Catch timeout error](https://github.com/puppeteer/puppeteer/issues/2574)
- [Catch error](https://stackoverflow.com/questions/52716109/puppeteer-page-waitfornavigation-timeout-error-handling)
- [BrowserContext](https://pptr.dev/#?product=Puppeteer&version=v8.0.0&show=api-event-targetdestroyed-1)
- [Using Puppeteer for scrap](https://medium.com/@e_mad_ehsan/getting-started-with-puppeteer-and-chrome-headless-for-web-scrapping-6bf5979dee3e)
- [Docker image for puppeteer](https://github.com/browserless/chrome)
```
