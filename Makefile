ROOT_DIR ?= $(realpath $(PWD))
BUILD_DIR ?= $(ROOT_DIR)/build
BUILD_TYPE ?= Debug
CXX_STANDARD ?= 20

BIN_DIR ?= bin

GOLANG_DIRECTORIES := ./build-golang-test/... ./port/golang/... ./tests/golang/...
GOLANGCI_LINT := $(BIN_DIR)/golangci-lint
GOLANGCI_LINT_VERSION := v2.5.0

all: check

configure:
	cmake -B${BUILD_DIR} -S. -G Ninja -DCMAKE_EXPORT_COMPILE_COMMANDS=1 -DCMAKE_BUILD_TYPE=${BUILD_TYPE} -DCMAKE_CXX_STANDARD=${CXX_STANDARD}

build: configure
	cmake --build ${BUILD_DIR}

test: build
	ctest --test-dir ${BUILD_DIR}/tests/ --output-on-failure
	python3 -m pytest .

check: test
	python3 -m mypy .

generate-golang:
	python3 messgen-generate.py --types tests/data/types --protocol tests/data/protocols:test_proto --protocol tests/data/protocols:nested/another_proto --options mod_name=github.com/Alber-Blanc/messgen/build-golang-test --outdir build-golang-test/msgs --lang golang

test-golang: generate-golang
	go test -v $(GOLANG_DIRECTORIES)

check-golang: $(GOLANGCI_LINT)
	$(GOLANGCI_LINT) run --config golangci.yaml $(GOLANG_DIRECTORIES)

$(GOLANGCI_LINT):
	mkdir -p bin
	curl -sSfL https://raw.githubusercontent.com/golangci/golangci-lint/HEAD/install.sh | sh -s -- -b $(BIN_DIR) $(GOLANGCI_LINT_VERSION)

clean:
	rm -rf ${BUILD_DIR} $(BIN_DIR) build-golang-test/msgs
