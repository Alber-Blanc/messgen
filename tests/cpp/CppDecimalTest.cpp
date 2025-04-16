#include <messgen/decimal.h>
#include <messgen/test/flat_struct_with_decimal.h>

#include <cmath>
#include <stdlib.h>
#include <float.h>

#include <iostream>
#include <iomanip>
#include <cstring>

#include <gtest/gtest.h>

using namespace messgen;

class CppDecimalTest : public ::testing::Test {};

TEST_F(CppDecimalTest, Construction) {
    // Default constructor
    auto d1 = decimal64{};
    EXPECT_EQ(d1, decimal64::from_integer(0));

    // Constructor from integer
    auto d2 = decimal64::from_integer(42);
    EXPECT_EQ(42, d2.to_integer());

    // Copy constructor
    auto d3 = decimal64{d2};
    EXPECT_EQ(d3, d2);

    // UDL
    auto d4 = 0.001_dd;
    auto d4_str = d4.to_string();
    EXPECT_EQ("0.1e-2", d4_str);
}

TEST_F(CppDecimalTest, Addition) {
    auto d1 = decimal64::from_double(10.5, 0.001_dd, RoundMode::mid);
    auto d2 = decimal64::from_double(20.25, 0.001_dd, RoundMode::mid);
    auto result = d1 + d2;
    auto expected = 30.75_dd;
    EXPECT_EQ(result, expected);

    // Addition with zero
    auto zero = decimal64::from_integer(0);
    EXPECT_EQ(d1 + zero, d1) << d1.to_string();

    // Addition with negative values
    auto negative = -15.75_dd;
    result = d1 + negative;
    expected = -5.25_dd;
    EXPECT_EQ(result, expected) << result.to_string();

    // Compound assignment
    d1 += d2;
    EXPECT_EQ(d1, 30.75_dd) << d1.to_string();
}

TEST_F(CppDecimalTest, Subtraction) {
    auto d1 = 30.75_dd;
    auto d2 = 10.5_dd;
    auto result = d1 - d2;
    auto expected = 20.25_dd;
    EXPECT_EQ(result, expected);

    // Compound assignment
    d1 -= d2;
    EXPECT_EQ(d1, 20.25_dd);
}

TEST_F(CppDecimalTest, Multiplication) {
    auto d1 = 5.5_dd;

    auto result = d1 * 2;
    auto expected = 11.0_dd;
    EXPECT_EQ(result, expected);

    result = d1 * -2;
    expected = -11_dd;
    EXPECT_EQ(result, expected);

    d1 *= 3;
    EXPECT_EQ(d1, 16.5_dd);
}

TEST_F(CppDecimalTest, Comparison) {
    auto d1 = 10.5_dd;
    auto d2 = 10.5_dd;
    auto d3 = 20.25_dd;

    // Equality
    EXPECT_TRUE(d1 == d2);
    EXPECT_FALSE(d1 == d3);

    // Inequality
    EXPECT_FALSE(d1 != d2);
    EXPECT_TRUE(d1 != d3);

    // Less than
    EXPECT_TRUE(d1 < d3);
    EXPECT_FALSE(d3 < d1);
    EXPECT_FALSE(d1 < d2);

    // Less than or equal
    EXPECT_TRUE(d1 <= d3);
    EXPECT_TRUE(d1 <= d2);
    EXPECT_FALSE(d3 <= d1);

    // Greater than
    EXPECT_TRUE(d3 > d1);
    EXPECT_FALSE(d1 > d3);
    EXPECT_FALSE(d1 > d2);

    // Greater than or equal
    EXPECT_TRUE(d3 >= d1);
    EXPECT_TRUE(d1 >= d2);
    EXPECT_FALSE(d1 >= d3);
}

TEST_F(CppDecimalTest, Conversions) {
    // From int
    auto from_int = decimal64::from_integer(42);
    EXPECT_EQ(from_int, 42.0_dd);

    // From double
    auto from_double = decimal64::from_double(42.5, 0.001_dd, RoundMode::mid);
    EXPECT_EQ(from_double, 42.5_dd);

    // To int
    int64_t to_int = from_int.to_integer();
    EXPECT_EQ(to_int, 42);

    // To double
    double to_double = from_double.to_double();
    EXPECT_DOUBLE_EQ(to_double, 42.5);

    // To string
    EXPECT_EQ(from_double.to_string(), "42.5");
}

