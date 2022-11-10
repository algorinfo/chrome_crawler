#!/bin/bash
kubectl create secret generic chrome --from-file=public=.secrets/public.key --from-file=private=.secrets/private.key
kubectl apply -f scripts/manifest.yaml
