#pragma once

#include <cstddef>
#include <cstdint>

namespace messgen {

/**
 * @brief Class for holding dynamic fields while parsing
 * @note  Class is supposed to be re-created after each parse call
 */
class Allocator {
public:
    Allocator() noexcept {}

    Allocator(uint8_t *ptr, size_t size) noexcept : _ptr(ptr), _size(size) {}

    /**
     * @brief Allocates memory for num objects of type T
     * @tparam T    -   type of object
     * @param n   -   number of objects
     * @return pointer to allocated memory or nullptr if not enough memory
     */
    template<class T>
    T *alloc(size_t n) noexcept {
        if (n == 0) {
            return reinterpret_cast<T *>(_ptr);
        }

        const size_t alloc_size = sizeof(T) * n;
        const auto intptr = reinterpret_cast<uintptr_t>(_ptr);
        const auto aligned = (intptr - 1u + alignof(T)) & -alignof(T);
        const auto diff = aligned - intptr;
        if ((alloc_size + diff) > _size) {
            return nullptr;
        }
        _size -= diff;
        _ptr = reinterpret_cast<uint8_t *>(aligned);

        T *ptr = reinterpret_cast<T *>(_ptr);
        _ptr = _ptr + alloc_size;
        _size -= alloc_size;

        return ptr;
    }

protected:

    uint8_t *_ptr = nullptr;
    size_t _size = 0;
};

}// namespace messgen
