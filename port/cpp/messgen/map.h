#pragma once

#include <cstddef>
#include <map>
#include <utility>

namespace messgen {

template <class Key, class T>
struct map {
    using key_type = Key;
    using mapped_type = T;
    using value_type = std::pair<Key, T>;

    map() = default;

    map(const map &other) = default;

    map &operator=(const map &other) = default;

    map(value_type *ptr, size_t size)
        : _ptr(ptr),
          _size(size) {
    }

    map(const value_type *ptr, size_t size)
        : _ptr(const_cast<value_type *>(ptr)),
          _size(size) {
    }

    size_t size() const {
        return _size;
    }

    value_type *begin() {
        return _ptr;
    }

    const value_type *begin() const {
        return _ptr;
    }

    value_type *end() {
        return _ptr + _size;
    }

    const value_type *end() const {
        return _ptr + _size;
    }

    value_type *data() {
        return _ptr;
    }

    const value_type *data() const {
        return _ptr;
    }

    bool operator==(const map &other) const {
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

    bool operator!=(const map &other) const {
        return !(*this == other);
    }

private:
    value_type *_ptr = nullptr;
    size_t _size = 0;
};

} // namespace messgen
