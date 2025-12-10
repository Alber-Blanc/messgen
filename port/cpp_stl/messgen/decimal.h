#pragma once

#include <array>
#include <cassert>
#include <charconv>
#include <cmath>
#include <compare>
#include <cstdint>
#include <inttypes.h>
#include <ios>
#include <istream>
#include <iostream>
#include <optional>
#include <string>
#include <tuple>

#ifndef MESSGEN_DEC_FP
#define MESSGEN_DEC_FP
#endif

namespace messgen {
namespace detail {} // namespace detail

enum class round_mode {
    down = -1,
    mid = 0,
    up = 1,
};

/// @brief A fixed-point decimal number representation using 64-bit precision.
///
/// decimal64 provides precise decimal arithmetic with fixed precision, which is
/// especially useful for financial calculations, trading systems, and other
/// applications where binary floating-point imprecision is unacceptable.
///
/// The class supports:
/// - Creation from doubles, integers, and strings
/// - Conversion to doubles, integers, and strings
/// - Basic arithmetic operations (+, -, *)
/// - Comparison operations
/// - Stream I/O
struct decimal64 {

    /// @brief Default constructor initializing to zero
    constexpr decimal64() noexcept
        : decimal64(1, 0, 0) {
    }

    /// @brief Creates a decimal64 from a double value according to specified tick size and rounding mode
    ///
    /// @param value The double value to convert
    /// @param tick The minimum representable increment (tick size)
    /// @param roundMode The rounding mode to apply during conversion
    /// @pre tick must be finite and greater than zero
    /// @pre value must be finite
    /// @return decimal64 The resulting decimal value
    [[nodiscard]] constexpr static decimal64 from_double(double value, decimal64 tick, round_mode) noexcept;

    /// @brief Creates a decimal64 from an unsigned integer value
    ///
    /// @tparam T Unsigned integral type
    /// @param value The unsigned integer value
    /// @return decimal64 The resulting decimal value
    [[nodiscard]] constexpr static decimal64 from_integer(std::unsigned_integral auto value) noexcept;

    /// @brief Creates a decimal64 from a signed integer value
    ///
    /// @tparam T Signed integral type
    /// @param value The signed integer value
    /// @return decimal64 The resulting decimal value
    [[nodiscard]] constexpr static decimal64 from_integer(std::integral auto value) noexcept;

    /// @brief Creates a decimal64 from a string representation
    ///
    /// @param value The string to parse
    /// @return std::optional<decimal64> The resulting decimal value, or any empty optional if parsing fails
    [[nodiscard]] constexpr static std::optional<decimal64> from_string(std::string_view value);

    /// @brief Converts to double representation
    ///
    /// @return double The value as a double
    [[nodiscard]] constexpr double to_double() const noexcept;

    /// @brief Converts to integer representation
    ///
    /// @return int64_t The value as an integer
    [[nodiscard]] constexpr int64_t to_integer() const noexcept;

    /// @brief Converts to string representation
    ///
    /// @return std::string The value as a string
    [[nodiscard]] constexpr std::string to_string() const;

    /// @brief Checks if this decimal represents infinity
    ///
    /// @return bool True if the value is positive or negative infinity, false otherwise
    [[nodiscard]] constexpr bool is_infinite() const noexcept;

    /// @brief Checks if this decimal represents NaN (Not a Number)
    ///
    /// @return bool True if the value is NaN, false otherwise
    [[nodiscard]] constexpr bool is_nan() const noexcept;

    /// @brief Checks if this decimal represents a negative value
    ///
    /// @return bool True if the value is negative, false otherwise
    [[nodiscard]] constexpr bool is_negative() const noexcept;

    /// @brief Adds another decimal64 to this one
    ///
    /// @param other The value to add
    /// @return decimal64& Reference to this object
    constexpr decimal64 &operator+=(decimal64 other) noexcept;

    /// @brief Subtracts another decimal64 from this one
    ///
    /// @param other The value to subtract
    /// @return decimal64& Reference to this object
    constexpr decimal64 &operator-=(decimal64 other) noexcept;

    /// @brief Multiplies this value by an integer
    ///
    /// @param factor The integer multiplier
    /// @return decimal64& Reference to this object
    constexpr decimal64 &operator*=(int64_t factor) noexcept;

