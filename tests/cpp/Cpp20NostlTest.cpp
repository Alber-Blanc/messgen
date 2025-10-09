#include <messgen/messgen.h>
#include <mynamespace/types/simple_struct.h>
#include <mynamespace/types/flat_struct.h>
#include <mynamespace/types/var_size_struct.h>
#include <gtest/gtest.h>

class Cpp20NostlTest : public ::testing::Test {};

TEST_F(Cpp20NostlTest, TypeConcept) {
    using namespace messgen;

    struct not_a_message {};

    EXPECT_TRUE(type<mynamespace::types::simple_struct>);
    EXPECT_FALSE(type<not_a_message>);
    EXPECT_FALSE(type<int>);
}

TEST_F(Cpp20NostlTest, FlatTypeConcept) {
    using namespace messgen;

    EXPECT_TRUE(flat_type<mynamespace::types::flat_struct>);
    EXPECT_FALSE(flat_type<mynamespace::types::var_size_struct>);
    EXPECT_FALSE(flat_type<int>);
}
