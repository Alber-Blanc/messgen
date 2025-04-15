#pragma once

#include <decimal/decimal>

#include <array>
#include <cassert>
#include <charconv>
#include <cmath>
#include <cstdint>
#include <string>

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

        // make both coefficients represent same scale
        int exp_diff = value_exp - tick_exp;
        int value_exp_bigger = exp_diff >> 31;
        int pos_diff = (exp_diff ^ value_exp_bigger) - value_exp_bigger;

        assert(pos_diff < detail::POW10.size());

        value_coeff *= detail::POW10[pos_diff & ~value_exp_bigger];
        tick_coeff *= detail::POW10[pos_diff & value_exp_bigger];
        int result_exp = (value_exp & value_exp_bigger) | (tick_exp & ~value_exp_bigger);

        switch (round_mode) {
            case RoundMode::down: {
                bool is_negative = value_sign < 0;
                return Decimal64(value_sign * ((value_coeff + is_negative * (tick_coeff - 1)) / tick_coeff * tick_coeff), result_exp);
            }
            case RoundMode::mid: {
                return Decimal64(value_sign * ((value_coeff + tick_coeff / 2) / tick_coeff * tick_coeff), result_exp);
            }
            case RoundMode::up: {
                bool is_positive = value_sign >= 0;
                return Decimal64(value_sign * ((value_coeff + is_positive * (tick_coeff - 1)) / tick_coeff * tick_coeff), result_exp);
            }
            default:
                __builtin_unreachable();
        }

        return Decimal64{0, 0};
    }

    [[nodiscard]] static Decimal64 from_integer(std::unsigned_integral auto integer) noexcept {
        return Decimal64{std::decimal::make_decimal64(static_cast<unsigned long long>(integer), 0)};
    }

    [[nodiscard]] static Decimal64 from_integer(std::integral auto integer) noexcept {
        return Decimal64{std::decimal::make_decimal64(static_cast<long long>(integer), 0)};
    }

    [[nodiscard]] static Decimal64 from_string(std::string_view str) {
        if (str.empty()) {
            return Decimal64{};
        }

        // remove leading whitespace
        while (!str.empty() && std::isspace(str.front())) {
            str.remove_prefix(1);
        }

        // remove trailing whitespace
        while (!str.empty() && std::isspace(str.back())) {
            str.remove_suffix(1);
        }

        auto sign = 1;
        if (str[0] == '-') {
            sign = -1;
            str.remove_prefix(1);
        }

        // parse integral part
        auto coeff = int64_t{};
        while (!str.empty() && str[0] != '.' && str[0] != 'e') {
            if (!std::isdigit(str[0])) {
                return Decimal64{};
            }
            coeff = coeff * 10 + (str[0] - '0');
            str.remove_prefix(1);
        }

        // parse frac part
        auto exponent = 0;
        if (!str.empty() && str[0] == '.') {
            str.remove_prefix(1);
            while (!str.empty() && str[0] != 'e') {
                if (!std::isdigit(str[0])) {
                    return Decimal64{};
                }
                coeff = coeff * 10 + (str[0] - '0');
                --exponent;
                str.remove_prefix(1);
            }
        }

        // parse exponent part
        if (!str.empty() && str[0] == 'e') {
            str.remove_prefix(1);
            auto exponent_part = 0;
            auto result = std::from_chars(str.data(), str.data() + str.size(), exponent_part);
            if (result.ec != std::errc{}) {
                return Decimal64{};
            }
            exponent += exponent_part;
        }

        return Decimal64{sign * coeff, exponent};
    }

    [[nodiscard]] double to_double() const noexcept {
        return std::decimal::decimal64_to_double(_value);
    }

    [[nodiscard]] int64_t to_integer() const noexcept {
        return std::decimal::decimal_to_long_long(_value);
    }

    [[nodiscard]] std::string to_string() const {
        auto [sign, coeff, exponent] = decompose();

        // normalize exponent
        while (coeff % 10 == 0 && exponent != 0) {
            coeff /= 10;
            ++exponent;
        }

        // fractional part till leading zeros
        auto mul = int64_t{1};
        auto print_frac = int64_t{0};
        auto exp_step = (exponent < 0) * 2 - 1;
        while (coeff && exponent != 0) {
            print_frac += mul * (coeff % 10);
            coeff /= 10;
            mul *= 10;
            exponent += exp_step;
        }

        // leading zeros of fractional part
        auto print_exp = 0;
        while (exponent != 0) {
            print_exp -= exp_step;
            exponent += exp_step;
        }

        // integral part
        mul = 1;
        auto print_int = int64_t{0};
        while (coeff) {
            print_int += mul * (coeff % 10);
            coeff /= 10;
            mul *= 10;
        };
        print_int *= sign;

        // convert to string
        char buff[128];
        if (print_exp != 0) {
            sprintf(buff, "%ld.%lde%d", print_int, print_frac, print_exp);
        } else if (print_frac != 0) {
            sprintf(buff, "%ld.%ld", print_int, print_frac);
        } else {
            sprintf(buff, "%ld", print_int);
        }

        return buff;
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

    friend std::ostream &operator<<(std::ostream &os, Decimal64 dec) {
        os << dec.to_string();
        return os;
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
        constexpr auto exponent_bias = int16_t{398};
        constexpr auto exponent_mask = (int16_t{1} << 10) - 1;

        auto bits = *reinterpret_cast<const uint64_t *>(&_value);
        auto sign = (bits >> 63) * -2 + 1;

        auto exponent_1 = (bits >> 51 & exponent_mask) - exponent_bias;
        auto coeff_1 = (bits & ((uint64_t{1} << 51) - 1)) | uint64_t{1} << 53;

        auto exponent_2 = (bits >> 53 & exponent_mask) - exponent_bias;
        auto coeff_2 = bits & ((uint64_t{1} << 53) - 1);

        auto is_v1 = bool((bits >> 62) & 1);
        return {
            sign,
            (is_v1 * coeff_1) + (!is_v1 * coeff_2),
            (is_v1 * exponent_1) + (!is_v1 * exponent_2),
        };
    }

    ValueType _value = 0;
};

