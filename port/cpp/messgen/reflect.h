#pragma once

#include "traits.h"

namespace messgen {

template <class T>
using reflect_t = T *; // we could use a hard type instead, but that would incur
                       // a penalty on compile time

template <class T>
using splice_t = std::remove_pointer_t<T>;

template <class T>
constexpr reflect_t<remove_cvref_t<T>> reflect_type = {};

template <class T>
constexpr reflect_t<remove_cvref_t<T>> reflect_object(T &&t) {
    return &t;
}

} // namespace messgen