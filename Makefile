define USAGE
Super awesome hand-crafted build system ⚙️

Commands:
	setup     Install Nodejs dependencies with yarn
	test      Run linters, test db migrations and tests.
	serve     Run app in dev environment.
	release   Build and publish docker image to registry.int.deskcrash.com
endef

export USAGE
.EXPORT_ALL_VARIABLES:
VERSION := $(shell git describe --tags)
BUILD := $(shell git rev-parse --short HEAD)
PROJECTNAME := $(shell basename "$(PWD)")

help:
	@echo "$$USAGE"

local:
	docker build -t nuxion/indexer .
	docker tag nuxion/indexer nuxion/indexer:$(VERSION)

setup:
	yarn install

serve:
	yarn start

run:
	docker run --rm -p 127.0.0.1:8000:8000 --env-file=.env nuxion/indexer

docker:
	docker build -t nuxion/${PROJECTNAME} .

release: docker
	docker tag nuxion/${PROJECTNAME} registry.int.deskcrash.com/nuxion/${PROJECTNAME}:$(VERSION)
	# docker push registry.int.deskcrash.com/nuxion/$(PROJECTNAME)
	docker push registry.int.deskcrash.com/nuxion/$(PROJECTNAME):$(VERSION)

registry:
	# curl http://registry.int.deskcrash.com/v2/_catalog | jq
	curl http://registry.int.deskcrash.com/v2/nuxion/$(PROJECTNAME)/tags/list | jq
