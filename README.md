# Chrome Crawler

This service uses puppeteer to download pages.

## How to run?

Dev environment

```
yarn start
```

Variables;

```
WEB_PORT = 3000
WEB_TIMEOUT= 150 # segs
```

## API

- GET /metrics
  - 200 prometheus stats

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
