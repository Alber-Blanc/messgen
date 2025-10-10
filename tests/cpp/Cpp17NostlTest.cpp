#include <messgen/messgen.h>
#include <mynamespace/types/subspace/complex_struct_nostl.h>
#include <mynamespace/types/struct_with_enum.h>
#include <mynamespace/types/var_size_struct.h>
#include <mynamespace/types/empty_struct.h>
#include <gtest/gtest.h>

class Cpp17NostlTest : public ::testing::Test {
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

TEST_F(Cpp17NostlTest, SimpleStruct) {
    mynamespace::types::simple_struct s{};
    s.f0 = 1;
    s.f1 = 2;
    s.f2 = 3;
    s.f3 = 4;
    s.f4 = 5;
    s.f5 = 6;
    s.f6 = 7;
    s.f8 = 9;

    test_serialization(s);
}

TEST_F(Cpp17NostlTest, StructWithEnum) {
    mynamespace::types::struct_with_enum s{};
    s.f0 = 1;
    s.f1 = 2;
    s.e0 = mynamespace::types::simple_enum::another_value;

    test_serialization(s);
}

TEST_F(Cpp17NostlTest, VarSizeStruct) {
    mynamespace::types::var_size_struct s{};
    std::vector<int64_t> v;
    v.resize(2);
    v[0] = 3;
    v[1] = 4;

    s.f0 = 1;
    s.f1_vec = v;

    test_serialization(s);
}

TEST_F(Cpp17NostlTest, ComplexStructNostl) {
    using namespace std::string_view_literals;

    mynamespace::types::subspace::complex_struct_nostl s{};
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
    std::vector<messgen::vector<mynamespace::types::var_size_struct>> v_vec0;
    v_vec0.emplace_back(v_vec0_0);
    s.v_vec0 = v_vec0;

    test_serialization(s);
}

TEST_F(Cpp17NostlTest, EmptyStruct) {
    mynamespace::types::empty_struct s{};
    ASSERT_TRUE(s.IS_FLAT);
    ASSERT_EQ(s.FLAT_SIZE, 0);
    ASSERT_EQ(s.serialized_size(), 0);
    test_serialization(s);
}
