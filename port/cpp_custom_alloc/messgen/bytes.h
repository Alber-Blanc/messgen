#pragma once

#include "messgen/traits.h"

#include <cstddef>
#include <cstdint>
#include <cstring>
#include <vector>

namespace messgen {


class bytes {
public:
    using serialize_function = size_t (*)(void *, uint8_t *);
    using serialized_size_function = size_t (*)(void *);

    void *_ptr = nullptr;
    size_t _size = 0;
    serialize_function _f_serialize = nullptr;
    serialized_size_function _f_serialized_size = nullptr;

    bytes() = default;

    bytes(const bytes &other) {
        _ptr = other._ptr;
        _size = other._size;
    }

    bytes(void *ptr, size_t size)
        : _ptr(ptr),
          _size(size) {
    }

    bytes(const void *ptr, size_t size)
        : _ptr(const_cast<void *>(ptr)),
          _size(size) {
    }

    template <class ITER, typename = std::enable_if_t<std::is_pointer<ITER>::value>>
    bytes(ITER &begin, ITER &end)
        : _ptr(begin),
          _size(end - begin) {
    }

    // TODO generic template
    bytes(std::vector<uint8_t> &v)
        : _ptr(v.data()),
          _size(v.size()) {
    }

    // TODO generic template
    template <size_t SIZE>
    bytes(std::array<uint8_t, SIZE> &v)
        : _ptr(v.data()),
          _size(v.size()) {
    }

    template <class S, typename = std::enable_if_t<messgen::has_serialize_method_v<S>>>
    bytes(const S &s)
        : _ptr(const_cast<void *>(reinterpret_cast<const void *>(&s))),
          _f_serialize([](void *obj, uint8_t *buf) { return static_cast<S *>(obj)->serialize(buf); }),
          _f_serialized_size([](void *obj) { return static_cast<S *>(obj)->serialized_size(); }) {
    }

    bytes &operator=(const bytes &other) {
        _ptr = other._ptr;
        _size = other._size;
        return *this;
    }

    size_t size() const {
        return _size;
    }

    bool operator==(const bytes &other) const {
        if (_size != other._size) {
            return false;
        }

        return ::memcmp(_ptr, other._ptr, _size) == 0;
    }

    bool operator!=(const bytes &other) const {
        return !(*this == other);
    }

    uint8_t &operator[](size_t idx) {
        return reinterpret_cast<uint8_t *>(_ptr)[idx];
    }

    const uint8_t &operator[](size_t idx) const {
        return reinterpret_cast<uint8_t *>(_ptr)[idx];
    }

    uint8_t *data() {
        return reinterpret_cast<uint8_t *>(_ptr);
    }

    const uint8_t *data() const {
        return reinterpret_cast<const uint8_t *>(_ptr);
    }

    size_t serialize(uint8_t *buf) const {
        if (_f_serialize != nullptr) {
            return _f_serialize(_ptr, buf);
        }
        ::memcpy(buf, _ptr, _size);
        return _size;
    }

    size_t serialized_size() const {
        if (_f_serialized_size != nullptr) {
            return _f_serialized_size(_ptr);
        }
        return _size;
    }
};

} // namespace messgen
