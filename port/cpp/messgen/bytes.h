#pragma once

#include "messgen_common.h"
#include "traits.h"

#include <cstddef>
#include <cstdint>
#include <cstring>
#include <type_traits>

namespace messgen {

class bytes {
public:
    bytes() noexcept
        : _f_serialize(+[](const void *, messgen::size_type, uint8_t *) -> size_t { return 0; }) {
    }

    bytes(const uint8_t *ptr, size_t size) noexcept
        : _ptr(ptr),
          _size(size),
          _f_serialize(+[](const void *obj, messgen::size_type size, uint8_t *buf) {
              ::memcpy(buf, obj, size);
              return size_t(size);
          }) {
    }

    template <class VIEW>
    explicit bytes(VIEW *v, std::enable_if_t<is_data_view_v<VIEW>> * = nullptr) noexcept
        : bytes(v->data(), v->size()) {
    }

    template <class S, typename = std::enable_if_t<has_serialize_method_v<S>>>
    explicit bytes(const S *s) noexcept
        : _ptr(reinterpret_cast<const void *>(s)),
          _f_serialize(+[](const void *obj, messgen::size_type, uint8_t *buf) { return static_cast<const S *>(obj)->serialize(buf); }),
          _size(s->serialized_size()) {
    }

    bytes(bytes &&other) noexcept = default;
    bytes(const bytes &other) noexcept = default;

    bytes &operator=(bytes &&other) noexcept = default;
    bytes &operator=(const bytes &other) noexcept = default;

    [[nodiscard]] bool operator==(const bytes &other) const noexcept {
        return _size == other._size && _ptr == other._ptr && _f_serialize == other._f_serialize;
    }

    [[nodiscard]] bool operator!=(const bytes &other) const noexcept {
        return !(*this == other);
    }

    [[nodiscard]] size_t size() const noexcept {
        return _size;
    }

    [[nodiscard]] const uint8_t *data() const noexcept {
        return reinterpret_cast<const uint8_t *>(_ptr);
    }

    [[nodiscard]] const uint8_t *begin() const noexcept {
        return reinterpret_cast<const uint8_t *>(_ptr);
    }

    [[nodiscard]] const uint8_t *end() const noexcept {
        return reinterpret_cast<const uint8_t *>(_ptr) + _size;
    }

    size_t serialize(uint8_t *buf) const noexcept {
        return _f_serialize(_ptr, _size, buf);
    }

    [[nodiscard]] size_t serialized_size() const {
        return _size;
    }

private:
    using serialize_function = size_t (*)(const void *, messgen::size_type, uint8_t *);

    messgen::size_type _size = 0;
    const void *_ptr = nullptr;
    serialize_function _f_serialize = nullptr;
};

} // namespace messgen