namespace detail {

template <char C>
constexpr int parse_digit() {
    static_assert('0' <= C && C <= '9', "not a valid number");
    return C - '0';
}

template <char C, char... Rest>
constexpr int parse_int() {
    int exp = 0;
    if constexpr (C == '-') {
        ((exp = exp * 10 + parse_digit<Rest>()), ...);
        return -1 * exp;
    } else {
        exp = parse_digit<C>();
        ((exp = exp * 10 + parse_digit<Rest>()), ...);
        return exp;
    }
}

template <char C, char... Rest>
constexpr void parse_num(std::tuple<int, uint64_t, int> &ctx, bool frac) {
    auto &[sign, coeff, exponent] = ctx;
    if constexpr (C == 'e' or C == 'E') {
        exponent += parse_int<Rest...>();
        return;
    } else {
        if constexpr (C == '.') {
            frac = true;
        } else {
            coeff = coeff * 10 + parse_digit<C>(); // NOLINT
            exponent -= frac;
        }
        if constexpr (sizeof...(Rest)) {
            parse_num<Rest...>(ctx, frac);
        }
    }
}

template <char C, char... Rest>
constexpr void parse(std::tuple<int, uint64_t, int> &ctx) {
    if constexpr (C == '-') {
        parse<Rest...>(ctx);
        std::get<0>(ctx) = -1;
    } else if constexpr (C == '0' && sizeof...(Rest)) {
        parse<Rest...>(ctx);
    } else {
        parse_num<C, Rest...>(ctx, false);
    }
}

} // namespace detail

template <char... C>
[[nodiscard]] Decimal64 operator""_dd() {
    auto ctx = std::tuple<int, uint64_t, int>{1, 0, 0};
    detail::parse<C...>(ctx);
    auto [sign, coeff, exponent] = ctx;
    return Decimal64{std::decimal::make_decimal64(sign * static_cast<long long>(coeff), exponent)};
}

} // namespace messgen
