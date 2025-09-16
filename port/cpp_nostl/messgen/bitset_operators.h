#include <bitset>
#include <cstdint>
#include <climits>
#include <iostream>
#include <type_traits>

namespace messgen::detail {

template<class M>
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

    auto to_string() const {
        return static_cast<const M&>(*this)._bits.to_string();
    }
};

} // namespace messgen::detail