    /// @brief Returns the negation of this value
    ///
    /// @return decimal64 The negated value
    constexpr decimal64 operator-() noexcept;

    /// @brief Adds two decimal64 values
    ///
    /// @param lhs The left-hand operand
    /// @param rhs The right-hand operand
    /// @return decimal64 The sum of the operands
    friend constexpr decimal64 operator+(decimal64 lhs, decimal64 rhs) noexcept;

    /// @brief Subtracts one decimal64 from another
    ///
    /// @param lhs The left-hand operand
    /// @param rhs The right-hand operand
    /// @return decimal64 The difference between the operands
    friend constexpr decimal64 operator-(decimal64 lhs, decimal64 rhs) noexcept;

    /// @brief Multiplies a decimal64 by an integer
    ///
    /// @param decimal The decimal value
    /// @param factor The integer multiplier
    /// @return decimal64 The product
    friend constexpr decimal64 operator*(decimal64 decimal, int64_t factor) noexcept;

    /// @brief Compares two decimal64 values
    ///
    /// @param lhs The left-hand operand
    /// @param rhs The right-hand operand
    /// @return std::strong_ordering The ordering relation between the operands
    friend constexpr std::partial_ordering operator<=>(const decimal64 &lhs, const decimal64 &rhs) noexcept;

    /// @brief Tests equality between two decimal64 values
    ///
    /// @param lhs The left-hand operand
    /// @param rhs The right-hand operand
    /// @return bool True if the operands are equal, false otherwise
    friend constexpr bool operator==(const decimal64 &lhs, const decimal64 &rhs) noexcept;

    /// @brief Writes a decimal64 to an output stream
    ///
    /// @param os The output stream
    /// @param decimal The decimal value to write
    /// @return std::ostream& Reference to the output stream
    friend std::ostream &operator<<(std::ostream &, decimal64);

    /// @brief Reads a decimal64 from an input stream
    ///
    /// @param is The input stream
    /// @param decimal The decimal value to read into
    /// @return std::istream& Reference to the input stream
    friend std::istream &operator>>(std::istream &, decimal64 &);

    /// @brief Creates a decimal64 representing positive infinity
    ///
    /// @return decimal64 A value representing positive infinity
    [[nodiscard]] constexpr static decimal64 infinity() noexcept;

    /// @brief Normalizes the internal representation of the decimal
    ///
    /// This function adjusts the coefficient and exponent to ensure they fall
    /// within valid ranges while preserving the value. It removes trailing zeros
    /// from the coefficient and adjusts the exponent accordingly to maintain
    /// the most compact representation.
    constexpr void normalize() noexcept;

private:
    using value_type = uint64_t;

    constexpr static auto DEC_SIGN_SHIFT = 63;
    constexpr static auto DEC_EXPONENT_SHIFT = 53;
    constexpr static auto DEC_NAN_MASK = 0b11111ULL << 58;
    constexpr static auto DEC_INF_MASK = 0b11110ULL << 58;
    constexpr static auto DEC_SIGN_MASK = 0b1ULL << DEC_SIGN_SHIFT;
    constexpr static auto DEC_MAX_EXPONENT = 19;
    constexpr static auto DEC_MIN_EXPONENT = -19;
    constexpr static auto DEC_MAX_COEFFICIENT = (1ULL << 53) - 1;
    constexpr static auto DEC_EXPONENT_BIAS = int16_t{398};
    constexpr static auto DEC_EXPONENT_MASK = (int16_t{1} << 10) - 1;

    template <typename T, int MIN, int MAX>
    constexpr static auto POW10 = []() {
        constexpr auto size = MAX - MIN + 1;

        auto res = std::array<T, size>{};
        res.fill(T{} + 1);

        uint64_t pow10 = 1;
        for (int i = -MIN; i < size; ++i) {
            res[i] = T(pow10);
            pow10 *= 10; // NOLINT
        }
        for (int i = 0; i < -MIN; ++i) {
            res[i] /= res[size - i - 1];
        }
        return res;
    }();

    template <char... C>
    friend decimal64 operator""_dd();

