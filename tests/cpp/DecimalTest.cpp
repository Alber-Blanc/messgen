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

    // UDL
    auto d4 = 0.001_dd;
    auto d4_str = d4.to_string();
    EXPECT_EQ("0.001", d4_str);
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
    auto from_int = Decimal64::from_integer(42);
    EXPECT_EQ(from_int, 42.0_dd);

    // From double
    auto from_double = Decimal64::from_double(42.5, 0.001_dd, RoundMode::mid);
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
    auto precise_value = Decimal64::from_double(0.1234567890123456, 0.0000001_dd, RoundMode::mid);
    EXPECT_EQ(precise_value.to_string(), "0.1234568");

    // Test with very large numbers
    auto large_value = Decimal64::from_double(9.999999999999999e+10, 0.001_dd, RoundMode::mid);
    EXPECT_GT(large_value, Decimal64::from_integer(0)) << large_value.to_string();

    // Test with very small numbers
    auto small_value = Decimal64::from_double(9.999999999, 0.001_dd, RoundMode::mid);
    EXPECT_GT(small_value, Decimal64::from_integer(0)) << small_value.to_string();
}

TEST_F(CppDecimalTest, RoundDownPositive) {
    EXPECT_EQ(10.0_dd, Decimal64::from_double(10.0, 1.0_dd, RoundMode::down));
    EXPECT_EQ(10.0_dd, Decimal64::from_double(10.4, 1.0_dd, RoundMode::down));
    EXPECT_EQ(10.0_dd, Decimal64::from_double(10.5, 1.0_dd, RoundMode::down));
    EXPECT_EQ(10.0_dd, Decimal64::from_double(10.6, 1.0_dd, RoundMode::down));
}

// Tests for RoundMode::down with negative values
TEST_F(CppDecimalTest, RoundDownNegative) {
    EXPECT_EQ(-10.0_dd, Decimal64::from_double(-10.0, 1.0_dd, RoundMode::down));
    EXPECT_EQ(-11.0_dd, Decimal64::from_double(-10.6, 1.0_dd, RoundMode::down));
    EXPECT_EQ(-11.0_dd, Decimal64::from_double(-10.5, 1.0_dd, RoundMode::down));
    EXPECT_EQ(-11.0_dd, Decimal64::from_double(-10.4, 1.0_dd, RoundMode::down));
}

// Tests for RoundMode::mid with positive values
TEST_F(CppDecimalTest, RoundMidPositive) {
    EXPECT_EQ(10.0_dd, Decimal64::from_double(10.0, 1.0_dd, RoundMode::mid));
    EXPECT_EQ(10.0_dd, Decimal64::from_double(10.4, 1.0_dd, RoundMode::mid));
    EXPECT_EQ(11.0_dd, Decimal64::from_double(10.5, 1.0_dd, RoundMode::mid));
    EXPECT_EQ(11.0_dd, Decimal64::from_double(10.6, 1.0_dd, RoundMode::mid));
}

// Tests for RoundMode::mid with negative values
TEST_F(CppDecimalTest, RoundMidNegative) {
    EXPECT_EQ(-10.0_dd, Decimal64::from_double(-10.0, 1.0_dd, RoundMode::mid));
    EXPECT_EQ(-11.0_dd, Decimal64::from_double(-10.6, 1.0_dd, RoundMode::mid));
    EXPECT_EQ(-11.0_dd, Decimal64::from_double(-10.5, 1.0_dd, RoundMode::mid));
    EXPECT_EQ(-10.0_dd, Decimal64::from_double(-10.4, 1.0_dd, RoundMode::mid));
}

// Tests for RoundMode::up with positive values
TEST_F(CppDecimalTest, RoundUpPositive) {
    EXPECT_EQ(10.0_dd, Decimal64::from_double(10.0, 1.0_dd, RoundMode::up));
    EXPECT_EQ(11.0_dd, Decimal64::from_double(10.4, 1.0_dd, RoundMode::up));
    EXPECT_EQ(11.0_dd, Decimal64::from_double(10.5, 1.0_dd, RoundMode::up));
    EXPECT_EQ(11.0_dd, Decimal64::from_double(10.6, 1.0_dd, RoundMode::up));
}

// Tests for RoundMode::up with negative values
TEST_F(CppDecimalTest, RoundUpNegative) {
    EXPECT_EQ(-10.0_dd, Decimal64::from_double(-10.0, 1.0_dd, RoundMode::up));
    EXPECT_EQ(-10.0_dd, Decimal64::from_double(-10.6, 1.0_dd, RoundMode::up));
    EXPECT_EQ(-10.0_dd, Decimal64::from_double(-10.5, 1.0_dd, RoundMode::up));
    EXPECT_EQ(-10.0_dd, Decimal64::from_double(-10.4, 1.0_dd, RoundMode::up));
}

