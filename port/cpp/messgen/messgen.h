#pragma once

#include "reflection.h"
#include "traits.h"
#include "Allocator.h"

#if __cplusplus >= 202002L
#include "concepts.h"
#endif

#include <cstdint>

namespace messgen {

using size_type = uint32_t;
using serialize_func = size_t (*)(const void *, uint8_t *);
using serialized_size_func = size_t (*)(const void *);

template <type T>
size_t free_serialize(const void *ptr, uint8_t *payload) {
    return reinterpret_cast<const T *>(ptr)->serialize(payload);
}

template <type T>
size_t free_serialized_size(const void *ptr) {
    return reinterpret_cast<const T *>(ptr)->serialized_size();
}

template <class T, class ALLOC_BUF>
size_t deserialize_with_alloc(T &msg, uint8_t *buf, ALLOC_BUF &alloc_buf) {
    if constexpr (T::NEED_ALLOC) {
        return msg.deserialize(buf, Allocator(&alloc_buf));
    } else {
        return msg.deserialize(buf);
    }
}

} // namespace messgen
