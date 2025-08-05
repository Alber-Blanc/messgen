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

class CppTest : public ::testing::Test {
protected:
    std::vector<uint8_t> _buf;

    template <class T>
    void test_serialization(const T &msg) {
        size_t sz_check = msg.serialized_size();

        _buf.resize(sz_check);
        size_t ser_size = msg.serialize(_buf.data());
        EXPECT_EQ(ser_size, sz_check);

        T msg1{};
        size_t deser_size = msg1.deserialize(_buf.data());
        EXPECT_EQ(deser_size, sz_check);

        EXPECT_EQ(msg, msg1);
    }

    template <class T>
    void test_zerocopy(const T &msg) {
        size_t sz_check = msg.serialized_size();

        EXPECT_EQ(T::FLAT_SIZE, sz_check);

        _buf.resize(sz_check);
        size_t ser_size = msg.serialize(_buf.data());
        EXPECT_EQ(ser_size, sz_check);

        EXPECT_EQ(memcmp(&msg, _buf.data(), sz_check), 0);

        T msg1{};
        size_t deser_size = msg1.deserialize(_buf.data());
        EXPECT_EQ(deser_size, sz_check);

        EXPECT_EQ(msg, msg1);
    }
};

TEST_F(CppTest, SimpleStruct) {
    test_proto::simple_struct_msg msg{{
        .f0 = 1,
        .f1 = 2,
        .f2 = 3,
        .f3 = 4,
        .f4 = 5,
        .f5 = 6,
        .f6 = 7,
        .f8 = 9,
    }};

    test_serialization(msg.data);
}

TEST_F(CppTest, StructWithEnum) {
    messgen::test::struct_with_enum msg{};
    msg.f0 = 1;
    msg.f1 = 2;
    msg.e0 = messgen::test::simple_enum::another_value;

    test_serialization(msg);
}

TEST_F(CppTest, VarSizeStruct) {
    messgen::test::var_size_struct msg{};
    std::vector<int64_t> v;
    v.resize(2);
    v[0] = 3;
    v[1] = 4;

    msg.f0 = 1;
    msg.f1_vec = v;

    test_serialization(msg);
}

TEST_F(CppTest, ComplexStruct) {
    messgen::test::complex_struct msg{};

    msg.f0 = 255;
    msg.f2_vec.push_back(45.787);
    msg.e_vec.push_back(messgen::test::simple_enum::another_value);
    msg.s_arr[0].f3 = 3;
    msg.s_arr[1].f3 = 5;
    msg.v_vec0.resize(1);
    msg.v_vec0[0].resize(2);
    msg.v_vec0[0][0].f1_vec.resize(3);
    msg.v_vec0[0][0].f1_vec[2] = 3242;
    msg.v_vec2.resize(2);
    msg.v_vec2[1][0].resize(3);
    msg.v_vec2[1][0][2] = 5;
    msg.str = "Hello messgen!";
    msg.bs.assign({1, 2, 3, 4, 5});
    msg.str_vec.push_back("spam");
    msg.str_vec.push_back("eggs");
    msg.str_vec.push_back("sticks");
    msg.map_str_by_int[23] = "ping";
    msg.map_str_by_int[777] = "pong";
    msg.map_vec_by_str["cat"].push_back(1);
    msg.map_vec_by_str["cat"].push_back(2);
    msg.map_vec_by_str["cat"].push_back(3);
    msg.map_vec_by_str["dog"].push_back(30);
    msg.map_vec_by_str["dog"].push_back(40);

    test_serialization(msg);
}

TEST_F(CppTest, FlatStruct) {
    messgen::test::flat_struct msg{};

    msg.f0 = 1;
    msg.f1 = 2;
    msg.f2 = 3;
    msg.f3 = 4;
    msg.f4 = 5;
    msg.f5 = 6;
    msg.f6 = 7;
    msg.f7 = 7;
    msg.f8 = 9;

    test_serialization(msg);
}

