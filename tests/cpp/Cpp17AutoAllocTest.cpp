#include <messgen/messgen.h>
#include <mynamespace/proto/test_proto.h>
#include <mynamespace/proto/subspace/another_proto.h>
#include <mynamespace/types/another_simple_bitset.h>

#include <gtest/gtest.h>

class Cpp17AutoAllocTest : public ::testing::Test {
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

TEST_F(Cpp17AutoAllocTest, ComplexStruct) {
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

TEST_F(Cpp17AutoAllocTest, ComplexStructWithEmpty) {
    mynamespace::types::subspace::complex_struct_with_empty s{};
    test_serialization(s);
}

template <class Func, class... T>
constexpr void for_each(std::tuple<T...> &&obj, Func &&func) {
    std::apply([&]<class... M>(M &&...members) { (func(members), ...); }, obj);
}

TEST_F(Cpp17AutoAllocTest, MessageReflectionFieldTypes) {
    using namespace messgen;

    auto s = mynamespace::types::subspace::complex_struct{};

    auto types = std::vector<std::string_view>{};
    for_each(members_of(reflect_object(s)), [&](auto &&param) { types.push_back(name_of(type_of(param))); });
    EXPECT_EQ(types.size(), 18);

    auto expected_types = std::vector<std::string_view>{
        "uint64_t",
        "uint32_t",
        "uint64_t",
        "mynamespace::types::simple_bitset",
        "array<mynamespace::types::simple_struct, 2>",
        "array<int64_t, 4>",
        "array<mynamespace::types::var_size_struct, 2>",
        "vector<double>",
        "vector<mynamespace::types::simple_enum>",
        "vector<mynamespace::types::simple_struct>",
        "vector<vector<mynamespace::types::var_size_struct>>",
        "array<vector<mynamespace::types::var_size_struct>, 4>",
        "vector<array<vector<int16_t>, 4>>",
        "string",
        "vector<uint8_t>",
        "vector<string>",
        "map<int32_t, string>",
        "map<string, vector<int32_t>>",
    };
    EXPECT_EQ(expected_types, types);
}

TEST_F(Cpp17AutoAllocTest, DispatchMessage) {
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