TEST_F(CppDecimalTest, Precision) {
    // Test decimal precision
    auto precise_value = decimal64::from_double(0.1234567890123456, 0.0000001_dd, RoundMode::mid);
    EXPECT_EQ(precise_value.to_string(), "0.1234568");

    // Test with very large numbers
    auto large_value = decimal64::from_double(9.999999999999999e+10, 0.001_dd, RoundMode::mid);
    EXPECT_GT(large_value, decimal64::from_integer(0)) << large_value.to_string();

    // Test with very small numbers
    auto small_value = decimal64::from_double(9.999999999, 0.001_dd, RoundMode::mid);
    EXPECT_GT(small_value, decimal64::from_integer(0)) << small_value.to_string();
}

TEST_F(CppDecimalTest, RoundDownPositive) {
    EXPECT_EQ(10.0_dd, decimal64::from_double(10.0, 1.0_dd, RoundMode::down));
    EXPECT_EQ(10.0_dd, decimal64::from_double(10.4, 1.0_dd, RoundMode::down));
    EXPECT_EQ(10.0_dd, decimal64::from_double(10.5, 1.0_dd, RoundMode::down));
    EXPECT_EQ(10.0_dd, decimal64::from_double(10.6, 1.0_dd, RoundMode::down));
}

// Tests for RoundMode::down with negative values
TEST_F(CppDecimalTest, RoundDownNegative) {
    EXPECT_EQ(-10.0_dd, decimal64::from_double(-10.0, 1.0_dd, RoundMode::down));
    EXPECT_EQ(-11.0_dd, decimal64::from_double(-10.6, 1.0_dd, RoundMode::down));
    EXPECT_EQ(-11.0_dd, decimal64::from_double(-10.5, 1.0_dd, RoundMode::down));
    EXPECT_EQ(-11.0_dd, decimal64::from_double(-10.4, 1.0_dd, RoundMode::down));
}

// Tests for RoundMode::mid with positive values
TEST_F(CppDecimalTest, RoundMidPositive) {
    EXPECT_EQ(10.0_dd, decimal64::from_double(10.0, 1.0_dd, RoundMode::mid));
    EXPECT_EQ(10.0_dd, decimal64::from_double(10.4, 1.0_dd, RoundMode::mid));
    EXPECT_EQ(11.0_dd, decimal64::from_double(10.5, 1.0_dd, RoundMode::mid));
    EXPECT_EQ(11.0_dd, decimal64::from_double(10.6, 1.0_dd, RoundMode::mid));
}

// Tests for RoundMode::mid with negative values
TEST_F(CppDecimalTest, RoundMidNegative) {
    EXPECT_EQ(-10.0_dd, decimal64::from_double(-10.0, 1.0_dd, RoundMode::mid));
    EXPECT_EQ(-11.0_dd, decimal64::from_double(-10.6, 1.0_dd, RoundMode::mid));
    EXPECT_EQ(-11.0_dd, decimal64::from_double(-10.5, 1.0_dd, RoundMode::mid));
    EXPECT_EQ(-10.0_dd, decimal64::from_double(-10.4, 1.0_dd, RoundMode::mid));
}

// Tests for RoundMode::up with positive values
TEST_F(CppDecimalTest, RoundUpPositive) {
    EXPECT_EQ(10.0_dd, decimal64::from_double(10.0, 1.0_dd, RoundMode::up));
    EXPECT_EQ(11.0_dd, decimal64::from_double(10.4, 1.0_dd, RoundMode::up));
    EXPECT_EQ(11.0_dd, decimal64::from_double(10.5, 1.0_dd, RoundMode::up));
    EXPECT_EQ(11.0_dd, decimal64::from_double(10.6, 1.0_dd, RoundMode::up));
}

