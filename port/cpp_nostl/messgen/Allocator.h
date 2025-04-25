#pragma once

#include <cstddef>
#include <cstdint>

namespace messgen {

/**
 * @brief Class for holding dynamic fields while deserializing
 * @note  This object should be recreated after each deserialize call.
 */
class Allocator {
public:
    Allocator()
        : _begin(nullptr),
          _end(nullptr) {
    }

    Allocator(uint8_t *ptr, size_t size)
        : _begin(ptr),
          _end(ptr + size) {
    }

    /**
     * @brief Allocates memory for num objects of type T
     * @tparam T    -   type of object
     * @param num   -   number of objects
     * @return pointer to allocated memory or nullptr if not enough memory
     */
    template <class T>
    T *alloc(size_t num) {
        // Align the pointer
        auto ptr = reinterpret_cast<uint8_t *>(size_t(alignof(T) - 1 + _begin) & ~(alignof(T) - 1));
        size_t size = num * sizeof(T);
        if (ptr + size <= _end) {
            _begin = ptr + size;
            return reinterpret_cast<T *>(ptr);
        }
        return nullptr; // Out of memory
    }

private:
    uint8_t *_begin;
    uint8_t *_end;
};

/**
 * @brief Class which allows to statically allocate memory for messgen parsing
 * @tparam MEM_SIZE     -   memory size
 * @warning Each parse call on this class will clear memory, so if you want to do multiple parse calls
 *          store it into temporary MemoryAllocator& variable.
 */
template <size_t MEM_SIZE>
class StaticAllocator {
public:
    explicit StaticAllocator() noexcept
        : _alloc(_memory, MEM_SIZE) {
    }

    operator Allocator &() noexcept {
        return get();
    }

    Allocator &get() noexcept {
        _alloc = Allocator(_memory, MEM_SIZE);
        return _alloc;
    }

private:
    uint8_t _memory[MEM_SIZE]{};
    Allocator _alloc;
};

} // namespace messgen