// Tests with non-integer ticks
TEST_F(CppDecimalTest, NonIntegerTick) {
    // Positive values with 0.5 tick
    EXPECT_EQ(10.0_dd, Decimal64::from_double(10.25, 0.5_dd, RoundMode::down));
    EXPECT_EQ(10.0_dd, Decimal64::from_double(10.249999, 0.5_dd, RoundMode::mid));
    EXPECT_EQ(10.5_dd, Decimal64::from_double(10.25, 0.5_dd, RoundMode::mid));
    EXPECT_EQ(10.5_dd, Decimal64::from_double(10.25, 0.5_dd, RoundMode::up));

    // Negative values with 0.5 tick
    EXPECT_EQ(-10.5_dd, Decimal64::from_double(-10.25, 0.5_dd, RoundMode::down));
    EXPECT_EQ(-10.5_dd, Decimal64::from_double(-10.25, 0.5_dd, RoundMode::mid));
    EXPECT_EQ(-10.0_dd, Decimal64::from_double(-10.249999, 0.5_dd, RoundMode::mid));
    EXPECT_EQ(-10.0_dd, Decimal64::from_double(-10.25, 0.5_dd, RoundMode::up));
}

// Tests with extreme values
TEST_F(CppDecimalTest, ExtremeValues) {
    // Very small values
    EXPECT_EQ(0.0000012_dd, Decimal64::from_double(0.0000012345, 0.0000001_dd, RoundMode::down));
    EXPECT_EQ(0.0000012_dd, Decimal64::from_double(0.0000012345, 0.0000001_dd, RoundMode::mid));
    EXPECT_EQ(0.0000013_dd, Decimal64::from_double(0.0000012345, 0.0000001_dd, RoundMode::up));

    // Very large values
    EXPECT_EQ(9.8700e10_dd, Decimal64::from_double(9.876e10, 100000000.0_dd, RoundMode::down));
    EXPECT_EQ(9.8800e10_dd, Decimal64::from_double(9.876e10, 100000000.0_dd, RoundMode::mid));
    EXPECT_EQ(9.8800e10_dd, Decimal64::from_double(9.876e10, 100000000.0_dd, RoundMode::up));
}

// Tests with different combinations of exponents
TEST_F(CppDecimalTest, DifferentExponents) {
    // Value has higher precision than tick
    EXPECT_EQ(123.45_dd, Decimal64::from_double(123.456, 0.01_dd, RoundMode::down));
    EXPECT_EQ(123.46_dd, Decimal64::from_double(123.456, 0.01_dd, RoundMode::mid));
    EXPECT_EQ(123.46_dd, Decimal64::from_double(123.456, 0.01_dd, RoundMode::up));

    // Tick has higher precision than value
    EXPECT_EQ(123000.0_dd, Decimal64::from_double(123000.0, 100.0_dd, RoundMode::down));
    EXPECT_EQ(123000.0_dd, Decimal64::from_double(123000.0, 100.0_dd, RoundMode::mid));
    EXPECT_EQ(123000.0_dd, Decimal64::from_double(123000.0, 100.0_dd, RoundMode::up));
}

// Tests with zero and near-zero values
TEST_F(CppDecimalTest, ZeroValues) {
    // Exactly zero
    EXPECT_EQ(0.0_dd, Decimal64::from_double(0.0, 0.1_dd, RoundMode::down));
    EXPECT_EQ(0.0_dd, Decimal64::from_double(0.0, 0.1_dd, RoundMode::mid));
    EXPECT_EQ(0.0_dd, Decimal64::from_double(0.0, 0.1_dd, RoundMode::up));

    // Near-zero values
    EXPECT_EQ(0.0_dd, Decimal64::from_double(0.01, 0.1_dd, RoundMode::down));
    EXPECT_EQ(0.0_dd, Decimal64::from_double(0.01, 0.1_dd, RoundMode::mid));
    EXPECT_EQ(0.1_dd, Decimal64::from_double(0.01, 0.1_dd, RoundMode::up));

    EXPECT_EQ(-0.1_dd, Decimal64::from_double(-0.01, 0.1_dd, RoundMode::down));
    EXPECT_EQ(0.0_dd, Decimal64::from_double(-0.01, 0.1_dd, RoundMode::mid));
    EXPECT_EQ(0.0_dd, Decimal64::from_double(-0.01, 0.1_dd, RoundMode::up));
}

// Consistency checks
TEST_F(CppDecimalTest, ConsistencyCheck) {
    // Same value with different scale representations should be proportional
    auto result1 = Decimal64::from_double(1.5, 1.0_dd, RoundMode::mid);
    auto result2 = Decimal64::from_double(15.0, 10.0_dd, RoundMode::mid);

    EXPECT_DOUBLE_EQ(result1.to_double() * 10.0, result2.to_double());
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