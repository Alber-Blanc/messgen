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


template <class Func, class... T>
constexpr void for_each(std::tuple<T...> &&obj, Func &&func) {
    std::apply([&]<class... M>(M &&...members) { (func(members), ...); }, obj);
}

TEST_F(Cpp17AutoAllocTest, MessageReflectionFieldTypes) {
    using namespace messgen;

    auto s = mynamespace::types::subspace::complex_struct{};

    auto types = std::vector<std::string_view>{};
    for_each(members_of(reflect_object(s)), [&](auto &&param) { types.push_back(name_of(type_of(param))); });
    EXPECT_EQ(types.size(), 15);

    auto expected_types = std::vector<std::string_view>{
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
        "bytes",
        "string[]",
        "string{int32}",
        "int32[]{string}",
    };
    EXPECT_EQ(expected_types, types);
}
