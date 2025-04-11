#include <decimal/decimal>
#include <cmath>
#include <stdlib.h>
#include <float.h>

#include <iostream>
#include <iomanip>
#include <cstring>
#include <bitset>

#include <gtest/gtest.h>

class CppDecimalTest : public ::testing::Test {};

TEST_F(CppDecimalTest, Construction) {
    // Default constructor
    std::decimal::decimal64 d1;
    EXPECT_EQ(d1, std::decimal::decimal64(0));

    // Constructor from integer
    std::decimal::decimal64 d2(42);
    EXPECT_EQ(d2, std::decimal::decimal64(42));

    // Copy constructor
    std::decimal::decimal64 d3(d2);
    EXPECT_EQ(d3, d2);
}

TEST_F(CppDecimalTest, Addition) {
    std::decimal::decimal64 d1(10.5);
    std::decimal::decimal64 d2(20.25);
    std::decimal::decimal64 result = d1 + d2;
    std::decimal::decimal64 expected(30.75);
    EXPECT_EQ(result, expected);

    // Addition with zero
    std::decimal::decimal64 zero(0);
    EXPECT_EQ(d1 + zero, d1);

    // Addition with negative values
    std::decimal::decimal64 negative(-15.75);
    result = d1 + negative;
    expected = std::decimal::decimal64(-5.25);
    EXPECT_EQ(result, expected);

    // Compound assignment
    d1 += d2;
    EXPECT_EQ(d1, std::decimal::decimal64(30.75));
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
    // Test decimal precision
    std::decimal::decimal64 value = std::decimal::make_decimal64(1234567890123456LL, -10);
    EXPECT_EQ(std::decimal::decimal64_to_double(value), 123456.7890123456);

    auto decimal_to_hex = [](auto value) {
        std::stringstream ss;
        ss << "0x" << std::hex << std::setfill('0') << std::setw(16) << *reinterpret_cast<uint64_t *>(&value);
        return ss.str();
    };

    auto decimal_to_bin = [](auto value) {
        std::stringstream ss;
        ss << std::bitset<64>(*reinterpret_cast<uint64_t *>(&value));
        return ss.str();
    };

    // Basic Values
    std::cout << decimal_to_hex(std::decimal::make_decimal64(1LL, 0)) << "\n";
    std::cout << decimal_to_hex(std::decimal::make_decimal64(123LL, 0)) << "\n";
    std::cout << decimal_to_hex(std::decimal::make_decimal64(123LL, -2)) << "\n";
    std::cout << decimal_to_hex(std::decimal::make_decimal64(123LL, 2)) << "\n";
    std::cout << decimal_to_hex(std::decimal::make_decimal64(-123LL, 0)) << "\n";
    std::cout << decimal_to_hex(std::decimal::make_decimal64(-123LL, -1)) << "\n";

    // Zero Values
    std::cout << decimal_to_hex(std::decimal::make_decimal64(0LL, 0)) << "\n";
    std::cout << decimal_to_hex(std::decimal::make_decimal64(0LL, 100)) << "\n";
    std::cout << decimal_to_hex(std::decimal::make_decimal64(0LL, -100)) << "\n";

    // Precision Edge Cases
    std::cout << decimal_to_hex(std::decimal::make_decimal64(9999999LL, 0)) << "\n";
    std::cout << decimal_to_hex(std::decimal::make_decimal64(1LL, -28)) << "\n";
    std::cout << decimal_to_hex(std::decimal::make_decimal64(9LL, 28)) << "\n";
    std::cout << decimal_to_hex(std::decimal::make_decimal64(999999999999999LL, -15)) << "\n";

    // Rounding Cases
    std::cout << decimal_to_hex(std::decimal::make_decimal64(5LL, -1)) << "\n";
    std::cout << decimal_to_hex(std::decimal::make_decimal64(15LL, -2)) << "\n";
    std::cout << decimal_to_hex(std::decimal::make_decimal64(125LL, -3)) << "\n";
    std::cout << decimal_to_hex(std::decimal::make_decimal64(126LL, -3)) << "\n";

    // Special Values (implementation-dependent)
    std::cout << decimal_to_hex(std::decimal::make_decimal64(1LL, 999)) << "\n";
    std::cout << decimal_to_hex(std::decimal::make_decimal64(-1LL, 999)) << "\n";
    std::cout << decimal_to_hex(std::decimal::make_decimal64(0LL, -999)) << "\n";
    std::cout << decimal_to_hex(std::decimal::make_decimal64(1LL, -30)) << "\n";

    // Operation Testing Values
    std::cout << decimal_to_hex(std::decimal::make_decimal64(9999999LL, 90)) << "\n";
    std::cout << decimal_to_hex(std::decimal::make_decimal64(9999999LL, -99)) << "\n";
    std::cout << decimal_to_hex(std::decimal::make_decimal64(5LL, -1)) << "\n";
    std::cout << decimal_to_hex(std::decimal::make_decimal64(1LL, -6)) << "\n";

    // Boundary Cases
    std::cout << decimal_to_hex(std::decimal::make_decimal64(9999999999999999LL, 0)) << "\n";
    std::cout << decimal_to_hex(std::decimal::make_decimal64(1LL, 383)) << "\n";
    std::cout << decimal_to_hex(std::decimal::make_decimal64(9999999999999999LL, 383)) << "\n";
    std::cout << decimal_to_hex(std::decimal::make_decimal64(9999999999999999LL, -383)) << "\n";
}