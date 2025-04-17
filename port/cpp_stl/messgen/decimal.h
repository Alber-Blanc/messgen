#pragma once

#include <decimal/decimal>

#include <array>
#include <cassert>
#include <charconv>
#include <cmath>
#include <cstdint>
#include <ios>
#include <istream>
#include <optional>
#include <string>

namespace messgen {

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
    constexpr decimal64() = default;

    /// @brief Creates a decimal64 from a double value according to specified tick size and rounding mode
    ///
    /// @param value The double value to convert
    /// @param tick The minimum representable increment (tick size)
    /// @param roundMode The rounding mode to apply during conversion
    /// @pre tick must be finite and greater than zero
    /// @pre value must be finite
    /// @return decimal64 The resulting decimal value
    [[nodiscard]] static decimal64 from_double(double value, decimal64 tick, round_mode) noexcept;

    /// @brief Creates a decimal64 from an unsigned integer value
    ///
    /// @tparam T Unsigned integral type
    /// @param value The unsigned integer value
    /// @return decimal64 The resulting decimal value
    [[nodiscard]] static decimal64 from_integer(std::unsigned_integral auto value) noexcept;

    /// @brief Creates a decimal64 from a signed integer value
    ///
    /// @tparam T Signed integral type
    /// @param value The signed integer value
    /// @return decimal64 The resulting decimal value
    [[nodiscard]] static decimal64 from_integer(std::integral auto value) noexcept;

    /// @brief Creates a decimal64 from a string representation
    ///
    /// @param value The string to parse
    /// @return std::optional<decimal64> The resulting decimal value, or any empty optional if parsing fails
    [[nodiscard]] static std::optional<decimal64> from_string(std::string_view value);

    /// @brief Converts to double representation
    ///
    /// @return double The value as a double
    [[nodiscard]] double to_double() const noexcept;

    /// @brief Converts to integer representation
    ///
    /// @return int64_t The value as an integer
    [[nodiscard]] int64_t to_integer() const noexcept;

    /// @brief Converts to string representation
    ///
    /// @return std::string The value as a string
    [[nodiscard]] std::string to_string() const;

    /// @brief Checks if this decimal represents infinity
    ///
    /// @return bool True if the value is positive or negative infinity, false otherwise
    [[nodiscard]] bool is_infinite() const noexcept;

    /// @brief Checks if this decimal represents NaN (Not a Number)
    ///
    /// @return bool True if the value is NaN, false otherwise
    [[nodiscard]] bool is_nan() const noexcept;

    /// @brief Adds another decimal64 to this one
    ///
    /// @param other The value to add
    /// @return decimal64& Reference to this object
    decimal64 &operator+=(decimal64 other) noexcept;

    /// @brief Subtracts another decimal64 from this one
    ///
    /// @param other The value to subtract
    /// @return decimal64& Reference to this object
    decimal64 &operator-=(decimal64 other) noexcept;

    /// @brief Multiplies this value by an integer
    ///
    /// @param factor The integer multiplier
    /// @return decimal64& Reference to this object
    decimal64 &operator*=(int64_t factor) noexcept;

    /// @brief Returns the negation of this value
    ///
    /// @return decimal64 The negated value
    decimal64 operator-() const noexcept;

    /// @brief Adds two decimal64 values
    ///
    /// @param lhs The left-hand operand
    /// @param rhs The right-hand operand
    /// @return decimal64 The sum of the operands
    friend decimal64 operator+(decimal64 lhs, decimal64 rhs) noexcept;

    /// @brief Subtracts one decimal64 from another
    ///
    /// @param lhs The left-hand operand
    /// @param rhs The right-hand operand
    /// @return decimal64 The difference between the operands
    friend decimal64 operator-(decimal64 lhs, decimal64 rhs) noexcept;

    /// @brief Multiplies a decimal64 by an integer
    ///
    /// @param decimal The decimal value
    /// @param factor The integer multiplier
    /// @return decimal64 The product
    friend decimal64 operator*(decimal64 decimal, int64_t factor) noexcept;

    /// @brief Compares two decimal64 values
    ///
    /// @param lhs The left-hand operand
    /// @param rhs The right-hand operand
    /// @return std::strong_ordering The ordering relation between the operands
    friend std::strong_ordering operator<=>(const decimal64 &lhs, const decimal64 &rhs) noexcept;

    /// @brief Tests equality between two decimal64 values
    ///
    /// @param lhs The left-hand operand
    /// @param rhs The right-hand operand
    /// @return bool True if the operands are equal, false otherwise
    friend bool operator==(const decimal64 &lhs, const decimal64 &rhs) noexcept;

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

private:
    using ValueType = std::decimal::decimal64;

    template <char... C>
    friend decimal64 operator""_dd();

    explicit decimal64(long long coeff, int exponent);
    explicit decimal64(double value);
    explicit decimal64(ValueType value);

    /// @brief Decomposes the decimal into its components
    ///
    /// @return A tuple containing (sign, coefficient, exponent)
    [[nodiscard]] std::tuple<int8_t, uint64_t, int16_t> decompose() const noexcept;

    /// @brief Computes 10 raised to the specified power efficiently.
    ///
    /// This function calculates the value of 10^exp at compile time.
    /// The result is guaranteed to be accurate within the limits of
    /// double precision.
    ///
    /// @param exp The exponent value to raise 10 to
    /// @pre exp must be in the range [-16, 16]
    /// @return The value of 10^exp as a double
    [[nodiscard]] static double tick_pow10(int exp);

