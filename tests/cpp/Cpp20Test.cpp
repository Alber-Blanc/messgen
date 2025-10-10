#include <messgen/messgen.h>
#include <mynamespace/proto/test_proto.h>
#include <mynamespace/proto/subspace/another_proto.h>

#include <gtest/gtest.h>

class CppTest20 : public ::testing::Test {};

TEST_F(CppTest20, TypeConcept) {
    using namespace messgen;

    struct not_a_message {};

    EXPECT_TRUE(type<mynamespace::types::simple_struct>);
    EXPECT_FALSE(type<mynamespace::proto::test_proto::simple_struct_msg>);
    EXPECT_FALSE(type<not_a_message>);
    EXPECT_FALSE(type<int>);
}

TEST_F(CppTest20, FlatTypeConcept) {
    using namespace messgen;

    EXPECT_TRUE(flat_type<mynamespace::types::flat_struct>);
    EXPECT_FALSE(flat_type<mynamespace::types::subspace::complex_struct>);
    EXPECT_FALSE(flat_type<int>);
}

TEST_F(CppTest20, MessageConcept) {
    using namespace messgen;

    struct not_a_message {};

    EXPECT_FALSE(message<mynamespace::types::simple_struct>);
    EXPECT_FALSE(message<int>);
    EXPECT_TRUE(message<mynamespace::proto::test_proto::simple_struct_msg>);
}

TEST_F(CppTest20, ProtoConcept) {
    using namespace messgen;

    struct not_a_message {};

    EXPECT_FALSE(message<mynamespace::types::simple_struct>);
    EXPECT_FALSE(protocol<mynamespace::proto::test_proto::simple_struct_msg>);
    EXPECT_FALSE(protocol<int>);
    EXPECT_TRUE(protocol<mynamespace::proto::test_proto>);
}