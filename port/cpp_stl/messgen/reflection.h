#pragma once

#include <messgen/reflection_common.h>

#include <map>
#include <string>
#include <vector>

namespace messgen {

[[nodiscard]] constexpr std::string_view name_of(reflect_t<std::string>) noexcept {
    return "string";
}

template <class T, auto N>
[[nodiscard]] constexpr std::string_view name_of(reflect_t<std::array<T, N>>) {
    auto &[arr, size] = detail::name_storage_of<std::array<T, N>>;
    return std::string_view{arr.data(), size};
}

template <class T>
[[nodiscard]] constexpr std::string_view name_of(reflect_t<std::vector<T>>) {
    auto &[arr, size] = detail::name_storage_of<std::vector<T>>;
    return std::string_view{arr.data(), size};
}

template <class K, class V>
[[nodiscard]] constexpr std::string_view name_of(reflect_t<std::map<K, V>>) {
    auto &[arr, size] = detail::name_storage_of<std::map<K, V>>;
    return std::string_view{arr.data(), size};
}

namespace detail {

// clang-format off
template <class T, auto N>
constexpr static auto composite_name_of<std::array<T, N>> = std::array{
    name_of(reflect_type<T>),
    std::string_view{"["},
    std::string_view{chars_of<N>.first.data(), chars_of<N>.second},
    std::string_view{"]"}
};

template <class T>
constexpr static auto composite_name_of<std::vector<T>> = std::array{
    name_of(reflect_type<T>),
    std::string_view{"[]"}
};

template <class K, class V>
constexpr static auto composite_name_of<std::map<K, V>> = std::array{
    name_of(reflect_type<V>),
    std::string_view{"{"},
    name_of(reflect_type<K>),
    std::string_view{"}"},
};
// clang-format on

} // namespace detail
} // namespace messgen
