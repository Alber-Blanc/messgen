#pragma once

#include <bitset>
#include <climits>
#include <type_traits>

namespace messgen::detail {

template<class M, class U>
struct bitset_base {
    template<typename E>
    friend M &operator|=(M &lhs, E rhs) {
        lhs._bits |= static_cast<U>(rhs);
        return lhs;
    }

    template<typename E>
    friend M operator|(M lhs, E rhs) {
        lhs |= static_cast<U>(rhs);
        return lhs;
    }

    template<typename E>
    friend M &operator&=(M &lhs, E rhs) {
        lhs._bits &= static_cast<U>(rhs);
        return lhs;
    }

    template<typename E>
    friend M operator&(M lhs, E rhs) {
        lhs &= static_cast<U>(rhs);
        return lhs;
    }

    template<typename E>
    friend M &operator^=(M &lhs, E rhs) {
        lhs._bits ^= static_cast<U>(rhs);
        return lhs;
    }

    template<typename E>
    friend M operator^(M lhs, E rhs) {
        lhs ^= static_cast<U>(rhs);
        return lhs;
    }

    friend M operator~(const M &rhs) {
        M result;
        result._bits = ~static_cast<U>(rhs);
        return result;
    }

    friend bool operator==(const M &lhs, const M &rhs) { return lhs._bits == rhs._bits; }

    friend bool operator!=(const M &lhs, const M &rhs) { return lhs._bits != rhs._bits; }

    auto to_string() const { return _bits.to_string(); }

    explicit operator U() const { return static_cast<U>(_bits.to_ullong()); }

    U to_underlying() const { return _bits.to_ullong(); }

    void clear() { _bits.reset(); }

    constexpr bitset_base() = default;

    explicit constexpr bitset_base(U other) : _bits{std::bitset<sizeof(U) * CHAR_BIT>(other)} {}

private:
    std::bitset<sizeof(U) * CHAR_BIT> _bits;
};
}// namespace messgen::detail