    constexpr explicit decimal64(int8_t sign, uint64_t coeff, int16_t exponent) noexcept;
    constexpr explicit decimal64(int64_t coeff, int exponent) noexcept;
    constexpr explicit decimal64(value_type value) noexcept;

    /// @brief Normalizes the decimal components to fit in range
    ///
    /// @return A pair containing (coefficient, exponent)
    [[nodiscard]] constexpr std::pair<uint64_t, int16_t> normalize(uint64_t coeff, int exponent) const noexcept;

    /// @brief Decomposes the decimal into its components
    ///
    /// @return A tuple containing (sign, coefficient, exponent)
    [[nodiscard]] constexpr std::tuple<int8_t, uint64_t, int16_t> decompose() const noexcept;

    /// @brief Computes 10 raised to the specified power efficiently.
    ///
    /// This function calculates the value of 10^exp at compile time.
    /// The result is guaranteed to be accurate within the range
    /// [10^-19 - 10^19].
    ///
    /// @param exp The exponent value to raise 10 to
    /// @pre exp must be in the range [-19, 19]
    /// @return The value of 10^exp as a double
    [[nodiscard]] constexpr static double pow10_dbl(int exp);

    /// @brief Computes 10 raised to the specified power efficiently.
    ///
    /// This function calculates the value of 10^exp at compile time.
    /// The result is guaranteed to be accurate within the limits of
    /// uint64_t precision.
    ///
    /// @param exp The exponent value to raise 10 to
    /// @pre exp must be in the range [0, 19]
    /// @return The value of 10^exp as a double
    [[nodiscard]] constexpr static uint64_t pow10_int(int exp);

