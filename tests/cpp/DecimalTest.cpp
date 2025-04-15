#include <messgen/decimal.h>

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
    auto d1 = Decimal64{};
    EXPECT_EQ(d1, Decimal64::from_integer(0));

    // Constructor from integer
    auto d2 = Decimal64::from_integer(42);
    EXPECT_EQ(42, d2.to_integer());

    // Copy constructor
    auto d3 = Decimal64{d2};
    EXPECT_EQ(d3, d2);
}

TEST_F(CppDecimalTest, Addition) {
    auto d1 = Decimal64::from_double(10.5, 0.001_dd, RoundMode::mid);
    auto d2 = Decimal64::from_double(20.25, 0.001_dd, RoundMode::mid);
    auto result = d1 + d2;
    auto expected = 30.75_dd;
    EXPECT_EQ(result, expected);

    // Addition with zero
    auto zero = Decimal64::from_integer(0);
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
    std::decimal::decimal64 d1(30.75);
    std::decimal::decimal64 d2(10.5);
    std::decimal::decimal64 result = d1 - d2;
    std::decimal::decimal64 expected(20.25);
    EXPECT_EQ(result, expected);

    // Compound assignment
    d1 -= d2;
    EXPECT_EQ(d1, std::decimal::decimal64(20.25));
}

TEST_F(CppDecimalTest, Multiplication) {
    std::decimal::decimal64 d1(5.5);
    std::decimal::decimal64 d2(2.0);
    std::decimal::decimal64 result = d1 * d2;
    std::decimal::decimal64 expected(11.0);
    EXPECT_EQ(result, expected);

    // Multiplication with negative values
    std::decimal::decimal64 negative(-2.5);
    result = d1 * negative;
    expected = std::decimal::decimal64(-13.75);
    EXPECT_EQ(result, expected);

    // Compound assignment
    d1 *= d2;
    EXPECT_EQ(d1, std::decimal::decimal64(11.0));
}

TEST_F(CppDecimalTest, Division) {
    std::decimal::decimal64 d1(10.0);
    std::decimal::decimal64 d2(2.5);
    std::decimal::decimal64 result = d1 / d2;
    std::decimal::decimal64 expected(4.0);
    EXPECT_EQ(result, expected);

    // Division with negative values
    std::decimal::decimal64 negative(-5.0);
    result = d1 / negative;
    expected = std::decimal::decimal64(-2.0);
    EXPECT_EQ(result, expected);

    // Compound assignment
    d1 /= d2;
    EXPECT_EQ(d1, std::decimal::decimal64(4.0));
}

TEST_F(CppDecimalTest, Comparison) {
    std::decimal::decimal64 d1(10.5);
    std::decimal::decimal64 d2(10.5);
    std::decimal::decimal64 d3(20.25);

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
    std::decimal::decimal64 from_int(42);
    EXPECT_EQ(from_int, std::decimal::decimal64(42.0));

    // From double
    std::decimal::decimal64 from_double(42.5);
    EXPECT_EQ(from_double, std::decimal::decimal64(42.5));

    // To int
    int64_t to_int = std::decimal::decimal_to_long_long(from_int);
    EXPECT_EQ(to_int, 42);

    // To double
    double to_double = decimal64_to_double(from_double);
    EXPECT_DOUBLE_EQ(to_double, 42.5);

    // To string
    std::ostringstream oss;
    oss << std::decimal::decimal_to_double(from_double);
    EXPECT_EQ(oss.str(), "42.5");
}

TEST_F(CppDecimalTest, Precision) {
    // Test decimal precision
    std::decimal::decimal64 precise_value(0.1234567890123456);
    std::ostringstream oss;
    oss << decimal_to_double(precise_value);
    EXPECT_EQ(oss.str(), "0.123457");

    // Test with very large numbers
    std::decimal::decimal64 large_value(9.999999999999999e+384);
    EXPECT_GT(large_value, std::decimal::decimal64(0));

    // Test with very small numbers
    std::decimal::decimal64 small_value(1e-38);
    EXPECT_GT(small_value, std::decimal::decimal64(0));
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