#pragma once

#include "traits.h"

#include <cstddef>

namespace messgen {

template <class T>
class span {
public:
    using value_type = T;
    using pointer = T *;
    using const_pointer = const T *;

    span() noexcept = default;

    span(pointer ptr, size_t size)
        : _ptr(ptr),
          _size(size) {
    }

    span(const_pointer ptr, size_t size)
        : _ptr(const_cast<T *>(ptr)),
          _size(size) {
    }

    template <class VIEW>
    explicit span(VIEW *v, std::enable_if_t<is_data_view_v<VIEW>> * = nullptr) noexcept
        : span(v->data(), v->size()) {
    }

    span(span &&other) noexcept = default;
    span(const span &other) noexcept = default;

    span &operator=(span &&other) noexcept = default;
    span &operator=(const span &other) noexcept = default;

    [[nodiscard]] bool operator==(const span &other) const noexcept {
        return _size == other._size and ::memcmp(_ptr, other._ptr, _size * sizeof(T)) == 0;
    }

    [[nodiscard]] bool operator!=(const span &other) const noexcept {
        return !(*this == other);
    }

    [[nodiscard]] bool empty() const noexcept {
        return _size == 0;
    }

    [[nodiscard]] size_t size() const noexcept {
        return _size;
    }

    [[nodiscard]] pointer data() noexcept {
        return _ptr;
    }

    [[nodiscard]] const_pointer data() const noexcept {
        return _ptr;
    }

    [[nodiscard]] pointer begin() noexcept {
        return _ptr;
    }

    [[nodiscard]] const_pointer begin() const noexcept {
        return _ptr;
    }

    [[nodiscard]] pointer end() noexcept {
        return _ptr + _size;
    }

    [[nodiscard]] const_pointer end() const noexcept {
        return _ptr + _size;
    }

    T &operator[](size_t idx) {
        return _ptr[idx];
    }

    const T &operator[](size_t idx) const {
        return _ptr[idx];
    }

private:
    T *_ptr = nullptr;
    size_t _size = 0;
};

} // namespace messgen
