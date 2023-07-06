#!/bin/bash
VERSION=$1
docker run --rm -p 127.0.0.1:3000:3000 -v ${PWD}/.secrets:/secrets -e JWT_SECRET=/secrets/public.key  nuxion/chrome_crawler:${VERSION} 
# docker run --rm nuxion/chrome_crawler:${VERSION} 
