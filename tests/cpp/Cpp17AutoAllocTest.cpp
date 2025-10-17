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
