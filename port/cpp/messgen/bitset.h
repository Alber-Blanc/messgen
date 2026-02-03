#pragma once

namespace messgen::detail {

template <class M, class U>
struct bitset_base {
    constexpr bitset_base() = default;

    explicit constexpr bitset_base(U other)
        : _bits{other} {
    }

    bitset_base &operator=(const M &other) {
        _bits = other._bits;
        return *this;
    }

    friend M &operator|=(M &lhs, M rhs) {
        lhs._bits |= U(rhs);
        return lhs;
    }

    friend M operator|(M lhs, M rhs) {
        lhs |= rhs;
        return lhs;
    }

    friend M &operator&=(M &lhs, M rhs) {
        lhs._bits &= U(rhs);
        return lhs;
    }

    friend M operator&(M lhs, M rhs) {
        lhs &= rhs;
        return lhs;
    }

    friend M &operator^=(M &lhs, M rhs) {
        lhs._bits ^= U(rhs);
        return lhs;
    }

    friend M operator^(M lhs, M rhs) {
        lhs ^= rhs;
        return lhs;
    }

    friend M operator~(const M &other) {
        return M(~other._bits);
    }

    friend bool operator==(const M &lhs, const M &rhs) {
        return lhs._bits == rhs._bits;
    }

    friend bool operator!=(const M &lhs, const M &rhs) {
        return lhs._bits != rhs._bits;
    }

    explicit operator U() const {
        return U(_bits);
    }

    operator bool() const {
        return _bits != 0;
    }

    U to_underlying() const {
        return U(_bits);
    }

    void clear() {
        _bits = 0;
    }

private:
    U _bits = 0;
};
} // namespace messgen::detail