// Tests for RoundMode::up with negative values
TEST_F(CppDecimalTest, RoundUpNegative) {
    EXPECT_EQ(-10.0_dd, decimal64::from_double(-10.0, 1.0_dd, RoundMode::up));
    EXPECT_EQ(-10.0_dd, decimal64::from_double(-10.6, 1.0_dd, RoundMode::up));
    EXPECT_EQ(-10.0_dd, decimal64::from_double(-10.5, 1.0_dd, RoundMode::up));
    EXPECT_EQ(-10.0_dd, decimal64::from_double(-10.4, 1.0_dd, RoundMode::up));
}

// Tests with non-integer ticks
TEST_F(CppDecimalTest, NonIntegerTick) {
    // Positive values with 0.5 tick
    EXPECT_EQ(10.0_dd, decimal64::from_double(10.25, 0.5_dd, RoundMode::down));
    EXPECT_EQ(10.0_dd, decimal64::from_double(10.249999, 0.5_dd, RoundMode::mid));
    EXPECT_EQ(10.5_dd, decimal64::from_double(10.25, 0.5_dd, RoundMode::mid));
    EXPECT_EQ(10.5_dd, decimal64::from_double(10.25, 0.5_dd, RoundMode::up));

    // Negative values with 0.5 tick
    EXPECT_EQ(-10.5_dd, decimal64::from_double(-10.25, 0.5_dd, RoundMode::down));
    EXPECT_EQ(-10.5_dd, decimal64::from_double(-10.25, 0.5_dd, RoundMode::mid));
    EXPECT_EQ(-10.0_dd, decimal64::from_double(-10.249999, 0.5_dd, RoundMode::mid));
    EXPECT_EQ(-10.0_dd, decimal64::from_double(-10.25, 0.5_dd, RoundMode::up));
}

// Tests with extreme values
TEST_F(CppDecimalTest, ExtremeValues) {
    // Very small values
    EXPECT_EQ(0.0000012_dd, decimal64::from_double(0.0000012345, 0.0000001_dd, RoundMode::down));
    EXPECT_EQ(0.0000012_dd, decimal64::from_double(0.0000012345, 0.0000001_dd, RoundMode::mid));
    EXPECT_EQ(0.0000013_dd, decimal64::from_double(0.0000012345, 0.0000001_dd, RoundMode::up));

    // Very large values
    EXPECT_EQ(9.8700e10_dd, decimal64::from_double(9.876e10, 100000000.0_dd, RoundMode::down));
    EXPECT_EQ(9.8800e10_dd, decimal64::from_double(9.876e10, 100000000.0_dd, RoundMode::mid));
    EXPECT_EQ(9.8800e10_dd, decimal64::from_double(9.876e10, 100000000.0_dd, RoundMode::up));
}

// Tests with different combinations of exponents
TEST_F(CppDecimalTest, DifferentExponents) {
    // Value has higher precision than tick
    EXPECT_EQ(123.45_dd, decimal64::from_double(123.456, 0.01_dd, RoundMode::down));
    EXPECT_EQ(123.46_dd, decimal64::from_double(123.456, 0.01_dd, RoundMode::mid));
    EXPECT_EQ(123.46_dd, decimal64::from_double(123.456, 0.01_dd, RoundMode::up));

    // Tick has higher precision than value
    EXPECT_EQ(123000.0_dd, decimal64::from_double(123000.0, 100.0_dd, RoundMode::down));
    EXPECT_EQ(123000.0_dd, decimal64::from_double(123000.0, 100.0_dd, RoundMode::mid));
    EXPECT_EQ(123000.0_dd, decimal64::from_double(123000.0, 100.0_dd, RoundMode::up));
}

// Tests with zero and near-zero values
TEST_F(CppDecimalTest, ZeroValues) {
    // Exactly zero
    EXPECT_EQ(0.0_dd, decimal64::from_double(0.0, 0.1_dd, RoundMode::down));
    EXPECT_EQ(0.0_dd, decimal64::from_double(0.0, 0.1_dd, RoundMode::mid));
    EXPECT_EQ(0.0_dd, decimal64::from_double(0.0, 0.1_dd, RoundMode::up));

    // Near-zero values
    EXPECT_EQ(0.0_dd, decimal64::from_double(0.01, 0.1_dd, RoundMode::down));
    EXPECT_EQ(0.0_dd, decimal64::from_double(0.01, 0.1_dd, RoundMode::mid));
    EXPECT_EQ(0.1_dd, decimal64::from_double(0.01, 0.1_dd, RoundMode::up));

    EXPECT_EQ(-0.1_dd, decimal64::from_double(-0.01, 0.1_dd, RoundMode::down));
    EXPECT_EQ(0.0_dd, decimal64::from_double(-0.01, 0.1_dd, RoundMode::mid));
    EXPECT_EQ(0.0_dd, decimal64::from_double(-0.01, 0.1_dd, RoundMode::up));
}

