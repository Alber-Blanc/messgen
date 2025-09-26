module github.com/Alber-Blanc/messgen/tests/golang

go 1.24.0

require (
	github.com/Alber-Blanc/messgen/golang_tests v0.0.0
	github.com/Alber-Blanc/messgen/port/golang v0.0.0-00010101000000-000000000000 // indirect

	github.com/kr/text v0.2.0 // indirect
	github.com/rogpeppe/go-internal v1.9.0 // indirect
	github.com/kr/pretty v0.3.1
)

// Created by cmake build
replace github.com/Alber-Blanc/messgen/golang_tests => ../../golang_tests

// To avoid checkout loops when develop in the branch
replace github.com/Alber-Blanc/messgen/port/golang => ../../port/golang/
