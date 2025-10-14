#pragma once

#include "traits_common.h"

#include <string>
#include <string_view>
#include <array>
#include <cstdint>
#include <type_traits>
#include <utility>

namespace messgen {

template <class T>
using reflect_t = T *; // we could use a hard type instead, but that would incur
                       // a penalty on compile time

template <class T>
using splice_t = std::remove_pointer_t<T>;

template <class T>
constexpr reflect_t<remove_cvref_t<T>> reflect_type = {};

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
    return "uint8";
}

[[nodiscard]] constexpr std::string_view name_of(reflect_t<int8_t>) noexcept {
    return "int8";
}

[[nodiscard]] constexpr std::string_view name_of(reflect_t<uint16_t>) noexcept {
    return "uint16";
}

[[nodiscard]] constexpr std::string_view name_of(reflect_t<int16_t>) noexcept {
    return "int16";
}

[[nodiscard]] constexpr std::string_view name_of(reflect_t<uint32_t>) noexcept {
    return "uint32";
}

[[nodiscard]] constexpr std::string_view name_of(reflect_t<int32_t>) noexcept {
    return "int32";
}

[[nodiscard]] constexpr std::string_view name_of(reflect_t<uint64_t>) noexcept {
    return "uint64";
}

[[nodiscard]] constexpr std::string_view name_of(reflect_t<int64_t>) noexcept {
    return "int64";
}

[[nodiscard]] constexpr std::string_view name_of(reflect_t<float>) noexcept {
    return "float32";
}

[[nodiscard]] constexpr std::string_view name_of(reflect_t<double>) noexcept {
    return "float64";
}

template <typename T>
constexpr std::string_view name_of(reflect_t<std::basic_string_view<T>>) {
    return "string";
}

namespace detail {

template <class T>
constexpr static auto composite_name_of = nullptr;

constexpr size_t num_chars(auto num) {
    size_t count = 0;
    while (num) {
        ++count;
        num /= 10;
    }
    return count;
}

template <size_t N>
constexpr size_t num_chars(std::array<std::string_view, N> strs) {
    size_t size = 0;
    for (auto &str : strs) {
        size += str.size();
    }
    return size;
}

template <size_t N>
constexpr static auto chars_of = [] {
    auto result = std::array<char, num_chars(N) + 1>{};
    auto *ptr = result.data();
    auto num = N;
    while (num) {
        *ptr++ = char('0' + num % 10);
        num /= 10;
    }
    *ptr = '\0';
    return std::pair{result, num_chars(N)};
}();

template <class T>
constexpr static auto name_storage_of = []() {
    constexpr auto strs = composite_name_of<T>;
    auto result = std::array<char, num_chars(strs) + 1>{};
    auto *ptr = result.data();
    for (auto str : strs) {
        for (char c : str) {
            *ptr++ = c;
        }
    }
    *ptr = '\0';
    return std::pair{result, num_chars(strs)};
}();

} // namespace detail

} // namespace messgen
