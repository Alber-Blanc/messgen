#pragma once

#include <cstddef>
#include <vector>

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

} // namespace messgen
