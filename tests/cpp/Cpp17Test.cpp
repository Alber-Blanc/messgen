#include <messgen/messgen.h>
#include <mynamespace/proto/test_proto.h>
#include <mynamespace/proto/subspace/another_proto.h>
#include <mynamespace/types/another_simple_bitset.h>

#include <gtest/gtest.h>

class CppTest17 : public ::testing::Test {
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

TEST_F(CppTest17, SimpleStruct) {
    mynamespace::proto::test_proto::simple_struct_msg s{{
        .f0 = 1,
        .f1 = 2,
        .f2 = 3,
        .f3 = 4,
        .f4 = 5,
        .f5 = 6,
        .f6 = 7,
        .f8 = 9,
    }};

    test_serialization(s.data);
}

TEST_F(CppTest17, StructWithEnum) {
    mynamespace::types::struct_with_enum s{};
    s.f0 = 1;
    s.f1 = 2;
    s.e0 = mynamespace::types::simple_enum::another_value;

    test_serialization(s);
}

TEST_F(CppTest17, VarSizeStruct) {
    mynamespace::types::var_size_struct s{};
    std::vector<int64_t> v;
    v.resize(2);
    v[0] = 3;
    v[1] = 4;

    s.f0 = 1;
    s.f1_vec = v;

    test_serialization(s);
}

TEST_F(CppTest17, ComplexStruct) {
    mynamespace::types::subspace::complex_struct s{};

    s.f0 = 255;
    s.f2_vec.push_back(45.787);
    s.e_vec.push_back(mynamespace::types::simple_enum::another_value);
    s.s_arr[0].f3 = 3;
    s.s_arr[1].f3 = 5;
    s.v_vec0.resize(1);
    s.v_vec0[0].resize(2);
    s.v_vec0[0][0].f1_vec.resize(3);
    s.v_vec0[0][0].f1_vec[2] = 3242;
    s.v_vec2.resize(2);
    s.v_vec2[1][0].resize(3);
    s.v_vec2[1][0][2] = 5;
    s.str = "Hello messgen!";
    s.bs.assign({1, 2, 3, 4, 5});
    s.str_vec.push_back("spam");
    s.str_vec.push_back("eggs");
    s.str_vec.push_back("sticks");
    s.map_str_by_int[23] = "ping";
    s.map_str_by_int[777] = "pong";
    s.map_vec_by_str["cat"].push_back(1);
    s.map_vec_by_str["cat"].push_back(2);
    s.map_vec_by_str["cat"].push_back(3);
    s.map_vec_by_str["dog"].push_back(30);
    s.map_vec_by_str["dog"].push_back(40);
    s.bits0 |= mynamespace::types::simple_bitset::error;

    test_serialization(s);
}

TEST_F(CppTest17, FlatStruct) {
    mynamespace::types::flat_struct s{};

    s.f0 = 1;
    s.f1 = 2;
    s.f2 = 3;
    s.f3 = 4;
    s.f4 = 5;
    s.f5 = 6;
    s.f6 = 7;
    s.f7 = 7;
    s.f8 = 9;

    test_serialization(s);
}

TEST_F(CppTest17, FlatStructZeroCopy) {
    mynamespace::types::flat_struct s{};

    s.f0 = 1;
    s.f1 = 2;
    s.f2 = 3;
    s.f3 = 4;
    s.f4 = 5;
    s.f5 = 6;
    s.f6 = 7;
    s.f7 = 7;
    s.f8 = 9;

    test_zerocopy(s);
}

TEST_F(CppTest17, TwoMsg) {
    mynamespace::types::simple_struct s1{};
    s1.f0 = 1;
    s1.f1 = 2;
    s1.f2 = 3;
    s1.f3 = 4;
    s1.f4 = 5;
    s1.f5 = 6;
    s1.f6 = 7;
    s1.f8 = 9;

    mynamespace::types::flat_struct s2{};
    s2.f0 = 1;
    s2.f1 = 2;
    s2.f2 = 3;
    s2.f3 = 4;
    s2.f4 = 5;
    s2.f5 = 6;
    s2.f6 = 7;
    s2.f7 = 7;
    s2.f8 = 9;

    size_t sz_check = s1.serialized_size() + s2.serialized_size();

    _buf.resize(sz_check);
    size_t ser_size = s1.serialize(_buf.data());
    ser_size += s2.serialize(_buf.data() + ser_size);

    EXPECT_EQ(ser_size, sz_check);

    mynamespace::types::simple_struct s1c{};
    mynamespace::types::flat_struct s2c{};
    size_t deser_size = s1c.deserialize(_buf.data());
    deser_size += s2c.deserialize(_buf.data() + deser_size);
    EXPECT_EQ(deser_size, sz_check);

    EXPECT_EQ(s1, s1c);
    EXPECT_EQ(s2, s2c);
}

TEST_F(CppTest17, ComplexStructWithEmpty) {
    mynamespace::types::subspace::complex_struct_with_empty s{};
    test_serialization(s);
}

template <class Func, class... T>
constexpr void for_each(std::tuple<T...> &&obj, Func &&func) {
    std::apply([&]<class... M>(M &&...members) { (func(members), ...); }, obj);
}

TEST_F(CppTest17, MessageReflectionFieldNames) {
    using namespace messgen;

    auto s = mynamespace::types::subspace::complex_struct{};

    auto names = std::vector<std::string_view>{};
    for_each(members_of(reflect_object(s)), [&](auto &&param) { names.push_back(name_of(param)); });
    EXPECT_EQ(names.size(), 18);

    auto expected_names = std::vector<std::string_view>{
        "f0",    "f1",     "f2",     "bits0",  "s_arr", "f1_arr", "v_arr",   "f2_vec",         "e_vec",
        "s_vec", "v_vec0", "v_vec1", "v_vec2", "str",   "bs",     "str_vec", "map_str_by_int", "map_vec_by_str",
    };
    EXPECT_EQ(expected_names, names);
}

TEST_F(CppTest17, MessageReflectionFieldTypes) {
    using namespace messgen;

    auto s = mynamespace::types::subspace::complex_struct{};

    auto types = std::vector<std::string_view>{};
    for_each(members_of(reflect_object(s)), [&](auto &&param) { types.push_back(name_of(type_of(param))); });
    EXPECT_EQ(types.size(), 18);

    auto expected_types = std::vector<std::string_view>{
        "uint64",
        "uint32",
        "uint64",
        "mynamespace::types::simple_bitset",
        "mynamespace::types::simple_struct[2]",
        "int64[4]",
        "mynamespace::types::var_size_struct[2]",
        "float64[]",
        "mynamespace::types::simple_enum[]",
        "mynamespace::types::simple_struct[]",
        "mynamespace::types::var_size_struct[][]",
        "mynamespace::types::var_size_struct[][4]",
        "int16[][4][]",
        "string",
        "uint8[]",
        "string[]",
        "string{int32}",
        "int32[]{string}",
    };
    EXPECT_EQ(expected_types, types);
}

TEST_F(CppTest17, MessageReflection) {
    using namespace messgen;

    auto msg = mynamespace::proto::test_proto::complex_struct_msg{};
    EXPECT_EQ("mynamespace::proto::test_proto::complex_struct_msg", name_of(reflect_object(msg)));
}

TEST_F(CppTest17, EnumReflection) {
    using namespace messgen;
    using namespace std::literals;

    auto enum_name = messgen::name_of(messgen::reflect_type<mynamespace::types::simple_enum>);
    EXPECT_STREQ(enum_name.data(), "mynamespace::types::simple_enum");

    constexpr auto enums = enumerators_of(reflect_type<mynamespace::types::simple_enum>);

    EXPECT_STREQ(std::get<0>(enums).name, "one_value");
    EXPECT_EQ(std::get<0>(enums).value, mynamespace::types::simple_enum{0});

    EXPECT_EQ(name_of(std::get<0>(enums)), "one_value"sv);
    EXPECT_EQ(value_of(std::get<0>(enums)), mynamespace::types::simple_enum{0});

    EXPECT_STREQ(std::get<1>(enums).name, "another_value");
    EXPECT_EQ(std::get<1>(enums).value, mynamespace::types::simple_enum{1});

    EXPECT_EQ(name_of(std::get<1>(enums)), "another_value"sv);
    EXPECT_EQ(value_of(std::get<1>(enums)), mynamespace::types::simple_enum{1});
}

TEST_F(CppTest17, ConstexprNameReflection) {
    using namespace messgen;

    constexpr auto name = name_of(reflect_type<std::map<std::string, std::array<std::vector<mynamespace::types::var_size_struct>, 4>>>);
    EXPECT_EQ("mynamespace::types::var_size_struct[][4]{string}", name);
}

TEST_F(CppTest17, DispatchMessage) {
    using namespace messgen;

    auto expected = mynamespace::types::simple_struct{
        .f0 = 1,
        .f1 = 2,
    };
    _buf.resize(expected.serialized_size());
    size_t ser_size = expected.serialize(_buf.data());

    auto invoked = false;
    auto handler = [&](auto &&actual) {
        using ActualType = std::decay_t<decltype(actual)>;

        if constexpr (std::is_same_v<ActualType, mynamespace::proto::test_proto::simple_struct_msg>) {
            EXPECT_EQ(expected.f0, actual.data.f0);
            EXPECT_EQ(expected.f1, actual.data.f1);
            invoked = true;
        } else {
            FAIL() << "Unexpected message type handled.";
        }
    };

    mynamespace::proto::test_proto::dispatch_message(mynamespace::proto::test_proto::simple_struct_msg::MESSAGE_ID, _buf.data(), handler);

    EXPECT_TRUE(invoked);
}

TEST_F(CppTest17, ProtoHash) {
    using namespace messgen;

    constexpr auto hash_test_proto = hash_of(reflect_type<mynamespace::proto::test_proto>);
    constexpr auto hash_another_proto = hash_of<mynamespace::proto::subspace::another_proto>();
    EXPECT_NE(hash_another_proto, hash_test_proto);

    auto expected_hash = mynamespace::proto::test_proto::simple_struct_msg::HASH ^             //
                         mynamespace::proto::test_proto::complex_struct_msg::HASH ^            //
                         mynamespace::proto::test_proto::var_size_struct_msg::HASH ^           //
                         mynamespace::proto::test_proto::struct_with_enum_msg::HASH ^          //
                         mynamespace::proto::test_proto::empty_struct_msg::HASH ^              //
                         mynamespace::proto::test_proto::complex_struct_with_empty_msg::HASH ^ //
                         mynamespace::proto::test_proto::complex_struct_nostl_msg::HASH ^      //
                         mynamespace::proto::test_proto::flat_struct_msg::HASH ^               //
                         mynamespace::proto::test_proto::complex_types_with_flat_groups_msg::HASH;
    EXPECT_EQ(expected_hash, hash_test_proto);
    EXPECT_EQ(615801888777759705U, hash_test_proto);
}

TEST_F(CppTest17, TypeTraits) {
    using namespace messgen;

    static_assert(is_flat_type_v<mynamespace::types::flat_struct>);
    static_assert(!is_flat_type_v<mynamespace::types::subspace::complex_struct>);

    static_assert(is_type_v<mynamespace::types::flat_struct>);
    static_assert(is_type_v<mynamespace::types::subspace::complex_struct>);
    static_assert(!is_type_v<mynamespace::proto::test_proto::simple_struct_msg>);
    static_assert(!is_type_v<mynamespace::proto::test_proto>);

    static_assert(is_message_v<mynamespace::proto::test_proto::simple_struct_msg>);
    static_assert(!is_message_v<mynamespace::types::flat_struct>);
    static_assert(!is_message_v<mynamespace::proto::test_proto>);

    static_assert(is_protocol_v<mynamespace::proto::test_proto>);
    static_assert(!is_protocol_v<mynamespace::types::flat_struct>);
    static_assert(!is_protocol_v<mynamespace::proto::test_proto::simple_struct_msg>);
}

TEST_F(CppTest17, BitsetOperations) {
    using namespace messgen;

    // Default constructor
    mynamespace::types::simple_bitset test_bits;
    EXPECT_EQ(test_bits.to_underlying(), 0);

    // Single bit assignment
    test_bits = mynamespace::types::simple_bitset::one;
    EXPECT_EQ(test_bits.to_underlying(), 1);

    // Multiple bits assignment
    test_bits = mynamespace::types::simple_bitset::one | mynamespace::types::simple_bitset::two | mynamespace::types::simple_bitset::error;
    EXPECT_EQ(test_bits.to_underlying(), 7);

    // Toggle single bit
    test_bits ^= mynamespace::types::simple_bitset::error;
    EXPECT_EQ(test_bits.to_underlying(), 3);

    // Toggle multiple bits
    test_bits ^= mynamespace::types::simple_bitset::one | mynamespace::types::simple_bitset::error;
    EXPECT_EQ(test_bits.to_underlying(), 6);

    // Mask multiple bits
    test_bits = mynamespace::types::simple_bitset::one | mynamespace::types::simple_bitset::two | mynamespace::types::simple_bitset::error;
    test_bits &= mynamespace::types::simple_bitset::one | mynamespace::types::simple_bitset::two;
    EXPECT_EQ(test_bits.to_underlying(), 3);

    // Mask single bit
    test_bits &= mynamespace::types::simple_bitset::two;
    EXPECT_EQ(test_bits.to_underlying(), 2);

    // Set 'one' bit
    test_bits = test_bits | mynamespace::types::simple_bitset::one;
    EXPECT_EQ(test_bits.to_underlying(), 3);

    // Toggle 'error' bit
    test_bits = test_bits ^ mynamespace::types::simple_bitset::error;
    EXPECT_EQ(test_bits.to_underlying(), 7);

    uint8_t flags = ((test_bits & mynamespace::types::simple_bitset::one) | (test_bits & mynamespace::types::simple_bitset::two) |
                     (test_bits & mynamespace::types::simple_bitset::error))
                        .to_underlying();
    EXPECT_EQ(flags, 7);

    // Clear 'error' bit
    mynamespace::types::simple_bitset mask;
    mask |= mynamespace::types::simple_bitset::error;
    test_bits &= ~mask;
    EXPECT_EQ(test_bits.to_underlying(), 3);

    // Keep only 'two' bit set
    test_bits = test_bits & mynamespace::types::simple_bitset::two;
    EXPECT_EQ(test_bits.to_underlying(), 2);

    mynamespace::types::another_simple_bitset another_bitset(test_bits.to_underlying());
    EXPECT_EQ(test_bits.to_underlying(), another_bitset.to_underlying());

    mynamespace::types::simple_bitset test_bits2;
    test_bits2 |= mynamespace::types::simple_bitset::two;
    EXPECT_TRUE(test_bits == test_bits2);

    test_bits = mynamespace::types::simple_bitset(7);
    EXPECT_EQ(test_bits.to_underlying(), 7);

    test_bits.clear();
    EXPECT_EQ(test_bits.to_underlying(), 0);
    EXPECT_TRUE(test_bits != test_bits2);
}
