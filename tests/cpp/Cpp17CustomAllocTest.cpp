#include <messgen/messgen.h>
#include <mynamespace/types/subspace/complex_struct_custom_alloc.h>
#include <mynamespace/types/var_size_struct.h>
#include <mynamespace/types/empty_struct.h>
#include <gtest/gtest.h>

class Cpp17CustomAllocTest : public ::testing::Test {
protected:
    std::vector<uint8_t> _buf;
    uint8_t _alloc_buf[1024 * 1024] = {};

    template <class T>
    void test_serialization(const T &msg) {
        size_t sz_check = msg.serialized_size();

        size_t ser_size = 0;
        if (sz_check > 0) {
            _buf.resize(sz_check);
            ser_size = msg.serialize(&_buf[0]);
        } else {
            ser_size = msg.serialize(nullptr);
        }
        EXPECT_EQ(ser_size, sz_check);

        T msg1{};
        size_t deser_size;
        if constexpr (T::NEED_ALLOC) {
            auto alloc = messgen::Allocator(_alloc_buf, sizeof(_alloc_buf));
            deser_size = msg1.deserialize(&_buf[0], alloc);
        } else if (sz_check > 0) {
            deser_size = msg1.deserialize(&_buf[0]);
        } else {
            deser_size = msg1.deserialize(nullptr);
        }
        EXPECT_EQ(deser_size, sz_check);

        EXPECT_TRUE(msg == msg1);
    }
};

TEST_F(Cpp17CustomAllocTest, ComplexStructCustomAlloc) {
    using namespace std::string_view_literals;

    mynamespace::types::subspace::complex_struct_custom_alloc s{};
    s.f0 = 255;
    std::vector<double> f2_vec;
    f2_vec.push_back(45.787);
    s.f2_vec = f2_vec;

    s.s_arr[0].f3 = 3;
    s.s_arr[1].f3 = 5;

    std::vector<int64_t> v_vec0_0_0;
    v_vec0_0_0.emplace_back(777);
    std::vector<mynamespace::types::var_size_struct> v_vec0_0;
    v_vec0_0.push_back(mynamespace::types::var_size_struct{234, v_vec0_0_0, ""sv});
    std::vector<messgen::span<mynamespace::types::var_size_struct>> v_vec0;
    v_vec0.emplace_back(v_vec0_0);
    s.v_vec0 = v_vec0;

    test_serialization(s);
}
