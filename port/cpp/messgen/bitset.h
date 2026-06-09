#pragma once

namespace messgen::detail {

template <class M, class U>
struct bitset_base {
    constexpr bitset_base() = default;

    constexpr explicit bitset_base(U other)
        : _bits{other} {
    }

    constexpr bitset_base &operator=(const M &other) {
        _bits = other._bits;
        return *this;
    }

    constexpr friend M &operator|=(M &lhs, M rhs) {
        lhs._bits |= U(rhs);
        return lhs;
    }

    constexpr friend M operator|(M lhs, M rhs) {
        lhs |= rhs;
        return lhs;
    }

    constexpr friend M &operator&=(M &lhs, M rhs) {
        lhs._bits &= U(rhs);
        return lhs;
    }

    constexpr friend M operator&(M lhs, M rhs) {
        lhs &= rhs;
        return lhs;
    }

    constexpr friend M &operator^=(M &lhs, M rhs) {
        lhs._bits ^= U(rhs);
        return lhs;
    }

    constexpr friend M operator^(M lhs, M rhs) {
        lhs ^= rhs;
        return lhs;
    }

    constexpr friend M operator~(const M &other) {
        return M(~other._bits);
    }

    constexpr friend bool operator==(const M &lhs, const M &rhs) {
        return lhs._bits == rhs._bits;
    }

    constexpr friend bool operator!=(const M &lhs, const M &rhs) {
        return lhs._bits != rhs._bits;
    }

    constexpr explicit operator U() const {
        return U(_bits);
    }

    constexpr operator bool() const {
        return _bits != 0;
    }

    constexpr U to_underlying() const {
        return U(_bits);
    }

    constexpr void clear() {
        _bits = 0;
    }

private:
    U _bits = 0;
};
} // namespace messgen::detail
