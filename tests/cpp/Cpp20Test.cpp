#include <messgen/messgen.h>
#include <messgen/test/complex_struct_with_empty.h>
#include <messgen/test/complex_struct.h>
#include <messgen/test/flat_struct.h>
#include <messgen/test/name_clash_struct.h>
#include <messgen/test/struct_with_enum.h>
#include <messgen/test/var_size_struct.h>
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
