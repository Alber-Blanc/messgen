include(GoogleTest)
find_package(GTest REQUIRED)

set(MESSGEN_TYPE_DIR "${CMAKE_CURRENT_LIST_DIR}/data/types")
set(MESSGEN_PROTO_DIR "${CMAKE_CURRENT_LIST_DIR}/data/protocols")

if(CMAKE_CXX_STANDARD GREATER_EQUAL 20)
    add_executable(test_cpp20 "cpp/Cpp17Test.cpp" "cpp/Cpp20Test.cpp")
    messgen_add_types_library(msgs_test_types_cpp20 "${MESSGEN_TYPE_DIR}" "stl" "cpp_standard=20")
    messgen_add_proto_library(msgs_test_proto_cpp20 "${MESSGEN_PROTO_DIR}" "test_proto" msgs_test_types_cpp20 "stl")
    messgen_add_proto_library(msgs_another_proto_cpp20 "${MESSGEN_PROTO_DIR}" "nested/another_proto" msgs_test_types_cpp20 "stl")
    target_link_libraries(test_cpp20 msgs_test_proto_cpp20 msgs_another_proto_cpp20 GTest::gtest_main)
    gtest_discover_tests(test_cpp20)

    add_executable(test_cpp20_nostl "cpp/Cpp17NostlTest.cpp" "cpp/Cpp20NostlTest.cpp")
    messgen_add_types_library(msgs_test_types_cpp20_nostl "${MESSGEN_TYPE_DIR}" "nostl" "cpp_standard=20")
    messgen_add_proto_library(msgs_test_proto_cpp20_nostl "${MESSGEN_PROTO_DIR}" "test_proto" msgs_test_types_cpp20_nostl "nostl")
    target_link_libraries(test_cpp20_nostl msgs_test_proto_cpp20_nostl GTest::gtest_main)
    gtest_discover_tests(test_cpp20_nostl)

    # Only GCC supports has the support for ISO/IEC TR 24733
    if (CMAKE_CXX_COMPILER_ID STREQUAL "GNU")
        messgen_add_types_library(msgs_test_types_cpp20_decimal "${CMAKE_CURRENT_LIST_DIR}/data/types_decimal" "stl" "cpp_standard=20")
        add_executable(test_cpp20_decimal "cpp/Cpp20DecimalTest.cpp")
        target_include_directories(test_cpp20_decimal PRIVATE ${CMAKE_SOURCE_DIR}/port/cpp_common)
        target_link_libraries(test_cpp20_decimal msgs_test_types_cpp20_decimal GTest::gtest_main)
        gtest_discover_tests(test_cpp20_decimal)
    endif()
endif ()

if (CMAKE_CXX_STANDARD GREATER_EQUAL 17)
    # Make executables form the same source files but without "cpp_standard=20" option (messgen may work differently)
    add_executable(test_cpp17 "cpp/Cpp17Test.cpp")
    messgen_add_types_library(msgs_test_types_cpp17 "${MESSGEN_TYPE_DIR}" "stl" "cpp_standard=17")
    messgen_add_proto_library(msgs_test_proto_cpp17 "${MESSGEN_PROTO_DIR}" "test_proto" msgs_test_types_cpp17 "stl" "cpp_standard=17")
    messgen_add_proto_library(msgs_another_proto_cpp17 "${MESSGEN_PROTO_DIR}" "nested/another_proto" msgs_test_types_cpp17 "stl" "cpp_standard=17")
    target_link_libraries(test_cpp17 msgs_test_proto_cpp17 msgs_another_proto_cpp17 GTest::gtest_main)
    gtest_discover_tests(test_cpp17)

    add_executable(test_cpp17_nostl "cpp/Cpp17NostlTest.cpp")
    messgen_add_types_library(msgs_test_types_cpp17_nostl "${MESSGEN_TYPE_DIR}" "nostl" "cpp_standard=17")
    messgen_add_proto_library(msgs_test_proto_cpp17_nostl "${MESSGEN_PROTO_DIR}" "test_proto" msgs_test_types_cpp17_nostl "nostl" "cpp_standard=17")
    target_link_libraries(test_cpp17_nostl msgs_test_proto_cpp17_nostl GTest::gtest_main)
    gtest_discover_tests(test_cpp17_nostl)

else()
    message(WARNING "C++ standard is less than 17, skipping C++ tests")

endif()


# golang tests
# TODO(andrphi): There are a few ugly caveats need to be fixed:
# - 1: i've failed to put generated code into a separate directory. Go modules work fine if `go get` fetches module,
#      however i'd like to use generated one and it fails badly.
# - 2: map keys order is not well defined. So absolutely valid serialization could result in a binary that doesnt
#      match with what has been generated from python.
# - 3: cmake tests below looks ugly but that is the best way i've found to do build dependencies
add_test(
    NAME generate_golang_test
    COMMAND "python3"
            "${CMAKE_SOURCE_DIR}/messgen-generate.py"
            "--types" "${CMAKE_CURRENT_SOURCE_DIR}/data/types"
            "--protocol" "${CMAKE_CURRENT_SOURCE_DIR}/data/protocols:test_proto"
            "--protocol" "${CMAKE_CURRENT_SOURCE_DIR}/data/protocols:nested/another_proto"
            "--options" "mod_name=github.com/Alber-Blanc/messgen/build-golang-test"
            "--outdir" "${CMAKE_SOURCE_DIR}/build-golang-test/msgs"
            "--lang" "golang"
)
add_test(
  NAME test_golang
  WORKING_DIRECTORY "${CMAKE_CURRENT_SOURCE_DIR}/golang"
  COMMAND "go" "test" "-v"
)
set_tests_properties(test_golang PROPERTIES DEPENDS "generate_golang_test")

