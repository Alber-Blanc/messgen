#include <messgen/messgen.h>
#include <messgen/test/complex_struct_with_empty.h>
#include <messgen/test/complex_struct.h>
#include <messgen/test/flat_struct.h>
#include <messgen/test/name_clash_struct.h>
#include <messgen/test/struct_with_enum.h>
#include <messgen/test/var_size_struct.h>
#include <messgen/test/simple_bitset.h>
#include <messgen/test/another_simple_bitset.h>
#include <nested/another_proto.h>
#include <test_proto.h>

#include <gtest/gtest.h>

class CppTest20 : public ::testing::Test {};

TEST_F(CppTest20, TypeConcept) {
    using namespace messgen;

    struct not_a_message {};

    EXPECT_TRUE(type<test::simple_struct>);
    EXPECT_FALSE(type<test_proto::simple_struct_msg>);
    EXPECT_FALSE(type<not_a_message>);
    EXPECT_FALSE(type<int>);
}

TEST_F(CppTest20, FlatTypeConcept) {
    using namespace messgen;

    EXPECT_TRUE(flat_type<test::flat_struct>);
    EXPECT_FALSE(flat_type<test::complex_struct>);
    EXPECT_FALSE(flat_type<int>);
}

TEST_F(CppTest20, MessageConcept) {
    using namespace messgen;

    struct not_a_message {};

    EXPECT_FALSE(message<test::simple_struct>);
    EXPECT_FALSE(message<int>);
    EXPECT_TRUE(message<test_proto::simple_struct_msg>);
}

TEST_F(CppTest20, ProtoConcept) {
    using namespace messgen;

    struct not_a_message {};

    EXPECT_FALSE(message<test::simple_struct>);
    EXPECT_FALSE(protocol<test_proto::simple_struct_msg>);
    EXPECT_FALSE(protocol<int>);
    EXPECT_TRUE(protocol<test_proto>);
}

TEST_F(CppTest20, BitsetOperations) {
    using namespace messgen;

    test::simple_bitset test_bits;
    test_bits |= test::simple_bitset::one;
    test_bits |= test::simple_bitset::two;
    test_bits |= test::simple_bitset::error;
    EXPECT_EQ(test_bits.to_underlying_type(), 7);

    // Toggle 'error' bit
    test_bits ^= test::simple_bitset::error;
    EXPECT_EQ(test_bits.to_underlying_type(), 3);

    // Keep only 'two' bit set
    test_bits &= test::simple_bitset::two;
    EXPECT_EQ(test_bits.to_underlying_type(), 2);

    // Set 'one' bit
    test_bits = test_bits | test::simple_bitset::one;
    EXPECT_EQ(test_bits.to_underlying_type(), 3);

    // Set 'error' bit
    test_bits = test_bits ^ test::simple_bitset::error;
    EXPECT_EQ(test_bits.to_underlying_type(), 7);

    uint8_t flags = (test_bits & test::simple_bitset::one |
                     test_bits & test::simple_bitset::two |
                     test_bits & test::simple_bitset::error).to_underlying_type();
    EXPECT_EQ(flags, 7);

    // Clear 'error' bit
    test::simple_bitset mask;
    mask |= test::simple_bitset::error;
    test_bits &= ~mask;
    EXPECT_EQ(test_bits.to_underlying_type(), 3);

    // Keep only 'two' bit set
    test_bits = test_bits & test::simple_bitset::two;
    EXPECT_EQ(test_bits.to_underlying_type(), 2);
    ASSERT_STREQ(test_bits.to_string().c_str(), "00000010");

    test::another_simple_bitset another_bitset(test_bits);
    ASSERT_STREQ(another_bitset.to_string().c_str(), "00000010");

    test::simple_bitset test_bits2;
    test_bits2 |= test::simple_bitset::two;
    EXPECT_TRUE(test_bits == test_bits2);

    test_bits.from_underlying_type(7);
    EXPECT_EQ(test_bits.to_underlying_type(), 7);

    test_bits.clear();
    EXPECT_EQ(test_bits.to_underlying_type(), 0);
    EXPECT_TRUE(test_bits != test_bits2);
}
