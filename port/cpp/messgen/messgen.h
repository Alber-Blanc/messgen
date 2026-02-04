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

template <typename Message, typename Fn>
void dispatch(Message&& msg, Fn&& fn) {
    if constexpr (std::is_invocable_v<Fn, Message>) {
        std::forward<Fn>(fn)(std::forward<Message>(msg));
    }
}

template <typename Message, typename Fn, typename... Rest>
void dispatch(Message&& msg, Fn&& fn, Rest&&... rest) {
    if constexpr (std::is_invocable_v<Fn, Message>) {
        std::forward<Fn>(fn)(std::forward<Message>(msg));
    } else {
        dispatch(std::forward<Message>(msg), std::forward<Rest>(rest)...);
    }
}

} // namespace messgen
