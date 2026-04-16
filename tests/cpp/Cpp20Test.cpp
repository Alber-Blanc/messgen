#include <messgen/messgen.h>
#include <messgen/concepts.h>
#include <mynamespace/proto/test_proto.h>
#include <mynamespace/proto/subspace/another_proto.h>

#include <gtest/gtest.h>

using namespace messgen;

class CppTest20 : public ::testing::Test {};

TEST_F(CppTest20, TypeConcept) {
    struct not_a_message {};

    EXPECT_TRUE(type<mynamespace::types::simple_struct>);
    EXPECT_FALSE(type<mynamespace::proto::test_proto::simple_struct>);
    EXPECT_FALSE(type<not_a_message>);
    EXPECT_FALSE(type<int>);
}

TEST_F(CppTest20, FlatTypeConcept) {
    EXPECT_TRUE(flat_type<mynamespace::types::flat_struct>);
    EXPECT_FALSE(flat_type<mynamespace::types::subspace::complex_struct>);
    EXPECT_FALSE(flat_type<int>);
}

TEST_F(CppTest20, MessageConcept) {
    EXPECT_FALSE(message<mynamespace::types::simple_struct>);
    EXPECT_FALSE(message<int>);
    EXPECT_TRUE(message<mynamespace::proto::test_proto::simple_struct>);
}

TEST_F(CppTest20, MessageRecvConcept) {
    EXPECT_FALSE(message_recv<int>);
    EXPECT_FALSE(message_recv<mynamespace::types::simple_struct>);
    EXPECT_FALSE(message_recv<mynamespace::proto::test_proto::simple_struct::send>);
    EXPECT_FALSE(message_recv<mynamespace::proto::test_proto::complex_struct::send>);
    EXPECT_TRUE(message_recv<mynamespace::proto::test_proto::complex_struct::recv>);
    EXPECT_TRUE(message_recv<mynamespace::proto::test_proto::simple_struct::recv>);
}

TEST_F(CppTest20, MessageSendConcept) {
    EXPECT_FALSE(message_send<int>);
    EXPECT_FALSE(message_send<mynamespace::types::simple_struct>);
    EXPECT_FALSE(message_send<mynamespace::proto::test_proto::simple_struct::recv>);
    EXPECT_FALSE(message_send<mynamespace::proto::test_proto::complex_struct::recv>);
    EXPECT_TRUE(message_send<mynamespace::proto::test_proto::complex_struct::send>);
    EXPECT_TRUE(message_send<mynamespace::proto::test_proto::simple_struct::send>);
}

TEST_F(CppTest20, ProtoConcept) {
    EXPECT_FALSE(message<mynamespace::types::simple_struct>);
    EXPECT_FALSE(protocol<mynamespace::proto::test_proto::simple_struct>);
    EXPECT_FALSE(protocol<int>);
    EXPECT_TRUE(protocol<mynamespace::proto::test_proto>);
}