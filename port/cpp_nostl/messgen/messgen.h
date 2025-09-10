#pragma once

#include "messgen/traits.h"
#if __cplusplus >= 202002L
#include "concepts.h"
#endif

#include "Allocator.h"
#include "reflection.h"

#include <cstdint>
#include <vector>
#include <tuple>

namespace messgen {

template <class T>
struct vector {
    using value_type = T;

    T *_ptr = nullptr;
    size_t _size = 0;

    vector() = default;

    vector(const vector<T> &other) {
        _ptr = other._ptr;
        _size = other._size;
    }

    vector(T *ptr, size_t size)
        : _ptr(ptr),
          _size(size) {
    }

    vector(const T *ptr, size_t size)
        : _ptr(const_cast<T *>(ptr)),
          _size(size) {
    }

    vector(std::vector<T> &v)
        : _ptr(v.begin().base()),
          _size(v.size()) {
    }

    vector(const std::vector<T> &v)
        : _ptr(const_cast<T *>(v.begin().base())),
          _size(v.size()) {
    }

    vector<T> &operator=(const vector<T> &other) {
        _ptr = other._ptr;
        _size = other._size;
        return *this;
    }

    size_t size() const {
        return _size;
    }

    T *begin() {
        return _ptr;
    }

    const T *begin() const {
        return _ptr;
    }

    T *end() {
        return _ptr + _size;
    }

    const T *end() const {
        return _ptr + _size;
    }

    bool operator==(const vector<T> &other) const {
        if (_size != other._size) {
            return false;
        }

        for (size_t i = 0; i < _size; ++i) {
            if (_ptr[i] != other._ptr[i]) {
                return false;
            }
        }

        return true;
    }

    bool operator!=(const vector<T> &other) const {
        return !(*this == other);
    }

    T &operator[](size_t idx) {
        return _ptr[idx];
    }

    const T &operator[](size_t idx) const {
        return _ptr[idx];
    }

    T *data() {
        return _ptr;
    }

    const T *data() const {
        return _ptr;
    }
};

using size_type = uint32_t;

template <class Protocol>
constexpr auto members_of() -> std::enable_if_t<is_protocol_v<Protocol>, decltype(members_of(reflect_type<Protocol>))> {
    constexpr auto members = members_of(reflect_type<Protocol>);
    return members;
}

template <class Message>
constexpr auto hash_of(reflect_t<Message>) -> std::enable_if_t<is_message_v<Message>, uint64_t> {
    constexpr auto hash = Message::HASH;
    return hash;
}

template <class Protocol>
constexpr auto hash_of(reflect_t<Protocol>) -> std::enable_if_t<is_protocol_v<Protocol>, uint64_t> {
    auto hash = uint64_t{0};
    auto combine = [&hash](auto... members) { hash = (hash_of(type_of(members)) ^ ...); };
    std::apply(combine, members_of(reflect_type<Protocol>));
    return hash;
}

template <class T>
constexpr auto hash_of() -> std::enable_if_t<is_protocol_v<T> || is_message_v<T>, uint64_t> {
    constexpr auto hash = hash_of(reflect_type<T>);
    return hash;
}

} // namespace messgen
