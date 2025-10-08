#
# Function creates a target for specified types.
#
function(messgen_add_types_library LIBRARY_NAME BASE_DIRS MODE)
    string(JOIN "," OPTIONS "mode=${MODE}" ${ARGN})

    set(MESSAGES_OUT_DIR "${CMAKE_BINARY_DIR}/${LIBRARY_NAME}/generated_src")

    get_filename_component(MESSGEN_DIR ${CMAKE_CURRENT_FUNCTION_LIST_DIR} DIRECTORY)
    get_filename_component(MESSGEN_DIR ${MESSGEN_DIR} DIRECTORY)

    set(MESSGEN_ARGS "")
    MESSAGE("Types base dirs ${BASE_DIRS}")
    foreach (BASE_DIR ${BASE_DIRS})
        list(APPEND MESSGEN_ARGS "--types" ${BASE_DIR})
    endforeach ()

    if (OPTIONS)
        list(APPEND MESSGEN_ARGS "--options")
        list(APPEND MESSGEN_ARGS ${OPTIONS})
    endif ()

    set(GENERATE_TARGET_NAME "${LIBRARY_NAME}__generate__")
    # Run messgen types generation. Output files will be overwritten only if changed
    add_custom_target(
        ${GENERATE_TARGET_NAME}
        COMMAND "python3"
        ${MESSGEN_DIR}/messgen-generate.py
        ${MESSGEN_ARGS}
        "--outdir" ${MESSAGES_OUT_DIR}
        "--lang" "cpp"
    )

    add_library(${LIBRARY_NAME} INTERFACE)
    add_dependencies(${LIBRARY_NAME} ${GENERATE_TARGET_NAME})
    target_include_directories(${LIBRARY_NAME} INTERFACE
        ${MESSAGES_OUT_DIR}
        ${MESSGEN_DIR}/port/cpp
        ${MESSGEN_DIR}/port/cpp_${MODE}
    )
endfunction()

#
# Function creates a target for specified protocol.
#
function(messgen_add_proto_library LIBRARY_NAME BASE_DIR PROTOCOL TYPES_TARGET MODE)
    string(JOIN "," OPTIONS "mode=${MODE}" ${ARGN})

    set(MESSAGES_OUT_DIR "${CMAKE_BINARY_DIR}/${LIBRARY_NAME}/generated_src")


    get_filename_component(MESSGEN_DIR ${CMAKE_CURRENT_FUNCTION_LIST_DIR} DIRECTORY)
    get_filename_component(MESSGEN_DIR ${MESSGEN_DIR} DIRECTORY)

    if (OPTIONS)
        list(APPEND MESSGEN_ARGS "--options")
        list(APPEND MESSGEN_ARGS ${OPTIONS})
    endif ()

    set(GENERATE_TARGET_NAME "${LIBRARY_NAME}__generate__")
    # Run messgen protocol generation. Output files will be overwritten only if changed
    add_custom_target(
        ${GENERATE_TARGET_NAME}
        COMMAND "python3"
        ${MESSGEN_DIR}/messgen-generate.py
        ${MESSGEN_ARGS}
        "--protocol" "${BASE_DIR}:${PROTOCOL}"
        "--outdir" ${MESSAGES_OUT_DIR}
        "--lang" "cpp"
    )

    add_library(${LIBRARY_NAME} INTERFACE)
    add_dependencies(${LIBRARY_NAME} ${GENERATE_TARGET_NAME})
    target_include_directories(${LIBRARY_NAME} INTERFACE ${MESSAGES_OUT_DIR})
    target_link_libraries(${LIBRARY_NAME} INTERFACE ${TYPES_TARGET})
endfunction()

include(FetchContent)
FetchContent_Declare(
        yaml-cpp
        GIT_REPOSITORY https://github.com/jbeder/yaml-cpp.git
        GIT_TAG a83cd31
)
FetchContent_GetProperties(yaml-cpp)
if(NOT yaml-cpp_POPULATED)
    message(STATUS "Fetching yaml-cpp...")
    FetchContent_Populate(yaml-cpp)
    add_subdirectory(${yaml-cpp_SOURCE_DIR} ${yaml-cpp_BINARY_DIR})
endif()

get_filename_component(MESSGEN_DIR ${CMAKE_CURRENT_LIST_DIR} DIRECTORY)
get_filename_component(MESSGEN_DIR ${MESSGEN_DIR} DIRECTORY)

add_library(messgen_dynamic "${MESSGEN_DIR}/port/cpp_dynamic/messgen_dynamic/MessgenDynamic.cpp")
target_include_directories(messgen_dynamic PUBLIC "${MESSGEN_DIR}/port/cpp_dynamic")
target_link_libraries(messgen_dynamic yaml-cpp::yaml-cpp)
