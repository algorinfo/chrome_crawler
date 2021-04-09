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


## Endpoints

- **/v1/chrome?url=....**
- **/v1/schemas**
- **/metrics**

Example:

```
curl http://localhost:3000/v1/chrome?url=https://www.google.com/doodles/

```

**url must have the protocol**

## Resources

- [Catch timeout error](https://github.com/puppeteer/puppeteer/issues/2574)
- [Catch error](https://stackoverflow.com/questions/52716109/puppeteer-page-waitfornavigation-timeout-error-handling)
- [BrowserContext](https://pptr.dev/#?product=Puppeteer&version=v8.0.0&show=api-event-targetdestroyed-1)
- [Using Puppeteer for scrap](https://medium.com/@e_mad_ehsan/getting-started-with-puppeteer-and-chrome-headless-for-web-scrapping-6bf5979dee3e)
- [Docker image for puppeteer](https://github.com/browserless/chrome)
```
