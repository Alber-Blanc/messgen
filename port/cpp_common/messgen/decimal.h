#pragma once

#include <decimal/decimal>

#include <array>
#include <cassert>
#include <cstdint>
#include <cmath>
#include <string>

extern "C" char *decimal64ToString(std::decimal::decimal64 const *, char *);

namespace messgen {

namespace detail {
static constexpr auto POW10 = []() {
    constexpr auto limit = 17;
    auto res = std::array<uint64_t, limit>{1};
    for (int i = 1; i < limit; ++i) {
        res[i] = res[i - 1] * 10;
    }
    return res;
}();

} // namespace detail

enum class RoundMode {
    down = -1,
    mid = 0,
    up = 1,
};

struct Decimal64 {

    constexpr Decimal64() = default;

    [[nodiscard]] static Decimal64 from_double(double value, Decimal64 tick, RoundMode round_mode) noexcept {
        assert(tick > Decimal64::from_integer(0));

        auto [value_sign, value_coeff, value_exp] = Decimal64{value}.decompose();
        auto [tick_sign, tick_coeff, tick_exp] = tick.decompose();

        // Normalize exponent (make both coefficients represent same scale)
        int exp_diff = value_exp - tick_exp;
        int is_value_bigger = exp_diff >> 31;
        int pos_diff = (exp_diff ^ is_value_bigger) - is_value_bigger;

        assert(pos_diff < detail::POW10.size());

        value_coeff *= detail::POW10[pos_diff & ~is_value_bigger];
        tick_coeff *= detail::POW10[pos_diff & is_value_bigger];
        int result_exp = (value_exp & is_value_bigger) | (tick_exp & ~is_value_bigger);

        // Do the rounding using standard C++
        auto sign_mult = value_sign * -2 + 1;
        switch (round_mode) {
            case RoundMode::down:
                return Decimal64(sign_mult * static_cast<long long>(std::floor(value_coeff / tick_coeff)) * tick_coeff, result_exp);
            case RoundMode::mid:
                return Decimal64(sign_mult * std::llround(value_coeff / tick_coeff) * tick_coeff, result_exp);
            case RoundMode::up:
                return Decimal64(sign_mult * static_cast<long long>(std::ceil(value_coeff / tick_coeff)) * tick_coeff, result_exp);
            default:
                __builtin_unreachable();
        }

        return Decimal64{0, 0};
    }

    [[nodiscard]] static Decimal64 from_integer(std::integral auto integer) noexcept {
        return Decimal64{std::decimal::make_decimal64(static_cast<long long>(integer), 0)};
    }

    [[nodiscard]] static Decimal64 from_string(std::string_view str);

    [[nodiscard]] double to_double() const noexcept {
        return std::decimal::decimal64_to_double(_value);
    }

    [[nodiscard]] int64_t to_integer() noexcept {
        return std::decimal::decimal_to_long_long(_value);
    }

    [[nodiscard]] std::string to_string() const {
        char buffer[128];
        ::decimal64ToString(&_value, buffer);
        return buffer;
    }

    Decimal64 &operator+=(Decimal64 other) noexcept {
        _value += other._value;
        return *this;
    }

    Decimal64 &operator-=(Decimal64 other) noexcept {
        _value -= other._value;
        return *this;
    }

    Decimal64 &operator*=(int64_t other) noexcept {
        _value *= other;
        return *this;
    }

    [[nodiscard]] friend Decimal64 operator+(Decimal64 lhs, Decimal64 rhs) noexcept {
        lhs += rhs;
        return lhs;
    }

    [[nodiscard]] friend Decimal64 operator-(Decimal64 lhs, Decimal64 rhs) noexcept {
        lhs -= rhs;
        return lhs;
    }

    [[nodiscard]] friend Decimal64 operator*(Decimal64 lhs, int64_t rhs) noexcept {
        lhs *= rhs;
        return lhs;
    }

    [[nodiscard]] Decimal64 operator-() const noexcept {
        return Decimal64(-_value);
    }

    friend std::strong_ordering operator<=>(const Decimal64 &lhs, const Decimal64 &rhs) noexcept {
        if (lhs._value < rhs._value)
            return std::strong_ordering::less;
        if (lhs._value > rhs._value)
            return std::strong_ordering::greater;
        return std::strong_ordering::equal;
    }

    friend bool operator==(const Decimal64 &lhs, const Decimal64 &rhs) noexcept {
        return lhs._value == rhs._value;
    }

private:
    using ValueType = std::decimal::decimal64;

    template <char... C>
    friend Decimal64 operator""_dd();

    explicit Decimal64(long long coeff, int exponent)
        : _value(std::decimal::make_decimal64(static_cast<long long>(coeff), exponent)) {
    }

    explicit Decimal64(double value)
        : _value(value) {
    }

    explicit Decimal64(ValueType value)
        : _value(value) {
    }

    std::tuple<int8_t, uint64_t, int16_t> decompose() const {
        constexpr auto exponent_bias = 398;
        constexpr auto exponent_mask = (int64_t(1) << 10) - 1;

        auto bits = *reinterpret_cast<const int64_t *>(&_value);
        auto sign = bits >> 63;

        auto exponent_2 = (bits >> 53 & exponent_mask) - exponent_bias;
        auto coeff_2 = bits & ((uint64_t(1) << 53) - 1);

        auto exponent_1 = (bits >> 51 & exponent_mask) - exponent_bias;
        auto coeff_1 = (1LL << 53) | ((uint64_t(1) << 51) - 1);

        auto is_v1 = bool((bits >> 62) & 1);
        return {
            sign,
            (is_v1 * coeff_1) | (!is_v1 * coeff_2),
            (is_v1 * exponent_1) | (!is_v1 * exponent_2),
        };
    }

    ValueType _value = 0;
};

namespace detail {

template <char C>
constexpr void parse_int(std::pair<int, int> &fp) {
    static_assert('0' <= C && C <= '9', "not a valid number");
    fp.first = fp.first * 10 + (C - '0'); // NOLINT
}

template <char C>
constexpr void parse_frac(std::pair<int, int> &fp) {
    parse_int<C>(fp);
    --fp.second;
}

template <char C1, char C2, char... Rest>
constexpr void parse_frac(std::pair<int, int> &fp) {
    parse_frac<C1>(fp);
    parse_frac<C2, Rest...>(fp);
}

template <char C1, char C2, char... Rest>
constexpr void parse_int(std::pair<int, int> &fp) {
    if constexpr (C1 == '.') {
        parse_frac<C2, Rest...>(fp);
    } else {
        parse_int<C1>(fp);
        parse_int<C2, Rest...>(fp);
    }
}

template <char C, char... Rest>
constexpr int parse(std::pair<int, int> &fp) {
    if constexpr (C == '-') {
        parse<Rest...>(fp);
        return -1;
    } else if constexpr (C == '0') {
        parse<Rest...>(fp);
        return 1;
    } else {
        parse_int<C, Rest...>(fp);
        return 1;
    }
}

} // namespace detail

template <char... C>
[[nodiscard]] Decimal64 operator""_dd() {
    auto fp_vals = std::pair<int, int>{0, 0};
    auto sign_mul = detail::parse<C...>(fp_vals);
    return Decimal64{std::decimal::make_decimal64(static_cast<long long>(sign_mul * fp_vals.first), fp_vals.second)};
}

} // namespace messgen
