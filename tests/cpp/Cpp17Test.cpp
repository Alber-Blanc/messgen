#include <messgen/messgen.h>
#include <mynamespace/proto/test_proto.h>
#include <mynamespace/proto/subspace/another_proto.h>
#include <mynamespace/types/another_simple_bitset.h>

#include <gtest/gtest.h>

class Cpp17Test : public ::testing::Test {
protected:
    std::vector<uint8_t> _buf;
    uint8_t _alloc_buf[1024 * 1024] = {};

    template <class T>
    void test_serialization(const T &msg) {
        size_t sz_check = msg.serialized_size();

        size_t ser_size = 0;
        if (sz_check > 0) {
            _buf.resize(sz_check);
            ser_size = msg.serialize(_buf.data());
        } else {
            ser_size = msg.serialize(nullptr);
        }
        EXPECT_EQ(ser_size, sz_check);

        T msg1{};
        ssize_t deser_size;
        if constexpr (messgen::has_deserialize_alloc_method_v<T>) {
            auto alloc = messgen::Allocator(_alloc_buf, sizeof(_alloc_buf));
            deser_size = msg1.deserialize(messgen::bytes(&_buf), alloc);
        } else if (sz_check > 0) {
            deser_size = msg1.deserialize(messgen::bytes(&_buf));
        } else {
            deser_size = msg1.deserialize({});
        }
        EXPECT_EQ(deser_size, sz_check);

        EXPECT_EQ(msg, msg1);
    }

    template <class T>
    void test_zerocopy(const T &msg) {
        size_t sz_check = msg.serialized_size();

        EXPECT_EQ(T::FIXED_SIZE, sz_check);

        _buf.resize(sz_check);
        size_t ser_size = msg.serialize(_buf.data());
        EXPECT_EQ(ser_size, sz_check);

        EXPECT_EQ(memcmp(&msg, _buf.data(), sz_check), 0);

        T msg1{};
        size_t deser_size = msg1.deserialize(messgen::bytes(&_buf));
        EXPECT_EQ(deser_size, sz_check);

        EXPECT_EQ(msg, msg1);
    }
};

TEST_F(Cpp17Test, SimpleStruct) {
    mynamespace::types::simple_struct s{
        .f0 = 1,
        .f1 = 2,
        .f2 = 3,
        .f3 = 4,
        .f4 = 5,
        .f5 = 6,
        .f6 = 7,
        .f8 = 9,
        .e0 = mynamespace::types::simple_enum::another_value,
        .b0 = mynamespace::types::simple_bitset::two,
    };

    test_serialization(s);
}

