#pragma once

#include <messgen/reflection_common.h>

#include <string>
#include <vector>
#include <map>

namespace messgen {

[[nodiscard]] constexpr std::string_view name_of(reflect_t<std::string>) noexcept {
    return "string";
}

template <class T>
[[nodiscard]] std::string_view name_of(reflect_t<std::vector<T>>);

template <class K, class V>
[[nodiscard]] std::string_view name_of(reflect_t<std::map<K, V>>);

template <class T, auto N>
[[nodiscard]] std::string_view name_of(reflect_t<std::array<T, N>>) {
    static auto name = "array<" + std::string(name_of(reflect_type<T>)) + ", " + std::to_string(N) + ">";
    return name.c_str();
}

template <class T>
[[nodiscard]] std::string_view name_of(reflect_t<std::vector<T>>) {
    static auto name = "vector<" + std::string(name_of(reflect_type<T>)) + ">";
    return name.c_str();
}

template <class K, class V>
[[nodiscard]] std::string_view name_of(reflect_t<std::map<K, V>>) {
    static auto name = "map<" + std::string(name_of(reflect_type<K>)) + ", " + std::string(name_of(reflect_type<V>)) + ">";
    return name.c_str();
}

} // namespace messgen