TEST_F(CppDecimalTest, FromString) {
    // Basic integer values
    EXPECT_EQ(0_dd, decimal64::from_string("0"));
    EXPECT_EQ(123_dd, decimal64::from_string("123"));
    EXPECT_EQ(-123_dd, decimal64::from_string("-123"));

    // Basic decimal values
    EXPECT_EQ(123.456_dd, decimal64::from_string("123.456"));
    EXPECT_EQ(-123.456_dd, decimal64::from_string("-123.456"));
    EXPECT_EQ(0.5_dd, decimal64::from_string("0.5"));

    // Scientific notation
    EXPECT_EQ(0.05_dd, decimal64::from_string("0.5e-1"));
    EXPECT_EQ(0.005_dd, decimal64::from_string("0.5e-2"));
    EXPECT_EQ(5_dd, decimal64::from_string("0.5e1"));
    EXPECT_EQ(50_dd, decimal64::from_string("0.5e2"));
    EXPECT_EQ(1.234e10_dd, decimal64::from_string("1.234e10"));
    EXPECT_EQ(1.234e-10_dd, decimal64::from_string("1.234e-10"));

    // Whitespace handling
    EXPECT_EQ(123_dd, decimal64::from_string("  123  "));
    EXPECT_EQ(123.456_dd, decimal64::from_string("  123.456  "));

    // Leading zeros
    EXPECT_EQ(0.123_dd, decimal64::from_string("0.123"));
    EXPECT_EQ(0.123_dd, decimal64::from_string("00.123"));
    EXPECT_EQ(123_dd, decimal64::from_string("000123"));

    // Trailing zeros
    EXPECT_EQ(123_dd, decimal64::from_string("123.0"));
    EXPECT_EQ(123_dd, decimal64::from_string("123.00"));
    EXPECT_EQ(123.4_dd, decimal64::from_string("123.40"));

    // Edge cases
    EXPECT_EQ(0_dd, decimal64::from_string("0.0"));
    EXPECT_EQ(0_dd, decimal64::from_string("-0.0"));
    EXPECT_EQ(0.000123_dd, decimal64::from_string("0.123e-3"));

    // Extreme values
    auto very_large = decimal64::from_string("9.99e30");
    EXPECT_GT(very_large, decimal64::from_integer(0));

    auto very_small = decimal64::from_string("9.99e-30");
    EXPECT_GT(very_small, decimal64::from_integer(0));

    // Infinity
    // EXPECT_EQ(decimal64{}, decimal64::from_string("Inifinty"));
    // EXPECT_EQ(decimal64{}, decimal64::from_string("-Inifinty"));

    // Invalid strings should return empty decimal
    EXPECT_EQ(decimal64{}, decimal64::from_string(""));
    EXPECT_EQ(decimal64{}, decimal64::from_string("abc"));
    EXPECT_EQ(decimal64{}, decimal64::from_string("123.456.789"));
    EXPECT_EQ(decimal64{}, decimal64::from_string("123e"));
    EXPECT_EQ(decimal64{}, decimal64::from_string("e10"));
}

// Consistency checks
TEST_F(CppDecimalTest, ConsistencyCheck) {
    // Same value with different scale representations should be proportional
    auto result1 = decimal64::from_double(1.5, 1.0_dd, RoundMode::mid);
    auto result2 = decimal64::from_double(15.0, 10.0_dd, RoundMode::mid);

    EXPECT_DOUBLE_EQ(result1.to_double() * 10.0, result2.to_double());
}

