cmake_minimum_required(VERSION 3.5)

project(messgen)

enable_testing()

if(NOT CMAKE_CXX_STANDARD)
    set(CMAKE_CXX_STANDARD 20)
endif()

include("integrations/cmake/messgen.cmake")

add_subdirectory(tests)
