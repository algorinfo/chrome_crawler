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
VERSION := $(shell git describe --tags)
BUILD := $(shell git rev-parse --short HEAD)
PROJECTNAME := $(shell basename "$(PWD)")
DOCKERID = $(shell echo "algorinfo")
REGISTRY := registry.nyc1.algorinfo

help:
	@echo "$$USAGE"

local:
	docker build -t ${DOCKERID}/${PROJECTNAME} .
	docker tag ${DOCKERID}/${PROJECTNAME}  ${DOCKERID}/${PROJECTNAME}:${VERSION}

setup:
	yarn install

serve:
	yarn start

run:
	docker run --rm -p 127.0.0.1:8000:8000 --env-file=.env ${DOCKERID}/${PROJECTNAME}

.PHONY: docker
docker:
	docker build -t ${DOCKERID}/${PROJECTNAME} .

.PHONY: release
release:
	docker tag ${DOCKERID}/${PROJECTNAME} ${REGISTRY}/${DOCKERID}/${PROJECTNAME}:$(VERSION)
	docker push ${REGISTRY}/${DOCKERID}/${PROJECTNAME}:$(VERSION)

.PHONY: build
build:
	python3 scripts/build.py

.PHONY: deploy
deploy:
	python3 scripts/deploy.py

registry:
	# curl http://registry.int.deskcrash.com/v2/_catalog | jq
	curl http://registry.nyc1.algorinfo/v2/$(DOCKERID)/$(PROJECTNAME)/tags/list | jq