    /// The internal decimal value
    value_type _value;
};

[[nodiscard]] constexpr inline double decimal64::pow10_dbl(int exp) {
    constexpr auto offset = int(POW10<double, DEC_MIN_EXPONENT, DEC_MAX_EXPONENT>.size()) / 2;

    assert(exp <= offset);
    assert(exp >= -offset);

    return POW10<double, DEC_MIN_EXPONENT, DEC_MAX_EXPONENT>[exp + offset];
}

[[nodiscard]] constexpr inline uint64_t decimal64::pow10_int(int exp) {
    return POW10<uint64_t, 0, DEC_MAX_EXPONENT>[exp];
}

[[nodiscard]] constexpr inline decimal64 decimal64::from_double(double value, decimal64 tick, round_mode round_mode) noexcept {
    assert(!tick.is_nan());
    assert(!tick.is_infinite());
    assert(tick > decimal64::from_integer(0));
    assert(std::isfinite(value));

    auto [tick_sign, tick_coeff, tick_exp] = tick.decompose();
    value *= pow10_dbl(-tick_exp);
    switch (round_mode) {
        case round_mode::down:
            return decimal64{static_cast<long long>(std::floor(value / tick_coeff) * tick_coeff), tick_exp};
        case round_mode::mid:
            return decimal64{std::llround(value / tick_coeff) * int64_t(tick_coeff), tick_exp};
        case round_mode::up:
            return decimal64{static_cast<long long>(std::ceil(value / tick_coeff) * tick_coeff), tick_exp};
        default:
            __builtin_unreachable();
    }

    return decimal64{0, 0};
}

[[nodiscard]] constexpr inline decimal64 decimal64::from_integer(std::unsigned_integral auto integer) noexcept {
    return decimal64{static_cast<unsigned long long>(integer), 0};
}

[[nodiscard]] constexpr inline decimal64 decimal64::from_integer(std::integral auto integer) noexcept {
    return decimal64{static_cast<long long>(integer), 0};
}

[[nodiscard]] constexpr inline std::optional<decimal64> decimal64::from_string(std::string_view str) {
    if (str.empty()) {
        return std::nullopt;
    }

    if (str == "inf") {
        return infinity();
    }

    if (str == "-inf") {
        return -infinity();
    }

    if (str == "nan") {
        return decimal64{DEC_NAN_MASK};
    }

    // remove leading whitespace
    while (!str.empty() && std::isspace(str.front())) {
        str.remove_prefix(1);
    }

    // remove trailing whitespace
    while (!str.empty() && std::isspace(str.back())) {
        str.remove_suffix(1);
    }

    int8_t sign = 1;
    if (str[0] == '-') {
        sign = -1;
        str.remove_prefix(1);
    }

    auto coeff = uint64_t{};
    auto exp = 0;

    // parse integral part
    constexpr auto max_pow_ten = pow10_int(DEC_MAX_EXPONENT - 1);
    while (!str.empty() && str[0] != '.' && str[0] != 'e') {
        if (!std::isdigit(str[0])) {
            return std::nullopt;
        }
        if (coeff < max_pow_ten) {
            coeff = coeff * 10 + (str[0] - '0');
        } else {
            ++exp;
        }
        str.remove_prefix(1);
    }

    // parse frac part
    if (!str.empty() && str[0] == '.') {
        str.remove_prefix(1);
        while (!str.empty() && str[0] != 'e') {
            if (!std::isdigit(str[0])) {
                return std::nullopt;
            }
            coeff = coeff * 10 + (str[0] - '0');
            --exp;
            str.remove_prefix(1);
        }
    }

    // parse exponent part
    if (!str.empty() && str[0] == 'e') {
        str.remove_prefix(1);
        auto exp_part = 0;
        auto result = std::from_chars(str.data(), str.data() + str.size(), exp_part);
        if (result.ec != std::errc{}) {
            return std::nullopt;
        }
        exp += exp_part;
    }

    return decimal64{sign, coeff, int16_t(exp)};
}

[[nodiscard]] constexpr inline double decimal64::to_double() const noexcept {
    if (is_nan()) [[unlikely]] {
        return std::nan("");
    }

    auto [sign, coeff, exp] = decompose();
    if (is_infinite()) [[unlikely]] {
        return sign * std::numeric_limits<double>::infinity();
    }

    return sign * static_cast<double>(coeff) * pow10_dbl(exp);
}

[[nodiscard]] constexpr inline int64_t decimal64::to_integer() const noexcept {
    if (is_nan() || is_infinite()) [[unlikely]] {
        return 0;
    }

    auto [sign, coeff, exp] = decompose();
    if (exp < 0) {
        return sign * static_cast<int64_t>(coeff / pow10_int(-exp));
    }

    return sign * static_cast<int64_t>(coeff * pow10_int(exp));
}

[[nodiscard]] constexpr inline std::string decimal64::to_string() const {
    if (is_infinite()) [[unlikely]] {
        return *this < decimal64::from_integer(0) ? "-inf" : "inf";
    }

    if (is_nan()) [[unlikely]] {
        return "nan";
    }

    auto [sign, coeff, exp] = decompose();

    // normalize exponent
    while (coeff % 10 == 0 && exp != 0) {
        coeff /= 10;
        ++exp;
    }

    // fractional part till leading zeros
    auto mul = int64_t{1};
    auto print_frac = int64_t{0};
    auto print_exp = 0;
    auto print_int = int64_t{0};

    while (exp < 0 && coeff) {
        print_frac += mul * (coeff % 10);
        coeff /= 10;
        mul *= 10;
        exp += 1;
    }

    // leading zeros of fractional part
    while (exp < 0) {
        print_exp -= 1;
        exp += 1;
    }

    // integral part
    mul = 1;
    while (coeff) {
        print_int += mul * (coeff % 10);
        coeff /= 10;
        mul *= 10;
    };

    while (exp > 0) {
        print_int *= 10;
        --exp;
    }

    print_int *= sign;

    // convert to string
    char buff[128];
    if (print_exp != 0) {
        sprintf(buff, "%" PRId64 ".%" PRId64 "e%d", print_int, print_frac, print_exp);
    } else if (print_frac != 0) {
        sprintf(buff, "%" PRId64 ".%" PRId64, print_int, print_frac);
    } else {
        sprintf(buff, "%" PRId64, print_int);
    }

    return buff;
}

[[nodiscard]] constexpr inline bool decimal64::is_infinite() const noexcept {
    return (_value & DEC_INF_MASK) == DEC_INF_MASK && !is_nan();
}

[[nodiscard]] constexpr inline bool decimal64::is_nan() const noexcept {
    return (_value & DEC_NAN_MASK) == DEC_NAN_MASK;
}

[[nodiscard]] constexpr inline bool decimal64::is_negative() const noexcept {
    return (_value & DEC_SIGN_MASK) > 1;
}

constexpr inline decimal64 &decimal64::operator+=(decimal64 other) noexcept {
    auto [lhs_sign, lhs_coeff, lhs_exp] = decompose();
    auto [rhs_sign, rhs_coeff, rhs_exp] = other.decompose();

    auto exp_diff = lhs_exp - rhs_exp;
    auto align_lhs = exp_diff > 0;
    auto align_rhs = exp_diff < 0;

    lhs_coeff *= pow10_int(exp_diff * align_lhs);
    rhs_coeff *= pow10_int(-exp_diff * align_rhs);

    auto res_exp = lhs_exp * (!align_lhs) + rhs_exp * align_lhs;
    auto res_coeff = lhs_sign * int64_t(lhs_coeff) + rhs_sign * int64_t(rhs_coeff);
    _value = decimal64{res_coeff, res_exp}._value;

    return *this;
}

constexpr inline decimal64 &decimal64::operator-=(decimal64 other) noexcept {
    return *this += (-other);
}

constexpr inline decimal64 &decimal64::operator*=(int64_t other) noexcept {
    auto [sign, coeff, exp] = decompose();
    _value = decimal64{sign * int64_t(coeff) * other, exp}._value;
    return *this;
}

[[nodiscard]] constexpr inline decimal64 decimal64::operator-() noexcept {
    _value ^= DEC_SIGN_MASK;
    return *this;
}

constexpr inline decimal64::decimal64(int8_t sign, uint64_t coeff, int16_t exponent) noexcept {
    if (coeff > DEC_MAX_COEFFICIENT || exponent < DEC_MIN_EXPONENT || exponent > DEC_MAX_EXPONENT) [[unlikely]] {
        std::tie(coeff, exponent) = normalize(coeff, exponent);
    }

    // Check if dec64 is inifity
    auto sign_bit = value_type{sign < 0};
    if (coeff > DEC_MAX_COEFFICIENT || exponent > DEC_MAX_EXPONENT) [[unlikely]] {
        _value = (sign_bit << DEC_SIGN_SHIFT) | infinity()._value;
        return;
    }

    // Check if dec64 trimms to zero
    if (exponent < DEC_MIN_EXPONENT) [[unlikely]] {
        coeff = 0;
        exponent = 0;
    }

    // Store the sign
    _value = sign_bit;

    // Apply exponent bias
    _value <<= 10;
    _value |= exponent + DEC_EXPONENT_BIAS;

    // Apply the coefficient
    // Note: we inentionally don't support coefficient > (1 << 54 - 1) for simplicity and performance reasons
    _value <<= 53;
    _value |= coeff & DEC_MAX_COEFFICIENT;
}

constexpr inline decimal64::decimal64(int64_t coeff, int exponent) noexcept
    : decimal64(int8_t((coeff >= 0) * 2 - 1), uint64_t(coeff * (coeff > 0) + (coeff < 0) * -coeff), int16_t(exponent)) {
}

constexpr inline decimal64::decimal64(value_type value) noexcept
    : _value(value) {
}

constexpr decimal64 decimal64::infinity() noexcept {
    return decimal64{DEC_INF_MASK};
}

constexpr void decimal64::normalize() noexcept {
    auto [sign, coeff, exp] = decompose();
    std::tie(coeff, exp) = normalize(coeff, exp);
    _value = decimal64{sign, coeff, exp}._value;
}

constexpr inline std::pair<uint64_t, int16_t> decimal64::normalize(uint64_t coeff, int exponent) const noexcept {
    // Normalize the coefficient
    while (coeff != 0 && coeff % 10 == 0 && exponent < DEC_MAX_EXPONENT) {
        coeff /= 10;
        exponent += 1;
    }

    // Normalize the exponent
    while ((exponent > DEC_MAX_EXPONENT || exponent < DEC_MIN_EXPONENT) && coeff * 10 <= DEC_MAX_COEFFICIENT) {
        coeff *= 10;
        exponent += exponent < 0;
    }

    return {coeff, int16_t(exponent)};
}

[[nodiscard]] constexpr inline std::tuple<int8_t, uint64_t, int16_t> decimal64::decompose() const noexcept {
    assert(!is_nan());

    auto sign = int8_t((_value >> DEC_SIGN_SHIFT) * -2 + 1);
    auto exp = int16_t((_value >> DEC_EXPONENT_SHIFT) & DEC_EXPONENT_MASK) - DEC_EXPONENT_BIAS;
    auto coeff = _value & DEC_MAX_COEFFICIENT;

    return {sign, coeff, exp};
}

[[nodiscard]] constexpr inline decimal64 operator+(decimal64 lhs, decimal64 rhs) noexcept {
    lhs += rhs;
    return lhs;
}

[[nodiscard]] constexpr inline decimal64 operator-(decimal64 lhs, decimal64 rhs) noexcept {
    lhs -= rhs;
    return lhs;
}

[[nodiscard]] constexpr inline decimal64 operator*(decimal64 lhs, int64_t rhs) noexcept {
    lhs *= rhs;
    return lhs;
}

[[nodiscard]] constexpr inline std::partial_ordering operator<=>(const decimal64 &lhs, const decimal64 &rhs) noexcept {
    if (lhs.is_nan() || rhs.is_nan()) [[unlikely]] {
        return std::partial_ordering::unordered;
    }

    if (lhs.is_infinite() || rhs.is_infinite()) [[unlikely]] {
        auto lhs_inf = (!lhs.is_negative() << 1) | lhs.is_infinite();
        auto rhs_inf = (!rhs.is_negative() << 1) | rhs.is_infinite();
        return lhs_inf <=> rhs_inf;
    }

    auto [lhs_sign, lhs_coeff, lhs_exp] = lhs.decompose();
    auto [rhs_sign, rhs_coeff, rhs_exp] = rhs.decompose();

    auto exp_diff = lhs_exp - rhs_exp;
    auto lhs_adjustment = exp_diff * (exp_diff > 0);
    auto rhs_adjustment = -exp_diff * (exp_diff <= 0);

    auto lhs_res = lhs_sign * double(lhs_coeff) * decimal64::pow10_dbl(lhs_adjustment);
    auto rhs_res = rhs_sign * double(rhs_coeff) * decimal64::pow10_dbl(rhs_adjustment);

    return lhs_res <=> rhs_res;
}

[[nodiscard]] constexpr inline bool operator==(const decimal64 &lhs, const decimal64 &rhs) noexcept {
    return lhs <=> rhs == std::partial_ordering::equivalent;
}

inline std::ostream &operator<<(std::ostream &os, decimal64 dec) {
    os << dec.to_string();
    return os;
}

inline std::istream &operator>>(std::istream &is, decimal64 &dec) {
    auto str = std::string{};
    is >> str;
    if (auto converted = decimal64::from_string(str)) {
        dec = *converted;
    } else {
        is.setstate(std::ios::failbit);
    }
    return is;
}

namespace detail {

template <char C>
consteval int parse_digit() {
    static_assert('0' <= C && C <= '9', "not a valid number");
    return C - '0';
}

template <char C, char... Rest>
consteval int parse_int() {
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
consteval void parse_num(std::tuple<int, uint64_t, int> &ctx, bool frac) {
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
consteval void parse(std::tuple<int, uint64_t, int> &ctx) {
    if constexpr (C == '-') {
        parse<Rest...>(ctx);
        std::get<0>(ctx) = -1;
    } else if constexpr (C == '0' && sizeof...(Rest)) {
        parse<Rest...>(ctx);
    } else {
        parse_num<C, Rest...>(ctx, false);
    }
}

template <char... C>
consteval std::tuple<int, uint64_t, int> parse() {
    auto ctx = std::tuple<int, uint64_t, int>{1, 0, 0};
    parse<C...>(ctx);
    return ctx;
}

} // namespace detail

template <char... C>
[[nodiscard]] decimal64 operator""_dd() {
    auto [sign, coeff, exponent] = detail::parse<C...>();
    return decimal64{int8_t(sign), coeff, int16_t(exponent)};
}

} // namespace messgen