TEST_F(CppTest, FlatStructZeroCopy) {
    messgen::test::flat_struct msg{};

    msg.f0 = 1;
    msg.f1 = 2;
    msg.f2 = 3;
    msg.f3 = 4;
    msg.f4 = 5;
    msg.f5 = 6;
    msg.f6 = 7;
    msg.f7 = 7;
    msg.f8 = 9;

    test_zerocopy(msg);
}

TEST_F(CppTest, TwoMsg) {
    messgen::test::simple_struct msg1{};
    msg1.f0 = 1;
    msg1.f1 = 2;
    msg1.f2 = 3;
    msg1.f3 = 4;
    msg1.f4 = 5;
    msg1.f5 = 6;
    msg1.f6 = 7;
    msg1.f8 = 9;

    messgen::test::flat_struct msg2{};
    msg2.f0 = 1;
    msg2.f1 = 2;
    msg2.f2 = 3;
    msg2.f3 = 4;
    msg2.f4 = 5;
    msg2.f5 = 6;
    msg2.f6 = 7;
    msg2.f7 = 7;
    msg2.f8 = 9;

    size_t sz_check = msg1.serialized_size() + msg2.serialized_size();

    _buf.resize(sz_check);
    size_t ser_size = msg1.serialize(_buf.data());
    ser_size += msg2.serialize(_buf.data() + ser_size);

    EXPECT_EQ(ser_size, sz_check);

    messgen::test::simple_struct msg1c{};
    messgen::test::flat_struct msg2c{};
    size_t deser_size = msg1c.deserialize(_buf.data());
    deser_size += msg2c.deserialize(_buf.data() + deser_size);
    EXPECT_EQ(deser_size, sz_check);

    EXPECT_EQ(msg1, msg1c);
    EXPECT_EQ(msg2, msg2c);
}

TEST_F(CppTest, ComplexStructWithEmpty) {
    messgen::test::complex_struct_with_empty e{};
    test_serialization(e);
}

template <class Func, class... T>
constexpr void for_each(std::tuple<T...> &&obj, Func &&func) {
    std::apply([&]<class... M>(M &&...members) { (func(members), ...); }, obj);
}

TEST_F(CppTest, MessageReflectionFieldNames) {
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

TEST_F(CppTest, MessageReflectionFieldTypes) {
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

TEST_F(CppTest, MessageReflection) {
    using namespace messgen;

    auto message = test_proto::complex_struct_msg{};
    EXPECT_EQ("test_proto::complex_struct_msg", name_of(reflect_object(message)));
}

TEST_F(CppTest, EnumReflection) {
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

TEST_F(CppTest, DispatchMessage) {
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

TEST_F(CppTest, TypeConcept) {
    using namespace messgen;

    struct not_a_message {};

    EXPECT_TRUE(type<test::simple_struct>);
    EXPECT_FALSE(type<test_proto::simple_struct_msg>);
    EXPECT_FALSE(type<not_a_message>);
    EXPECT_FALSE(type<int>);
}

TEST_F(CppTest, FlatTypeConcept) {
    using namespace messgen;

    EXPECT_TRUE(flat_type<test::flat_struct>);
    EXPECT_FALSE(flat_type<test::complex_struct>);
    EXPECT_FALSE(flat_type<int>);
}

TEST_F(CppTest, MessageConcept) {
    using namespace messgen;

    struct not_a_message {};

    EXPECT_FALSE(message<test::simple_struct>);
    EXPECT_FALSE(message<int>);
    EXPECT_TRUE(message<test_proto::simple_struct_msg>);
}

TEST_F(CppTest, ProtoConcept) {
    using namespace messgen;

    struct not_a_message {};

    EXPECT_FALSE(message<test::simple_struct>);
    EXPECT_FALSE(protocol<test_proto::simple_struct_msg>);
    EXPECT_FALSE(protocol<int>);
    EXPECT_TRUE(protocol<test_proto>);
}

TEST_F(CppTest, ProtoHash) {
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
    EXPECT_EQ(3525454337814114263ULL, hash_test_proto);
}
