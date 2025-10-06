#pragma once

#include <cstddef>
#include <cstdint>
#include <memory>

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
        if (align(alignof(T), alloc_size, _ptr, _size)) {
            T *ptr = reinterpret_cast<T *>(_ptr);
            _ptr = (uint8_t *) _ptr + alloc_size;
            _size -= alloc_size;

            return ptr;
        }

        return nullptr;
    }

protected:
    /**
     * @brief Aligns pointer to align bytes
     * @param align   -   alignment
     * @param size    -   size of object
     * @param ptr     -   pointer to align
     * @param space   -   space left
     * @return aligned pointer
     */
    static inline void *align(size_t align, size_t size, void *&ptr, size_t &space) noexcept {
        const auto intptr = reinterpret_cast<uintptr_t>(ptr);
        const auto aligned = (intptr - 1u + align) & -align;
        const auto diff = aligned - intptr;
        if ((size + diff) > space) {
            return nullptr;
        }
        space -= diff;
        return ptr = reinterpret_cast<void *>(aligned);
    }

    void *_ptr = nullptr;
    size_t _size = 0;
};

}// namespace messgen
