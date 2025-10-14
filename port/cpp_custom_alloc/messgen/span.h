#pragma once

#include <cstddef>
#include <type_traits>

namespace messgen {

template <class T>
class span {
public:
    using value_type = T;

    span() = default;

    span(const span<T> &other) {
        _ptr = other._ptr;
        _size = other._size;
    }

    span(T *ptr, size_t size)
        : _ptr(ptr),
          _size(size) {
    }

    span(const T *ptr, size_t size)
        : _ptr(const_cast<T *>(ptr)),
          _size(size) {
    }

    template <class InputIterator, typename = std::enable_if_t<std::is_pointer<InputIterator>::value>>
    span(InputIterator &begin, InputIterator &end)
        : _ptr(begin),
          _size(end - begin) {
    }

    template <class V>
    span(V &v)
        : _ptr(v.begin()),
          _size(v.end() - v.begin()) {
    }

    span &operator=(const span &other) {
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

    bool operator==(const span &other) const {
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

    bool operator!=(const span<T> &other) const {
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

private:
    T *_ptr = nullptr;
    size_t _size = 0;
};

} // namespace messgen