TEST_F(CppDecimalTest, StringConversion) {
    // Basic integer values
    EXPECT_EQ("0", decimal64::from_integer(0).to_string());
    EXPECT_EQ("123", decimal64::from_integer(123).to_string());
    EXPECT_EQ("-123", decimal64::from_integer(-123).to_string());

    // Basic decimal values
    EXPECT_EQ("123.456", (123.456_dd).to_string());
    EXPECT_EQ("-123.456", (-123.456_dd).to_string());
    EXPECT_EQ("0.5", (0.5_dd).to_string());
    EXPECT_EQ("0.5e-1", (0.05_dd).to_string());
    EXPECT_EQ("0.5e-2", (0.005_dd).to_string());

    // Trailing zeros handling
    EXPECT_EQ("123.4", (123.40_dd).to_string());
    EXPECT_EQ("123", (123.0_dd).to_string());

    // Scientific notation
    auto large_value = decimal64::from_double(1.234e10, 0.001_dd, RoundMode::mid);
    EXPECT_EQ("12340000000", large_value.to_string());

    auto small_value = decimal64::from_double(1.234e-10, 0.000000000000001_dd, RoundMode::mid);
    EXPECT_EQ("0.1234e-9", small_value.to_string());

    // Extreme values
    auto very_large = decimal64::from_double(9.99e30, 1.0_dd, RoundMode::mid);
    EXPECT_FALSE(very_large.to_string().empty());

    auto very_small = decimal64::from_double(9.99e-30, 1.0e-15_dd, RoundMode::mid);
    EXPECT_FALSE(very_small.to_string().empty());

    // Special cases
    auto rounded_up = decimal64::from_double(9.9999, 0.001_dd, RoundMode::mid);
    EXPECT_EQ("10", rounded_up.to_string());

    auto precise = decimal64::from_double(0.1234567890123456, 0.0000001_dd, RoundMode::mid);
    EXPECT_EQ("0.1234568", precise.to_string());

    // Edge cases
    EXPECT_EQ("0", decimal64::from_double(0.000000, 0.1_dd, RoundMode::mid).to_string());
    EXPECT_EQ("0", (-0.0_dd).to_string());
    EXPECT_EQ("0.123e-3", (0.000123_dd).to_string());
}

TEST_F(CppDecimalTest, StreamOperator) {
    auto sstream = std::stringstream{};

    auto write = 12.345_dd;
    sstream << write;

    auto read = decimal64{};
    sstream >> read;

    EXPECT_EQ(read, write);
}

