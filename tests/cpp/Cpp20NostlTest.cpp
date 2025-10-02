#include <messgen/messgen.h>
#include <messgen/test/complex_struct_nostl.h>
#include <messgen/test/struct_with_enum.h>
#include <messgen/test/var_size_struct.h>
#include <messgen/test/empty_struct.h>
#include <messgen/test/flat_struct.h>
#include <gtest/gtest.h>

class Cpp20NostlTest : public ::testing::Test {};

TEST_F(Cpp20NostlTest, TypeConcept) {
    using namespace messgen;

    struct not_a_message {};

    EXPECT_TRUE(type<test::simple_struct>);
    EXPECT_FALSE(type<not_a_message>);
    EXPECT_FALSE(type<int>);
}

TEST_F(Cpp20NostlTest, FlatTypeConcept) {
    using namespace messgen;

    EXPECT_TRUE(flat_type<test::flat_struct>);
    EXPECT_FALSE(flat_type<test::var_size_struct>);
    EXPECT_FALSE(flat_type<int>);
}
