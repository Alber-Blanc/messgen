#include <messgen/messgen.h>
#include <messgen/test/complex_struct_with_empty.h>
#include <messgen/test/complex_struct.h>
#include <messgen/test/flat_struct.h>
#include <messgen/test/name_clash_struct.h>
#include <messgen/test/struct_with_enum.h>
#include <messgen/test/var_size_struct.h>
#include <messgen/test/test_bitset.h>
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
    test::test_bitset test_bits;
    test_bits |= test::test_bitset::one;
    test_bits |= test::test_bitset::two;
    test_bits |= test::test_bitset::error;
    test::test_bitset::underlying_type test_bits_val = test_bits;
    EXPECT_EQ(test_bits_val, 7);

    // Toggle 'error' bit
    test_bits ^= test::test_bitset::error;
    test_bits_val = test_bits;
    EXPECT_EQ(test_bits_val, 3);

    // Keep only 'two' bit set
    test_bits &= test::test_bitset::two;
    test_bits_val = test_bits;
    EXPECT_EQ(test_bits_val, 2);

    // Set 'one' bit
    test_bits = test_bits | test::test_bitset::one;
    test_bits_val = test_bits;
    EXPECT_EQ(test_bits_val, 3);

    // Set 'error' bit
    test_bits = test_bits ^ test::test_bitset::error;
    test_bits_val = test_bits;
    EXPECT_EQ(test_bits_val, 7);

    // Keep only 'error' bit set
    test_bits = test_bits & test::test_bitset::error;
    test_bits_val = test_bits;
    EXPECT_EQ(test_bits_val, 4);
    ASSERT_STREQ(test_bits.to_string().c_str(), "00000100");
}
