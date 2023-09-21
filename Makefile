define USAGE
Super awesome hand-crafted build system ⚙️

Commands:
	setup     Install Nodejs dependencies with yarn
	test      Run linters, test db migrations and tests.
	serve     Run app in dev environment.
	docker    Build docker image
	release   Build and publish docker image to registry.int.deskcrash.com
endef

export USAGE
.EXPORT_ALL_VARIABLES:
# VERSION := $(shell git describe --tags)
VERSION := $(shell cat .VERSION)
BUILD := $(shell git rev-parse --short HEAD)
PROJECTNAME=chrome_crawler
DOCKERID=docker-repo
REGISTRY=us-central1-docker.pkg.dev/algorinfo99
REGION=us-central1

help:
	@echo "$$USAGE"

local:
	docker build -t ${DOCKERID}/${PROJECTNAME} .
	docker tag ${DOCKERID}/${PROJECTNAME}  ${DOCKERID}/${PROJECTNAME}:${VERSION}

setup:
	yarn install

.PHONY: run
run:
	yarn run start

.PHONY: run-docker
run-docker:
	./scripts/run-local.sh ${VERSION}


registry:
	# curl http://registry.int.deskcrash.com/v2/_catalog | jq
	curl https://${REGISTRY}/v2/$(DOCKERID)/$(PROJECTNAME)/tags/list | jq

token:
	./src/cmd.js jwt nuxion

.PHONY: test
test:
	pytest tests/


## Standard commands for CI/CD cycle

.PHONY: build
build: 
	docker build -t ${DOCKERID}/${PROJECTNAME} .
	docker tag ${DOCKERID}/${PROJECTNAME} ${DOCKERID}/${PROJECTNAME}:${VERSION}

# gcloud builds submit --region ${REGION}  --tag ${REGISTRY}/chrome_crawler:${VERSION}
.PHONY: publish
publish:
	docker tag ${DOCKERID}/${PROJECTNAME}:$(VERSION) ${REGISTRY}/${DOCKERID}/${PROJECTNAME}:${VERSION}
	docker push ${REGISTRY}/${DOCKERID}/${PROJECTNAME}:${VERSION}


.PHONY: deploy
deploy:
	python3 scripts/deploy.py

