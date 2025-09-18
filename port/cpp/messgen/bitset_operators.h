#pragma once

#include <bitset>
#include <cstdint>
#include <climits>
#include <iostream>
#include <type_traits>

namespace messgen::detail {

template<class M, class U>
struct bitmask_operators_mixin {
    template<typename E>
    friend M& operator|=(M& lhs, E rhs)
    {
        lhs._bits.set(static_cast<typename M::underlying_type>(rhs));
        return lhs;
    }

    template<typename E>
    friend M operator|(M lhs, E rhs)
    {
        lhs |= rhs;
        return lhs;
    }

    template<typename E>
    friend M& operator&=(M& lhs, E rhs)
    {
        lhs._bits &= std::bitset<sizeof(U) * CHAR_BIT>(1 << static_cast<U>(rhs));
        return lhs;
    }

    template<typename E>
    friend M operator&(M lhs, E rhs)
    {
        lhs &= rhs;
        return lhs;
    }

    template<typename E>
    friend M& operator^=(M& lhs, E rhs)
    {
        lhs._bits ^= std::bitset<sizeof(U) * CHAR_BIT>(1 << static_cast<U>(rhs));
        return lhs;
    }

    template<typename E>
    friend M operator^(M lhs, E rhs)
    {
        lhs ^= rhs;
        return lhs;
    }

    friend M operator~(const M& rhs) {
        M result;
        result._bits = ~rhs._bits;
        return result;
    }

    auto to_string() const {
        return _bits.to_string();
    }

    operator U() const {
        return static_cast<U>(_bits.to_ullong());
    }

private:
    std::bitset<sizeof(U) * CHAR_BIT> _bits;
};
} // namespace messgen::detail
