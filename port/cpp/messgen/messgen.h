#pragma once

#include "reflection.h"
#include "traits.h"
#include "Allocator.h"

#include <cstdint>

namespace messgen {

using size_type = uint32_t;
using serialize_func = size_t (*)(const void *, uint8_t *);
using serialized_size_func = size_t (*)(const void *);
constexpr std::string_view UNKNOWN_ENUM_STR = "<unknown>";

template <class T>
size_t free_serialize(const void *ptr, uint8_t *payload) {
    return reinterpret_cast<const T *>(ptr)->serialize(payload);
}

template <class T>
size_t free_serialized_size(const void *ptr) {
    return reinterpret_cast<const T *>(ptr)->serialized_size();
}

} // namespace messgen