TEST_F(CppDecimalTest, MakeDecimal) {
    auto decimal_to_hex = [](auto value) {
        std::stringstream ss;
        ss << "0x" << std::hex << std::setfill('0') << std::setw(16) << *reinterpret_cast<uint64_t *>(&value);
        return ss.str();
    };

    // Basic Values
    EXPECT_EQ("0x308462d53c8abac0", decimal_to_hex(std::decimal::make_decimal64(1234567890123456LL, -10)));
    EXPECT_EQ("0x31c0000000000001", decimal_to_hex(std::decimal::make_decimal64(1LL, 0)));
    EXPECT_EQ("0x31c000000000007b", decimal_to_hex(std::decimal::make_decimal64(123LL, 0)));
    EXPECT_EQ("0x318000000000007b", decimal_to_hex(std::decimal::make_decimal64(123LL, -2)));
    EXPECT_EQ("0x320000000000007b", decimal_to_hex(std::decimal::make_decimal64(123LL, 2)));
    EXPECT_EQ("0xb1c000000000007b", decimal_to_hex(std::decimal::make_decimal64(-123LL, 0)));
    EXPECT_EQ("0xb1a000000000007b", decimal_to_hex(std::decimal::make_decimal64(-123LL, -1)));

    // Zero Values
    EXPECT_EQ("0x31c0000000000000", decimal_to_hex(std::decimal::make_decimal64(0LL, 0)));
    EXPECT_EQ("0x3e40000000000000", decimal_to_hex(std::decimal::make_decimal64(0LL, 100)));
    EXPECT_EQ("0x2540000000000000", decimal_to_hex(std::decimal::make_decimal64(0LL, -100)));

    // Precision Edge Cases
    EXPECT_EQ("0x31c000000098967f", decimal_to_hex(std::decimal::make_decimal64(9999999LL, 0)));
    EXPECT_EQ("0x2e40000000000001", decimal_to_hex(std::decimal::make_decimal64(1LL, -28)));
    EXPECT_EQ("0x3540000000000009", decimal_to_hex(std::decimal::make_decimal64(9LL, 28)));
    EXPECT_EQ("0x2fe38d7ea4c67fff", decimal_to_hex(std::decimal::make_decimal64(999999999999999LL, -15)));

    // Rounding Cases
    EXPECT_EQ("0x31a0000000000005", decimal_to_hex(std::decimal::make_decimal64(5LL, -1)));
    EXPECT_EQ("0x318000000000000f", decimal_to_hex(std::decimal::make_decimal64(15LL, -2)));
    EXPECT_EQ("0x316000000000007d", decimal_to_hex(std::decimal::make_decimal64(125LL, -3)));
    EXPECT_EQ("0x316000000000007e", decimal_to_hex(std::decimal::make_decimal64(126LL, -3)));

    // Operation Testing Values
    EXPECT_EQ("0x3d0000000098967f", decimal_to_hex(std::decimal::make_decimal64(9999999LL, 90)));
    EXPECT_EQ("0x256000000098967f", decimal_to_hex(std::decimal::make_decimal64(9999999LL, -99)));
    EXPECT_EQ("0x31a0000000000005", decimal_to_hex(std::decimal::make_decimal64(5LL, -1)));
    EXPECT_EQ("0x3100000000000001", decimal_to_hex(std::decimal::make_decimal64(1LL, -6)));

    // Boundary Cases
    EXPECT_EQ("0x6c7386f26fc0ffff", decimal_to_hex(std::decimal::make_decimal64(9999999999999999LL, 0)));
    EXPECT_EQ("0x77fb86f26fc0ffff", decimal_to_hex(std::decimal::make_decimal64(9999999999999999LL, 369)));
    EXPECT_EQ("0x7800000000000000", decimal_to_hex(std::decimal::make_decimal64(999999999999999999LL, 369)));
    EXPECT_EQ("0x7800000000000000", decimal_to_hex(std::decimal::make_decimal64(9999999999999999LL, 370)));
    EXPECT_EQ("0xf800000000000000", decimal_to_hex(std::decimal::make_decimal64(-9999999999999999LL, 370)));
    EXPECT_EQ("0x600386f26fc0ffff", decimal_to_hex(std::decimal::make_decimal64(9999999999999999LL, -398)));
    EXPECT_EQ("0xe00386f26fc0ffff", decimal_to_hex(std::decimal::make_decimal64(-9999999999999999LL, -398)));
    EXPECT_EQ("0x0000000000000000", decimal_to_hex(std::decimal::make_decimal64(9999999999999999LL, -399)));
    EXPECT_EQ("0x8000000000000000", decimal_to_hex(std::decimal::make_decimal64(-9999999999999999LL, -399)));
    EXPECT_EQ("0x5fe05af3107a4000", decimal_to_hex(std::decimal::make_decimal64(1LL, 383)));
    EXPECT_EQ("0x5fe38d7ea4c68000", decimal_to_hex(std::decimal::make_decimal64(1LL, 384)));

    // Special Values (implementation-dependent)
    EXPECT_EQ("0x7800000000000000", decimal_to_hex(std::decimal::make_decimal64(1LL, 999)));
    EXPECT_EQ("0xf800000000000000", decimal_to_hex(std::decimal::make_decimal64(-1LL, 999)));
    EXPECT_EQ("0x0000000000000000", decimal_to_hex(std::decimal::make_decimal64(0LL, -999)));
}

TEST_F(CppDecimalTest, GeneratedFlatType) {
    using namespace messgen::test;

    static_assert(flat_struct_with_decimal::IS_FLAT);

    auto expected = flat_struct_with_decimal{
        .int_field = 10,
        .dec_field = messgen::decimal64::from_double(12.2, 0.001_dd, messgen::RoundMode::mid),
        .float_field = 12.3,
    };

    auto buff = std::vector<uint8_t>(expected.serialized_size());
    expected.serialize(buff.data());

    auto actual = flat_struct_with_decimal{};
    actual.deserialize(buff.data());

    EXPECT_EQ(expected, actual);
}