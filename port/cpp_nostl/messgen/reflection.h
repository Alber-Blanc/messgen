#pragma once

#include "traits.h"

#include <cstdint>
#include <string>
#include <vector>
#include <array>

namespace messgen {

template <class T>
using reflect_t = T *; // we could use a hard type instead, but that would incur
                       // a penalty on compile time

template <class T>
using splice_t = std::remove_pointer_t<T>;

template <class T>
constexpr reflect_t<T> reflect_type = {};

template <class T>
constexpr reflect_t<remove_cvref_t<T>> reflect_object(T &&t) {
    return &t;
}

template <class C, class M>
struct member {
    using class_type = C;
    using member_type = remove_cvref_t<M>;

    const char *name;
};

template <class T>
struct enumerator_value : member<T, T> {
    T value;
};

template <class T>
enumerator_value(const char *, T) -> enumerator_value<T>;

template <class C, class M>
struct member_variable : member<C, M> {
    using pointer_type = M C::*;
    using member<C, M>::name;

    pointer_type ptr;
};

template <class C, class M>
member_variable(const char *, M C::*) -> member_variable<C, M>;

template <class S, class C, class M>
[[nodiscard]] constexpr auto value_of(S &obj, const member_variable<C, M> &m) noexcept
    -> std::enable_if_t<std::is_same_v<remove_cvref_t<S>, remove_cvref_t<C>>, std::add_lvalue_reference_t<typename member_variable<C, M>::member_type>> {
    return obj.*m.ptr;
}

template <class S, class C, class M>
[[nodiscard]] constexpr auto value_of(const S &obj, const member_variable<C, M> &m) noexcept
    -> std::enable_if_t<std::is_same_v<remove_cvref_t<S>, remove_cvref_t<C>>, std::add_lvalue_reference_t<const typename member_variable<C, M>::member_type>> {
    return obj.*m.ptr;
}

template <class E>
[[nodiscard]] constexpr decltype(auto) value_of(const enumerator_value<E> &e) noexcept {
    return e.value;
}

template <class C, class M>
[[nodiscard]] constexpr auto parent_of(const member<C, M> &) noexcept {
    return reflect_type<typename member<C, M>::class_type>;
}

template <class C, class M>
[[nodiscard]] constexpr auto type_of(const member<C, M> &) noexcept {
    return reflect_type<typename member<C, M>::member_type>;
}

template <class C, class M>
[[nodiscard]] constexpr std::string_view name_of(const member<C, M> &m) noexcept {
    return m.name;
}

template <class T>
[[nodiscard]] constexpr auto name_of(reflect_t<T>) noexcept -> std::enable_if_t<has_name_member<T>::value, std::string_view> {
    return T::NAME;
}

template <class T>
[[nodiscard]] constexpr auto name_of(reflect_t<T> r) noexcept -> std::enable_if_t<std::is_enum_v<T>, std::string_view> {
    return name_of(r);
}

[[nodiscard]] constexpr std::string_view name_of(reflect_t<bool>) noexcept {
    return "bool";
}

[[nodiscard]] constexpr std::string_view name_of(reflect_t<uint8_t>) noexcept {
    return "uint8_t";
}

[[nodiscard]] constexpr std::string_view name_of(reflect_t<int8_t>) noexcept {
    return "int8_t";
}

[[nodiscard]] constexpr std::string_view name_of(reflect_t<uint16_t>) noexcept {
    return "uint16_t";
}

[[nodiscard]] constexpr std::string_view name_of(reflect_t<int16_t>) noexcept {
    return "int16_t";
}

[[nodiscard]] constexpr std::string_view name_of(reflect_t<uint32_t>) noexcept {
    return "uint32_t";
}

[[nodiscard]] constexpr std::string_view name_of(reflect_t<int32_t>) noexcept {
    return "int32_t";
}

[[nodiscard]] constexpr std::string_view name_of(reflect_t<uint64_t>) noexcept {
    return "uint64_t";
}

[[nodiscard]] constexpr std::string_view name_of(reflect_t<int64_t>) noexcept {
    return "int64_t";
}

[[nodiscard]] constexpr std::string_view name_of(reflect_t<float>) noexcept {
    return "float";
}

[[nodiscard]] constexpr std::string_view name_of(reflect_t<double>) noexcept {
    return "double";
}

[[nodiscard]] constexpr std::string_view name_of(reflect_t<std::string>) noexcept {
    return "string";
}

template <class T>
[[nodiscard]] std::string_view name_of(reflect_t<std::vector<T>>) {
    static auto name = "vector<" + std::string(name_of(reflect_type<T>)) + ">";
    return name.c_str();
}

template <std::size_t N>
struct ConstexprString {
    char data[N + 1]{};
    std::size_t size = 0;

    constexpr void append(std::string_view str) {
        for (char c : str) {
            if (size < N) {
                data[size++] = c;
            }
        }
        data[size] = '\0';
    }

    constexpr void append(char c) {
        if (size < N) {
            data[size++] = c;
            data[size] = '\0';
        }
    }

    constexpr std::string_view view() const {
        return std::string_view{data, size};
    }
};

template <std::size_t MaxDigits = 20>
constexpr std::array<char, MaxDigits> uint_to_string(std::size_t value) {
    std::array<char, MaxDigits> buf{};
    std::size_t pos = MaxDigits;
    do {
        buf[--pos] = char('0' + (value % 10));
        value /= 10;
    } while (value && pos > 0);

    return buf;
}

template <typename T, std::size_t N>
constexpr std::string_view name_of(reflect_t<std::array<T, N>>) {
    constexpr auto type_name = name_of(reflect_type<T>);
    constexpr auto n_str = uint_to_string(N);

    constexpr ConstexprString<128> buffer = [&]() constexpr {
        ConstexprString<128> result;
        result.append(type_name);
        result.append("[");
        result.append(std::string_view(n_str.data(), n_str.size()));
        result.append("]");
        return result;
    }();

    return buffer.view();
}

// Forward declaration
template <class T>
struct vector;

template <typename T>
constexpr std::string_view name_of(reflect_t<messgen::vector<T>>) {
    constexpr auto type_name = name_of(reflect_type<T>);
    constexpr ConstexprString<64> buffer = []() constexpr {
        ConstexprString<64> result;
        result.append(type_name);
        result.append("[]");
        return result;
    }();

    return buffer.view();
}

template <typename T>
constexpr std::string_view name_of(reflect_t<std::basic_string_view<T>>) {
    constexpr ConstexprString<64> buffer = []() constexpr {
        ConstexprString<64> result;
        result.append("string");
        return result;
    }();

    return buffer.view();
}

} // namespace messgen