    /// The internal decimal value
    ValueType _value = 0;
};

[[nodiscard]] inline decimal64 decimal64::from_double(double value, decimal64 tick, round_mode round_mode) noexcept {
    assert(!tick.is_nan());
    assert(!tick.is_infinite());
    assert(tick > decimal64::from_integer(0));
    assert(std::isfinite(value));

    auto [tick_sign, tick_coeff, tick_exp] = tick.decompose();
    value *= tick_pow10(-tick_exp);
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

[[nodiscard]] inline decimal64 decimal64::from_integer(std::unsigned_integral auto integer) noexcept {
    return decimal64{std::decimal::make_decimal64(static_cast<unsigned long long>(integer), 0)};
}

[[nodiscard]] inline decimal64 decimal64::from_integer(std::integral auto integer) noexcept {
    return decimal64{std::decimal::make_decimal64(static_cast<long long>(integer), 0)};
}

[[nodiscard]] inline std::optional<decimal64> decimal64::from_string(std::string_view str) {
    if (str.empty()) {
        return std::nullopt;
    }

    if (str == "inf") {
        return decimal64{1LL, 10000000}; // NOLINT
    }

    if (str == "-inf") {
        return decimal64{-1LL, 10000000}; // NOLINT
    }

    if (str == "nan") {
        return decimal64{std::nan("1")};
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
            return std::nullopt;
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
                return std::nullopt;
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
            return std::nullopt;
        }
        exponent += exponent_part;
    }

    return decimal64{sign * coeff, exponent};
}

[[nodiscard]] inline double decimal64::to_double() const noexcept {
    return std::decimal::decimal64_to_double(_value);
}

[[nodiscard]] inline int64_t decimal64::to_integer() const noexcept {
    return std::decimal::decimal_to_long_long(_value);
}

[[nodiscard]] inline std::string decimal64::to_string() const {
    if (is_infinite()) {
        return *this < decimal64::from_integer(0) ? "-inf" : "inf";
    }

    if (is_nan()) {
        return "nan";
    }

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

[[nodiscard]] inline bool decimal64::is_infinite() const noexcept {
    constexpr auto plus_infinity = 0x7800000000000000ULL;
    constexpr auto minus_infinity = 0xf800000000000000ULL;
    return (reinterpret_cast<const unsigned long long &>(_value) == plus_infinity) || (reinterpret_cast<const unsigned long long &>(_value) == minus_infinity);
}

[[nodiscard]] inline bool decimal64::is_nan() const noexcept {
    constexpr auto qnan = 0x7c00000000000000ULL;
    return reinterpret_cast<const unsigned long long &>(_value) == qnan;
}

inline decimal64 &decimal64::operator+=(decimal64 other) noexcept {
    _value += other._value;
    return *this;
}

inline decimal64 &decimal64::operator-=(decimal64 other) noexcept {
    _value -= other._value;
    return *this;
}

inline decimal64 &decimal64::operator*=(int64_t other) noexcept {
    _value *= other;
    return *this;
}

[[nodiscard]] inline decimal64 decimal64::operator-() const noexcept {
    return decimal64(-_value);
}

inline decimal64::decimal64(long long coeff, int exponent)
    : _value(std::decimal::make_decimal64(static_cast<long long>(coeff), exponent)) {
}

inline decimal64::decimal64(double value)
    : _value(value) {
}

inline decimal64::decimal64(ValueType value)
    : _value(value) {
}

[[nodiscard]] inline std::tuple<int8_t, uint64_t, int16_t> decimal64::decompose() const noexcept {
    assert(!is_nan());
    assert(!is_infinite());

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

[[nodiscard]] inline double decimal64::tick_pow10(int exp) {
    constexpr int tick_exponent_max = 16;
    constexpr int tick_exponent_min = -tick_exponent_max;

    assert(exp >= tick_exponent_min);
    assert(exp <= tick_exponent_max);

    static constexpr auto TICK_POW10 = []() {
        constexpr auto size = tick_exponent_max - tick_exponent_min + 1;

        auto res = std::array<double, size>{1.0};
        uint64_t pow10 = 1;
        for (int i = tick_exponent_max; i < size; ++i) {
            res[i] = double(pow10);
            pow10 *= 10; // NOLINT
        }
        for (int i = 0; i < tick_exponent_max; ++i) {
            res[i] /= res[size - i - 1];
            pow10 *= 10; // NOLINT
        }
        return res;
    }();

    return TICK_POW10[exp + tick_exponent_max];
}

[[nodiscard]] inline decimal64 operator+(decimal64 lhs, decimal64 rhs) noexcept {
    lhs += rhs;
    return lhs;
}

[[nodiscard]] inline decimal64 operator-(decimal64 lhs, decimal64 rhs) noexcept {
    lhs -= rhs;
    return lhs;
}

[[nodiscard]] inline decimal64 operator*(decimal64 lhs, int64_t rhs) noexcept {
    lhs *= rhs;
    return lhs;
}

inline std::strong_ordering operator<=>(const decimal64 &lhs, const decimal64 &rhs) noexcept {
    if (lhs._value < rhs._value)
        return std::strong_ordering::less;
    if (lhs._value > rhs._value)
        return std::strong_ordering::greater;
    return std::strong_ordering::equal;
}

inline bool operator==(const decimal64 &lhs, const decimal64 &rhs) noexcept {
    return lhs._value == rhs._value;
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
    return decimal64{std::decimal::make_decimal64(sign * static_cast<long long>(coeff), exponent)};
}

} // namespace messgen
