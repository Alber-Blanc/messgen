#pragma once

#include "vector.h"

#include <messgen/reflection_common.h>

namespace messgen {

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
