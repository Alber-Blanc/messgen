include(GoogleTest)
find_package(GTest REQUIRED)

enable_testing()

set(MESSGEN_TYPE_DIR "${CMAKE_CURRENT_LIST_DIR}/data/types")
set(MESSGEN_PROTO_DIR "${CMAKE_CURRENT_LIST_DIR}/data/protocols")

add_executable(test_cpp "cpp/CppTest.cpp")
messgen_add_types_library(msgs_test_types "${MESSGEN_TYPE_DIR}" "stl" "cpp_standard=20")
messgen_add_proto_library(msgs_test_proto "${MESSGEN_PROTO_DIR}" "test_proto" msgs_test_types)
messgen_add_proto_library(msgs_another_proto "${MESSGEN_PROTO_DIR}" "nested/another_proto" msgs_test_types)
target_link_libraries(test_cpp msgs_test_proto msgs_another_proto GTest::gtest_main)
gtest_discover_tests(test_cpp)

add_executable(test_cpp_nostl "cpp/CppNostlTest.cpp")
messgen_add_types_library(msgs_test_types_nostl "${MESSGEN_TYPE_DIR}" "nostl" "cpp_standard=20")
messgen_add_proto_library(msgs_test_proto_nostl "${MESSGEN_PROTO_DIR}" "test_proto" msgs_test_types_nostl)
target_link_libraries(test_cpp_nostl msgs_test_proto_nostl GTest::gtest_main)
gtest_discover_tests(test_cpp_nostl)

# Only GCC supports has the support for ISO/IEC TR 24733
if (CMAKE_CXX_COMPILER_ID STREQUAL "GNU")
    messgen_add_types_library(msgs_test_types_decimal "${CMAKE_CURRENT_LIST_DIR}/data/types_decimal" "stl" "cpp_standard=20")
    add_executable(test_cpp_decimal "cpp/CppDecimalTest.cpp")
    target_include_directories(test_cpp_decimal PRIVATE ${CMAKE_SOURCE_DIR}/port/cpp_common)
    target_link_libraries(test_cpp_decimal msgs_test_types_decimal GTest::gtest_main)
    gtest_discover_tests(test_cpp_decimal)
endif()

# Make executables form the same source files but without "cpp_standard=20" option (messgen may work differently)
add_executable(test_cpp_17 "cpp/CppTest.cpp")
messgen_add_types_library(msgs_test_types_cpp17 "${MESSGEN_TYPE_DIR}" "stl")
messgen_add_proto_library(msgs_test_proto_cpp17 "${MESSGEN_PROTO_DIR}" "test_proto" msgs_test_types_cpp17)
messgen_add_proto_library(msgs_another_proto_cpp17 "${MESSGEN_PROTO_DIR}" "nested/another_proto" msgs_test_types_cpp17)
target_link_libraries(test_cpp_17 msgs_test_proto_cpp17 msgs_another_proto_cpp17 GTest::gtest_main)
gtest_discover_tests(test_cpp_17)

add_executable(test_cpp_17_nostl "cpp/CppNostlTest.cpp")
messgen_add_types_library(msgs_test_types_nostl_cpp17 "${MESSGEN_TYPE_DIR}" "nostl")
messgen_add_proto_library(msgs_test_proto_nostl_cpp17 "${MESSGEN_PROTO_DIR}" "test_proto" msgs_test_types_nostl_cpp17)
target_link_libraries(test_cpp_17_nostl msgs_test_proto_nostl_cpp17 GTest::gtest_main)
gtest_discover_tests(test_cpp_17_nostl)
