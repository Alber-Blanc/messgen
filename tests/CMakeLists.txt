include(GoogleTest)
find_package(GTest REQUIRED)

enable_testing()

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

    add_executable(test_cpp_dynamic "cpp_dynamic/main.cpp")
    target_include_directories(test_cpp_dynamic PUBLIC "${MESSGEN_ROOT_DIR}/port/cpp_dynamic")
    target_link_libraries(test_cpp_dynamic PUBLIC messgen_dynamic)
else()
    message(WARNING "C++ standard is less than 17, skipping C++ tests")

endif()

