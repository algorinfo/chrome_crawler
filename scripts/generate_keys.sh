#!/bin/sh
# rm .secrets/*.key

openssl ecparam -name prime256v1 -genkey -out .secrets/private.key
openssl ec -in .secrets/private.key -pubout -out .secrets/public.key