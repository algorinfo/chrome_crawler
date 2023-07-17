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
HEADLESS = true 
REDIS = redis://127.0.0.1:6379 # with localhost it tries ipv6
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

> ⚠️ V3 and V4 deprecated

> ⚠️ From V4 endpoint, it uses Playwright instead of puppeteer

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


- GET /v5/image
  - Uses axios to get an image encoded as base64
  - Query Params: url

- POST /v5/chrome
  - 200 if everything ok, 500 if something went wrong
  - body
    - `url` [string]: 
    - `ts`: number (in secs)
    - `waitElement` [string | null]: Visible text of an element to wait
    - `screenshot` [bool]:  Take a screenshot of the fullpage
    - `useCookies` [bool]: It will store and load cookies, default false
    - `cookieId`: [string]: cookie id
    - `headers`: not used
    - `browser`[object]: 
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



- POST /v5/axios
  - 200 if everything ok, 500 if something went wrong
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

- POST /v5/duckduckgo
  - 200 if everything ok, 500 if something went wrong
  - body
    - `text` [string]: a query to search in google
    - `ts` [number]: timeout (in secs)
    - `moreResults` [number]: How many click on "More results" button it will do
    - `region` [string]: "ar-es" by default. See [regions codes](#regions-codes)
    - `timeFilter` [string|null]: "Any Time", "Past day", "Past week", "Past month", "Past year". Null by default
    - `screenshot` [bool]:  Take a screenshot of full rendered page
    - `useCookies` [bool]: It will store and load cookies
    - `cookieId`: [string]: cookie id
    - `browser` [object]: same than chrome endpoint
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

- POST /v5/google
  - 200 if everything ok, 500 if something went wrong
  - body
    - `text` [string]: a query to search in google
    - `ts` [number]: timeout (in secs)
    - `moreResults` [number]: It will performs a "PgDown" actions for `moreResults` times.  
    - `region` [string]: "ar-es" by default. See [regions codes](#regions-codes)
    - `timeFilter` [string|null]: "Any Time", "Past hour", "Past 24 hours", "Past week", "Past month", "Past year". Null by default
    - `screenshot` [bool]:  Take and screenshot
    - `useCookies` [bool]: default True
    - `cookieId`: [string]: cookie id
    - `browser` [object]: same than chrome endpoint
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

## Resources

- [Catch timeout error](https://github.com/puppeteer/puppeteer/issues/2574)
- [Catch error](https://stackoverflow.com/questions/52716109/puppeteer-page-waitfornavigation-timeout-error-handling)
- [BrowserContext](https://pptr.dev/#?product=Puppeteer&version=v8.0.0&show=api-event-targetdestroyed-1)
- [Using Puppeteer for scrap](https://medium.com/@e_mad_ehsan/getting-started-with-puppeteer-and-chrome-headless-for-web-scrapping-6bf5979dee3e)
- [Docker image for puppeteer](https://github.com/browserless/chrome)
```
