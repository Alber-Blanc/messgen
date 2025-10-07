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

    template<typename E>
    friend bool operator==(const M& lhs, const E& rhs) {
        if constexpr (std::is_same_v<M, E>) {
            return lhs._bits == rhs._bits;
        } else if constexpr (std::is_enum_v<E>) {
            return lhs._bits == std::bitset<sizeof(U) * CHAR_BIT>(1 << static_cast<U>(rhs));
        } else if constexpr (std::is_arithmetic_v<E>) {
            return static_cast<typename M::underlying_type>(lhs) == static_cast<typename M::underlying_type>(rhs);
        } else {
            static_assert(std::is_same_v<M, E> || std::is_enum_v<E> || std::is_arithmetic_v<E>, "operator== only supports same type, enum, or arithmetic rhs");
            return false;
        }
    }

    template<typename E>
    friend bool operator!=(const M& lhs, const E& rhs) {
        return !(lhs == rhs);
    }

    auto to_string() const {
        return _bits.to_string();
    }

    operator U() const {
        return static_cast<U>(_bits.to_ullong());
    }

    constexpr bitmask_operators_mixin() = default;

    // Constructor from another compatible bitmask
    template <typename OtherM, typename = std::enable_if_t<std::is_same_v<U, typename OtherM::underlying_type>>>
    constexpr bitmask_operators_mixin(const OtherM& other) {
        _bits = std::bitset<sizeof(U) * CHAR_BIT>(static_cast<U>(other));
    }

private:
    std::bitset<sizeof(U) * CHAR_BIT> _bits;
};
} // namespace messgen::detail