TEST_F(Cpp17Test, FlatStruct) {
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

TEST_F(Cpp17Test, FlatStructZeroCopy) {
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

TEST_F(Cpp17Test, EmptyStruct) {
    mynamespace::types::empty_struct s{};
    ASSERT_TRUE(s.IS_FLAT);
    ASSERT_EQ(s.FIXED_SIZE, 0);
    ASSERT_EQ(s.serialized_size(), 0);
    test_serialization(s);
}

TEST_F(Cpp17Test, TwoMsg) {
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
    size_t deser_size = s1c.deserialize(messgen::bytes(&_buf));
    deser_size += s2c.deserialize({_buf.data() + deser_size, _buf.size() - deser_size});
    EXPECT_EQ(deser_size, sz_check);

    EXPECT_EQ(s1, s1c);
    EXPECT_EQ(s2, s2c);
}

TEST_F(Cpp17Test, VarSizeStructStor) {
    mynamespace::types::stor::var_size_struct s{};

    s.f0 = 1;
    s.f1_vec = {3, 4};
    test_serialization(s);
}

TEST_F(Cpp17Test, VarSizeStructView) {
    mynamespace::types::var_size_struct s{};

    s.f0 = 1;
    std::vector<int64_t> f1_vec{3, 4};
    s.f1_vec = messgen::span<int64_t>(&f1_vec);
    test_serialization(s);
}

TEST_F(Cpp17Test, ComplexStructStor) {
    mynamespace::types::subspace::stor::complex_struct s{};

    s.bitset0 = mynamespace::types::simple_bitset::two;
    s.arr_simple_struct[0].f3 = 3;
    s.arr_simple_struct[1].f3 = 5;
    s.arr_int[0] = 10;
    s.arr_int[1] = 20;
    s.arr_int[2] = 30;
    s.arr_int[3] = 40;
    s.arr_var_size_struct[0].f0 = 3;
    s.arr_var_size_struct[1].f0 = 5;
    s.str = "Hello messgen!";
    s.bs = {1, 2, 3, 4, 5, 6, 7, 8};

    std::vector<int64_t> f1_vec_data0 = {12345, 23456};
    std::vector<int64_t> f1_vec_data1 = {1234, 2345};
    std::vector<double> vec_float_data = {1.2345, 2.3456};
    std::vector<mynamespace::types::simple_enum> vec_enum_data = {mynamespace::types::simple_enum::another_value};
    std::vector<mynamespace::types::simple_struct> vec_simple_struct_data = {mynamespace::types::simple_struct{
        .f0 = 12345,
        .f1 = 23456,
        .f2 = 34567,
        .f3 = 45678,
        .f4 = 56789,
        .f5 = 67890,
        .f6 = 781,
        .f8 = 90,
    }};

    s.arr_var_size_struct[0].f1_vec = f1_vec_data0;
    s.arr_var_size_struct[1].f1_vec = f1_vec_data1;
    s.vec_float = vec_float_data;
    s.vec_enum = vec_enum_data;
    s.vec_simple_struct = vec_simple_struct_data;

    test_serialization(s);
}

TEST_F(Cpp17Test, ComplexStructView) {
    mynamespace::types::subspace::complex_struct s{};

    s.bitset0 = mynamespace::types::simple_bitset::two;
    s.arr_simple_struct[0].f3 = 3;
    s.arr_simple_struct[1].f3 = 5;
    s.arr_int[0] = 10;
    s.arr_int[1] = 20;
    s.arr_int[2] = 30;
    s.arr_int[3] = 40;
    s.arr_var_size_struct[0].f0 = 3;
    s.arr_var_size_struct[1].f0 = 5;
    s.str = "Hello messgen!";
    std::array<uint8_t, 8> bytes_buf{1, 2, 3, 4, 5, 6, 7, 8};
    s.bs = messgen::bytes(&bytes_buf);

    std::vector<int64_t> f1_vec_data0 = {12345, 23456};
    std::vector<int64_t> f1_vec_data1 = {1234, 2345};
    std::vector<double> vec_float_data = {1.2345, 2.3456};
    std::vector<mynamespace::types::simple_enum> vec_enum_data = {mynamespace::types::simple_enum::another_value};
    std::vector<mynamespace::types::simple_struct> vec_simple_struct_data = {mynamespace::types::simple_struct{
        .f0 = 12345,
        .f1 = 23456,
        .f2 = 34567,
        .f3 = 45678,
        .f4 = 56789,
        .f5 = 67890,
        .f6 = 781,
        .f8 = 90,
    }};

    s.arr_var_size_struct[0].f1_vec = messgen::span<int64_t>(&f1_vec_data0);
    s.arr_var_size_struct[1].f1_vec = messgen::span<int64_t>(&f1_vec_data1);
    s.vec_float = messgen::span<double>(&vec_float_data);
    s.vec_enum = messgen::span<mynamespace::types::simple_enum>(&vec_enum_data);
    s.vec_simple_struct = messgen::span<mynamespace::types::simple_struct>(&vec_simple_struct_data);

    test_serialization(s);
}

TEST_F(Cpp17Test, BitsetOperations) {
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

template <class Func, class... T>
constexpr void for_each(std::tuple<T...> &&obj, Func &&func) {
    std::apply([&]<class... M>(M &&...members) { (func(members), ...); }, obj);
}

TEST_F(Cpp17Test, MessageReflectionFieldNames) {
    using namespace messgen;

    auto s = mynamespace::types::subspace::complex_struct{};

    auto names = std::vector<std::string_view>{};
    for_each(members_of(reflect_object(s)), [&](auto &&param) { names.push_back(name_of(param)); });
    EXPECT_EQ(names.size(), 15);

    auto expected_names = std::vector<std::string_view>{"bitset0",
                                                        "arr_simple_struct",
                                                        "arr_int",
                                                        "arr_var_size_struct",
                                                        "vec_float",
                                                        "vec_enum",
                                                        "vec_simple_struct",
                                                        "vec_vec_var_size_struct",
                                                        "vec_arr_vec_int",
                                                        "str",
                                                        "bs",
                                                        "str_vec",
                                                        "map_str_by_int",
                                                        "map_vec_by_str",
                                                        "array_of_size_zero"};
    EXPECT_EQ(expected_names, names);
}

TEST_F(Cpp17Test, MessageReflection) {
    using namespace messgen;

    auto msg = mynamespace::proto::test_proto::complex_struct_msg{};
    EXPECT_EQ("mynamespace::proto::test_proto::complex_struct_msg", name_of(reflect_object(msg)));
}

TEST_F(Cpp17Test, EnumReflection) {
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

TEST_F(Cpp17Test, TypeTraits) {
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

TEST_F(Cpp17Test, ProtoHash) {
    using namespace messgen;

    constexpr auto hash_test_proto = hash_of(reflect_type<mynamespace::proto::test_proto>);
    constexpr auto hash_another_proto = hash_of<mynamespace::proto::subspace::another_proto>();
    EXPECT_NE(hash_another_proto, hash_test_proto);

    auto expected_hash = mynamespace::proto::test_proto::simple_struct_msg::HASH ^   //
                         mynamespace::proto::test_proto::complex_struct_msg::HASH ^  //
                         mynamespace::proto::test_proto::var_size_struct_msg::HASH ^ //
                         mynamespace::proto::test_proto::empty_struct_msg::HASH ^    //
                         mynamespace::proto::test_proto::flat_struct_msg::HASH;
    EXPECT_EQ(expected_hash, hash_test_proto);
    EXPECT_EQ(18394245099761547257U, hash_test_proto);
}

TEST_F(Cpp17Test, BytesPlain) {
    std::array<uint8_t, 2> buf{1, 2};
    messgen::bytes bs{&buf};
    EXPECT_EQ(1, bs.data()[0]);
    EXPECT_EQ(2, bs.data()[1]);
}

TEST_F(Cpp17Test, SerializeMessage) {
    using namespace messgen;

    mynamespace::types::simple_struct data{
        .f0 = 1,
        .f1 = 2,
    };
    mynamespace::proto::test_proto::simple_struct_msg::send msg{data};

    _buf.resize(msg.serialized_size());
    msg.serialize(_buf.data());
}

TEST_F(Cpp17Test, DispatchMessageStor) {
    using namespace messgen;

    auto expected = mynamespace::types::simple_struct{
        .f0 = 1,
        .f1 = 2,
    };
    _buf.resize(expected.serialized_size());
    expected.serialize(_buf.data());

    auto invoked = false;
    auto handler = [&](auto &&msg) {
        using RecvMsgType = std::decay_t<decltype(msg)>;
        typename RecvMsgType::data_type_stor actual_data;
        auto res = msg.deserialize(actual_data);
        assert(res == actual_data.FIXED_SIZE);

        if constexpr (std::is_same_v<RecvMsgType, mynamespace::proto::test_proto::simple_struct_msg::recv>) {
            EXPECT_EQ(expected.f0, actual_data.f0);
            EXPECT_EQ(expected.f1, actual_data.f1);
            invoked = true;
        } else {
            FAIL() << "Unexpected message type handled.";
        }
    };

    mynamespace::proto::test_proto::dispatch_message(mynamespace::proto::test_proto::simple_struct_msg::MESSAGE_ID, messgen::bytes{&_buf}, handler);

    EXPECT_TRUE(invoked);
}

TEST_F(Cpp17Test, DispatchMessageView) {
    using namespace messgen;

    auto expected = mynamespace::types::simple_struct{
        .f0 = 1,
        .f1 = 2,
    };
    _buf.resize(expected.serialized_size());
    expected.serialize(_buf.data());

    auto invoked = false;
    auto handler = [&](auto &&msg) {
        using ActualType = std::decay_t<decltype(msg)>;
        typename ActualType::data_type actual_data;
        if constexpr (not ActualType::data_type::NEED_ALLOC) {
            auto res = msg.deserialize(actual_data);
            assert(res == actual_data.FIXED_SIZE);
        }

        if constexpr (std::is_same_v<ActualType, mynamespace::proto::test_proto::simple_struct_msg::recv>) {
            EXPECT_EQ(expected.f0, actual_data.f0);
            EXPECT_EQ(expected.f1, actual_data.f1);
            invoked = true;
        } else {
            FAIL() << "Unexpected message type handled.";
        }
    };

    mynamespace::proto::test_proto::dispatch_message(mynamespace::proto::test_proto::simple_struct_msg::MESSAGE_ID, messgen::bytes{&_buf}, handler);

    EXPECT_TRUE(invoked);
}

TEST_F(Cpp17Test, ConstexprNameReflection) {
    using namespace messgen;

    constexpr auto name = name_of(reflect_type<std::map<std::string, std::array<std::vector<mynamespace::types::var_size_struct>, 4>>>);

    EXPECT_EQ("mynamespace::types::var_size_struct[][4]{string}", name);
}

TEST_F(Cpp17Test, MessageReflectionFieldTypes) {
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
        "int16[][4][]",
        "string",
        "bytes",
        "string[]",
        "string{int32}",
        "int32[]{string}",
        "int32[0]",
    };
    EXPECT_EQ(expected_types, types);
}
