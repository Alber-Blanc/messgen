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

class CppTest20 : public ::testing::Test {
protected:
    std::vector<uint8_t> _buf;
};

template <class Func, class... T>
constexpr void for_each(std::tuple<T...> &&obj, Func &&func) {
    std::apply([&]<class... M>(M &&...members) { (func(members), ...); }, obj);
}

TEST_F(CppTest20, MessageReflectionFieldNames) {
    using namespace messgen;

    auto message = test::complex_struct{};

    auto names = std::vector<std::string_view>{};
    for_each(members_of(reflect_object(message)), [&](auto &&param) { names.push_back(name_of(param)); });
    EXPECT_EQ(names.size(), 17);

    auto expected_names = std::vector<std::string_view>{
        "f0",     "f1",     "f2",     "s_arr", "f1_arr", "v_arr",   "f2_vec",         "e_vec",          "s_vec",
        "v_vec0", "v_vec1", "v_vec2", "str",   "bs",     "str_vec", "map_str_by_int", "map_vec_by_str",
    };
    EXPECT_EQ(expected_names, names);
}

TEST_F(CppTest20, MessageReflectionFieldTypes) {
    using namespace messgen;

    auto message = test::complex_struct{};

    auto types = std::vector<std::string_view>{};
    for_each(members_of(reflect_object(message)), [&](auto &&param) { types.push_back(name_of(type_of(param))); });
    EXPECT_EQ(types.size(), 17);

    auto expected_types = std::vector<std::string_view>{
        "uint64_t",
        "uint32_t",
        "uint64_t",
        "array<messgen::test::simple_struct, 2>",
        "array<int64_t, 4>",
        "array<messgen::test::var_size_struct, 2>",
        "vector<double>",
        "vector<messgen::test::simple_enum>",
        "vector<messgen::test::simple_struct>",
        "vector<vector<messgen::test::var_size_struct>>",
        "array<vector<messgen::test::var_size_struct>, 4>",
        "vector<array<vector<int16_t>, 4>>",
        "string",
        "vector<uint8_t>",
        "vector<string>",
        "map<int32_t, string>",
        "map<string, vector<int32_t>>",
    };
    EXPECT_EQ(expected_types, types);
}

TEST_F(CppTest20, MessageReflection) {
    using namespace messgen;

    auto message = test_proto::complex_struct_msg{};
    EXPECT_EQ("test_proto::complex_struct_msg", name_of(reflect_object(message)));
}

TEST_F(CppTest20, EnumReflection) {
    using namespace messgen;
    using namespace std::literals;

    auto enum_name = messgen::name_of(messgen::reflect_type<messgen::test::simple_enum>);
    EXPECT_STREQ(enum_name.data(), "messgen::test::simple_enum");

    constexpr auto enums = enumerators_of(reflect_type<messgen::test::simple_enum>);

    EXPECT_STREQ(std::get<0>(enums).name, "one_value");
    EXPECT_EQ(std::get<0>(enums).value, messgen::test::simple_enum{0});

    EXPECT_EQ(name_of(std::get<0>(enums)), "one_value"sv);
    EXPECT_EQ(value_of(std::get<0>(enums)), messgen::test::simple_enum{0});

    EXPECT_STREQ(std::get<1>(enums).name, "another_value");
    EXPECT_EQ(std::get<1>(enums).value, messgen::test::simple_enum{1});

    EXPECT_EQ(name_of(std::get<1>(enums)), "another_value"sv);
    EXPECT_EQ(value_of(std::get<1>(enums)), messgen::test::simple_enum{1});
}

TEST_F(CppTest20, DispatchMessage) {
    using namespace messgen;

    auto expected = test::simple_struct{
        .f0 = 1,
        .f1 = 2,
    };
    _buf.resize(expected.serialized_size());
    size_t ser_size = expected.serialize(_buf.data());

    auto invoked = false;
    auto handler = [&](auto &&actual) {
        using ActualType = std::decay_t<decltype(actual)>;

        if constexpr (std::is_same_v<ActualType, test_proto::simple_struct_msg>) {
            EXPECT_EQ(expected.f0, actual.data.f0);
            EXPECT_EQ(expected.f1, actual.data.f1);
            invoked = true;
        } else {
            FAIL() << "Unexpected message type handled.";
        }
    };

    test_proto::dispatch_message(test_proto::simple_struct_msg::MESSAGE_ID, _buf.data(), handler);

    EXPECT_TRUE(invoked);
}

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

TEST_F(CppTest20, ProtoHash) {
    using namespace messgen;

    auto hash_test_proto = hash_of(reflect_type<test_proto>);
    auto hash_another_proto = hash_of<nested::another_proto>();
    EXPECT_NE(hash_another_proto, hash_test_proto);

    auto expected_hash = test_proto::simple_struct_msg::HASH ^             //
                         test_proto::complex_struct_msg::HASH ^            //
                         test_proto::var_size_struct_msg::HASH ^           //
                         test_proto::struct_with_enum_msg::HASH ^          //
                         test_proto::empty_struct_msg::HASH ^              //
                         test_proto::complex_struct_with_empty_msg::HASH ^ //
                         test_proto::complex_struct_nostl_msg::HASH ^      //
                         test_proto::flat_struct_msg::HASH;
    EXPECT_EQ(expected_hash, hash_test_proto);
    EXPECT_EQ(11460364063552977134ULL, hash_test_proto);
}
