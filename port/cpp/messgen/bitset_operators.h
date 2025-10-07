#pragma once

#include <bitset>
#include <climits>
#include <type_traits>

namespace messgen::detail {

template<class M, class U>
struct bitmask_operators_mixin {
    template<typename E>
    friend M& operator|=(M& lhs, const E& rhs)
    {
        if constexpr (std::is_same_v<M, E>) {
            lhs._bits |= rhs._bits;
        } else {
            lhs._bits.set(static_cast<typename M::underlying_type>(rhs));
        }
        return lhs;
    }

    template<typename E>
    friend M operator|(M lhs, const E& rhs)
    {
        lhs |= rhs;
        return lhs;
    }

    template<typename E>
    friend M& operator&=(M& lhs, const E& rhs)
    {
        if constexpr (std::is_same_v<M, E>) {
            lhs._bits &= rhs._bits;
        } else {
            lhs._bits &= std::bitset<sizeof(U) * CHAR_BIT>(1 << static_cast<U>(rhs));
        }
        return lhs;
    }

    template<typename E>
    friend M operator&(M lhs, const E& rhs)
    {
        lhs &= rhs;
        return lhs;
    }

    template<typename E>
    friend M& operator^=(M& lhs, const E& rhs)
    {
        if constexpr (std::is_same_v<M, E>) {
            lhs._bits ^= rhs._bits;
        } else {
            lhs._bits ^= std::bitset<sizeof(U) * CHAR_BIT>(1 << static_cast<U>(rhs));
        }
        return lhs;
    }

    template<typename E>
    friend M operator^(M lhs, const E& rhs)
    {
        lhs ^= rhs;
        return lhs;
    }

    friend M operator~(const M& rhs) {
        M result;
        result._bits = ~rhs._bits;
        return result;
    }

    friend bool operator==(const M& lhs, const M& rhs) {
        return lhs._bits == rhs._bits;
    }

    friend bool operator!=(const M& lhs, const M& rhs) {
        return lhs != rhs;
    }

    auto to_string() const {
        return _bits.to_string();
    }

    void from_underlying_type(U val) {
        _bits = std::bitset<sizeof(U) * CHAR_BIT>(val);
    }

    U to_underlying_type() const {
        return static_cast<U>(_bits.to_ullong());
    }

    void clear() {
        _bits.reset();
    }

    constexpr bitmask_operators_mixin() = default;

    // Constructor from another compatible bitmask
    template <typename OtherM, typename = std::enable_if_t<std::is_same_v<U, typename OtherM::underlying_type>>>
    explicit constexpr bitmask_operators_mixin(const OtherM& other) {
        _bits = std::bitset<sizeof(U) * CHAR_BIT>(other.to_underlying_type());
    }

private:
    std::bitset<sizeof(U) * CHAR_BIT> _bits;
};
} // namespace messgen::detail
