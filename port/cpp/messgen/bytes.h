#pragma once

#include "messgen.h"

#include <cstddef>
#include <cstdint>
#include <cstring>
#include <type_traits>

namespace messgen {

class bytes {
public:
    using pointer = uint8_t *;
    using const_pointer = const uint8_t *;

    bytes() noexcept = default;

    bytes(const_pointer ptr, size_t size) noexcept
        : _ptr(const_cast<pointer>(ptr)),
          _size(size) {
    }

    template <class VIEW>
    explicit bytes(VIEW *v, std::enable_if_t<is_data_view_v<VIEW>> * = nullptr) noexcept
        : bytes(v->data(), v->size()) {
    }

    bytes(bytes &&other) noexcept = default;
    bytes(const bytes &other) noexcept = default;

    bytes &operator=(bytes &&other) noexcept = default;
    bytes &operator=(const bytes &other) noexcept = default;

    [[nodiscard]] bool operator==(const bytes &other) const noexcept {
        return _size == other._size and ::memcmp(_ptr, other._ptr, _size) == 0;
    }

    [[nodiscard]] bool operator!=(const bytes &other) const noexcept {
        return !(*this == other);
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

    uint8_t &operator[](size_t idx) {
        return _ptr[idx];
    }

    const uint8_t &operator[](size_t idx) const {
        return _ptr[idx];
    }

private:
    messgen::size_type _size = 0;
    pointer _ptr = nullptr;
};

} // namespace messgen