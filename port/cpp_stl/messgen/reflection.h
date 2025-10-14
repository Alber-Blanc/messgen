#pragma once

#include <cstddef>
#include <messgen/reflection_common.h>

#include <string_view>
#include <vector>
#include <map>

namespace messgen {

[[nodiscard]] constexpr std::string_view name_of(reflect_t<std::string>) noexcept;

template <class T, auto N>
[[nodiscard]] constexpr std::string_view name_of(reflect_t<std::array<T, N>>);

template <class T>
[[nodiscard]] constexpr std::string_view name_of(reflect_t<std::vector<T>>);

template <class K, class V>
[[nodiscard]] constexpr std::string_view name_of(reflect_t<std::map<K, V>>);

namespace detail {

constexpr size_t digits10(auto num) {
    size_t count = 0;
    while (num) {
        ++count;
        num /= 10;
    }
    return count;
}

template <size_t N>
constexpr static auto to_chars = [] {
    auto result = std::array<char, digits10(N) + 1>{};
    auto *ptr = result.data();
    auto num = N;
    while (num) {
        *ptr++ = char('0' + num % 10);
        num /= 10;
    }
    *ptr = '\0';
    return std::pair{result, result.size() - 1};
}();

template <class T>
constexpr static auto components = nullptr;

template <class T, auto N>
constexpr static auto components<std::array<T, N>> = std::array{std::string_view{"array<"}, name_of(reflect_type<T>), std::string_view{", "},
                                                                std::string_view{to_chars<N>.first.data(), to_chars<N>.second}, std::string_view{">"}};

template <class T>
constexpr static auto components<std::vector<T>> = std::array{std::string_view{"vector<"}, name_of(reflect_type<T>), std::string_view{">"}};

template <class K, class V>
constexpr static auto components<std::map<K, V>> =
    std::array{std::string_view{"map<"}, name_of(reflect_type<K>), std::string_view{", "}, name_of(reflect_type<V>), std::string_view{">"}};

template <size_t N>
constexpr size_t concat_size(std::array<std::string_view, N> strs) {
    size_t size = 0;
    for (size_t i = 0; i < N; ++i) {
        size += strs[i].size();
    }
    return size;
}

template <class T>
constexpr static auto concat = []() {
    constexpr auto strs = components<T>;
    auto storage = std::array<char, concat_size(strs) + 1>{};
    auto *ptr = storage.data();
    for (auto str : strs) {
        for (char c : str) {
            *ptr++ = c;
        }
    }
    *ptr = '\0';
    return std::pair{storage, concat_size(strs)};
}();

} // namespace detail

[[nodiscard]] constexpr std::string_view name_of(reflect_t<std::string>) noexcept {
    return "string";
}

template <class T, auto N>
[[nodiscard]] constexpr std::string_view name_of(reflect_t<std::array<T, N>>) {
    auto &[arr, size] = detail::concat<std::array<T, N>>;
    return std::string_view{arr.data(), size};
}

template <class T>
[[nodiscard]] constexpr std::string_view name_of(reflect_t<std::vector<T>>) {
    auto &[arr, size] = detail::concat<std::vector<T>>;
    return std::string_view{arr.data(), size};
}

template <class K, class V>
[[nodiscard]] constexpr std::string_view name_of(reflect_t<std::map<K, V>>) {
    auto &[arr, size] = detail::concat<std::map<K, V>>;
    return std::string_view{arr.data(), size};
}

} // namespace messgen
