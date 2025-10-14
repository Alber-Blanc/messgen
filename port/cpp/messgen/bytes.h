#pragma once

#include "messgen_common.h"
#include "traits.h"

#include <cstddef>
#include <cstdint>
#include <cstring>
#include <vector>

namespace messgen {

class bytes {
public:
    bytes()
        : _f_serialize(+[](const void *, messgen::size_type, uint8_t *) -> size_t { return 0; }) {
    }

    bytes(const bytes &other) {
        _ptr = other._ptr;
        _size = other._size;
        _f_serialize = other._f_serialize;
    }

    bytes(const uint8_t *ptr, size_t size)
        : _ptr(ptr),
          _size(size),
          _f_serialize(+[](const void *obj, messgen::size_type size, uint8_t *buf) {
              ::memcpy(buf, obj, size);
              return size_t(size);
          }) {
    }

    template <class V, typename = std::enable_if_t<
                           std::is_same_v<typename std::iterator_traits<typename V::iterator>::iterator_category, std::random_access_iterator_tag>>>
    bytes(V &v)
        : _ptr(v.begin()),
          _size(v.end() - v.begin()) {
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
          _f_serialize(+[](const void *obj, messgen::size_type, uint8_t *buf) { return static_cast<const S *>(obj)->serialize(buf); }),
          _size(s.serialized_size()) {
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

    const uint8_t *data() const {
        return reinterpret_cast<const uint8_t *>(_ptr);
    }

    const uint8_t *begin() const {
        return reinterpret_cast<const uint8_t *>(_ptr);
    }

    const uint8_t *end() const {
        return reinterpret_cast<const uint8_t *>(_ptr) + _size;
    }

    size_t serialize(uint8_t *buf) const {
        return _f_serialize(_ptr, _size, buf);
    }

    size_t serialized_size() const {
        return _size;
    }

private:
    using serialize_function = size_t (*)(const void *, messgen::size_type, uint8_t *);

    messgen::size_type _size = 0;
    const void *_ptr = nullptr;
    serialize_function _f_serialize = nullptr;
};

} // namespace messgen