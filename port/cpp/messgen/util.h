#pragma once

#include "bytes.h"

namespace messgen {

template <class T, class ALLOC_BUF>
size_t deserialize_with_alloc(T &msg, bytes buf, ALLOC_BUF &alloc_buf) {
    if constexpr (T::NEED_ALLOC) {
        return msg.deserialize(buf, Allocator(&alloc_buf));
    } else {
        return msg.deserialize(buf);
    }
}

} // namespace messgen
