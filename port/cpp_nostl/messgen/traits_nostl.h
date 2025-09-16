#pragma once

#include "Allocator.h"
#include <messgen/traits.h>

#include <cstdint>
#include <type_traits>

namespace messgen {

template <typename T, typename = void>
struct has_deserialize_alloc_method : std::false_type {};

template<typename T>
struct has_deserialize_alloc_method<
        T, std::void_t<decltype(static_cast<std::size_t (T::*)(const uint8_t *, Allocator &)>(&T::deserialize_alloc))>>
        : std::true_type {};

}// namespace messgen
