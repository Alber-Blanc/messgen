#pragma once

#include "bytes.h"
#include "concepts.h"
#include "decimal.h"
#include "span.h"

#include <cstdint>
#include <fmt/format.h>

namespace messgen {

template <typename T>
constexpr std::string_view unqual_name_of(T &&r) noexcept {
    auto name = messgen::name_of(r);
    if (auto qual_pos = name.find_last_of(":"); qual_pos != std::string::npos) {
        return name.substr(qual_pos + 1);
    }
    return name;
}

} // namespace messgen

namespace fmt {

namespace detail {

template <typename T>
struct MessgenFormat {
    explicit MessgenFormat(const T &val)
        : value(val) {
    }

    const T &value;
};

} // namespace detail

#if defined(MESSGEN_DEC_FP)
template <>
struct formatter<messgen::decimal64> {
    constexpr auto parse(format_parse_context &ctx) -> decltype(ctx.begin()) {
        return ctx.end();
    }

    template <class FormatContext>
    auto format(messgen::decimal64 dec, FormatContext &ctx) const -> decltype(ctx.out()) {
        return fmt::format_to(ctx.out(), "{}", dec.to_string());
    }
};
#endif

template <messgen::type T>
struct formatter<T> {
    constexpr auto parse(format_parse_context &ctx) -> decltype(ctx.begin()) {
        return ctx.end();
    }

    template <class FormatContext>
    auto format(const T &msg, FormatContext &ctx) const -> decltype(ctx.out()) {
        return fmt::format_to(ctx.out(), "{}", detail::MessgenFormat{msg});
    }
};

template <messgen::message T>
struct formatter<T> {
    constexpr auto parse(format_parse_context &ctx) -> decltype(ctx.begin()) {
        return ctx.end();
    }

    template <class FormatContext>
    auto format(const T &msg, FormatContext &ctx) const -> decltype(ctx.out()) {
        return fmt::format_to(ctx.out(), "{{data={}}}", detail::MessgenFormat{msg.data});
    }
};

template <messgen::enumeration E>
struct formatter<E> {
    constexpr auto parse(format_parse_context &ctx) -> decltype(ctx.begin()) {
        return ctx.begin();
    }

    template <class FormatContext>
    auto format(E en, FormatContext &ctx) const -> decltype(ctx.out()) {
        return fmt::format_to(ctx.out(), "{}", detail::MessgenFormat{en});
    }
};

template <messgen::type T>
struct formatter<detail::MessgenFormat<T>> {
    constexpr auto parse(format_parse_context &ctx) -> decltype(ctx.begin()) {
        return ctx.end();
    }

    template <class FormatContext>
    auto format(const detail::MessgenFormat<T> &msg, FormatContext &ctx) const -> decltype(ctx.out()) {
        auto do_format = [&ctx]<class U>(U &&msg) {
            constexpr auto info = messgen::reflect_type<std::remove_cvref_t<U>>;
            fmt::format_to(ctx.out(), "{{");
            std::apply(
                [&](auto &&member_first, auto &&...members_rest) {
                    fmt::format_to(ctx.out(), "{}={}", messgen::unqual_name_of(member_first), //
                                   detail::MessgenFormat{messgen::value_of(msg, member_first)});
                    ((fmt::format_to(ctx.out(), " {}={}", messgen::unqual_name_of(members_rest), //
                                     detail::MessgenFormat{messgen::value_of(msg, members_rest)})),
                     ...);
                },
                members_of(info));
            return fmt::format_to(ctx.out(), "}}");
        };
        if constexpr (messgen::message<std::remove_cvref_t<T>>) {
            return do_format(static_cast<const typename std::remove_cvref_t<T>::data_type &>(msg.value));
        } else {
            return do_format(msg.value);
        }
    }
};

template <messgen::enumeration E>
struct formatter<detail::MessgenFormat<E>> {
    constexpr auto parse(format_parse_context &ctx) -> decltype(ctx.begin()) {
        return ctx.begin();
    }

    template <class FormatContext>
    auto format(const detail::MessgenFormat<E> &en, FormatContext &ctx) const -> decltype(ctx.out()) {
        auto out = ctx.out();
        auto print = [&](auto &&enumerator) {
            if (en.value == messgen::value_of(enumerator)) {
                out = fmt::format_to(ctx.out(), "{}", messgen::unqual_name_of(enumerator));
            }
        };
        std::apply([&](auto &&...enumerator) { (print(enumerator), ...); }, enumerators_of(messgen::reflect_type<E>));
        return out;
    }
};

template <class K, class V, class Compare, class Allocator>
struct formatter<detail::MessgenFormat<std::map<K, V, Compare, Allocator>>> {
    constexpr auto parse(format_parse_context &ctx) -> decltype(ctx.begin()) {
        return ctx.end();
    }

    template <class FormatContext>
    auto format(const detail::MessgenFormat<std::map<K, V, Compare, Allocator>> &map, FormatContext &ctx) const -> decltype(ctx.out()) {
        fmt::format_to(ctx.out(), "{{");
        auto it = map.value.begin();
        auto end = map.value.end();
        if (it != end) {
            fmt::format_to(ctx.out(), "{}:{}", it->first, detail::MessgenFormat{it->second});
            ++it;
        }
        for (; it != end; ++it) {
            fmt::format_to(ctx.out(), ", {}:{}", it->first, detail::MessgenFormat{it->second});
        }
        return fmt::format_to(ctx.out(), "}}");
    }
};

template <class T, class Allocator>
struct formatter<detail::MessgenFormat<std::vector<T, Allocator>>> {
    constexpr auto parse(format_parse_context &ctx) -> decltype(ctx.begin()) {
        return ctx.end();
    }

    template <class FormatContext>
    auto format(const detail::MessgenFormat<std::vector<T, Allocator>> &vec, FormatContext &ctx) const -> decltype(ctx.out()) {
        return fmt::format_to(ctx.out(), "{}", detail::MessgenFormat{messgen::span<T>{vec.value.data(), vec.value.size()}});
    }
};

template <class T, std::size_t N>
struct formatter<detail::MessgenFormat<std::array<T, N>>> {
    constexpr auto parse(format_parse_context &ctx) -> decltype(ctx.begin()) {
        return ctx.end();
    }

    template <class FormatContext>
    auto format(const detail::MessgenFormat<std::array<T, N>> &arr, FormatContext &ctx) const -> decltype(ctx.out()) {
        return fmt::format_to(ctx.out(), "{}", detail::MessgenFormat{messgen::span<T>{arr.value.data(), arr.value.size()}});
    }
};

template <>
struct formatter<detail::MessgenFormat<messgen::bytes>> {
    constexpr auto parse(format_parse_context &ctx) -> decltype(ctx.begin()) {
        return ctx.end();
    }

    template <class FormatContext>
    auto format(const detail::MessgenFormat<messgen::bytes> &bytes, FormatContext &ctx) const -> decltype(ctx.out()) {
        return fmt::format_to(ctx.out(), "{}", detail::MessgenFormat{messgen::span<uint8_t>{bytes.value.data(), bytes.value.size()}});
    }
};

template <class T>
struct formatter<detail::MessgenFormat<messgen::span<T>>> {
    constexpr auto parse(format_parse_context &ctx) -> decltype(ctx.begin()) {
        return ctx.end();
    }

    template <class FormatContext>
    auto format(const detail::MessgenFormat<messgen::span<T>> &span, FormatContext &ctx) const -> decltype(ctx.out()) {
        fmt::format_to(ctx.out(), "[");
        auto it = span.value.begin();
        auto end = span.value.end();
        if (it != end) {
            fmt::format_to(ctx.out(), "{}", detail::MessgenFormat{*it});
            ++it;
        }
        for (; it != end; ++it) {
            fmt::format_to(ctx.out(), ", {}", detail::MessgenFormat{*it});
        }
        return fmt::format_to(ctx.out(), "]");
    }
};

template <class T, class Traits>
struct formatter<detail::MessgenFormat<std::basic_string_view<T, Traits>>> {
    constexpr auto parse(format_parse_context &ctx) -> decltype(ctx.begin()) {
        return ctx.end();
    }

    template <class FormatContext>
    auto format(const detail::MessgenFormat<std::basic_string_view<T, Traits>> &str, FormatContext &ctx) const -> decltype(ctx.out()) {
        for (auto ch : str.value) {
            fmt::format_to(ctx.out(), "{}", ch);
        }
        return ctx.out();
    }
};

template <class T, class Traits, class Allocator>
struct formatter<detail::MessgenFormat<std::basic_string<T, Traits, Allocator>>> {
    constexpr auto parse(format_parse_context &ctx) -> decltype(ctx.begin()) {
        return ctx.end();
    }

    template <class FormatContext>
    auto format(const detail::MessgenFormat<std::basic_string<T, Traits, Allocator>> &str, FormatContext &ctx) const -> decltype(ctx.out()) {
        return fmt::format_to(ctx.out(), "\"{}\"", str.value);
    }
};

template <class T>
    requires std::is_arithmetic_v<T>
struct formatter<detail::MessgenFormat<T>> {
    constexpr auto parse(format_parse_context &ctx) -> decltype(ctx.begin()) {
        return ctx.end();
    }

    template <class FormatContext>
    auto format(const detail::MessgenFormat<T> &v, FormatContext &ctx) const -> decltype(ctx.out()) {
        return fmt::format_to(ctx.out(), "{}", v.value);
    }
};

#if defined(MESSGEN_DEC_FP)
template <>
struct formatter<detail::MessgenFormat<messgen::decimal64>> {
    constexpr auto parse(format_parse_context &ctx) -> decltype(ctx.begin()) {
        return ctx.end();
    }

    template <class FormatContext>
    auto format(const detail::MessgenFormat<messgen::decimal64> &v, FormatContext &ctx) const -> decltype(ctx.out()) {
        return fmt::format_to(ctx.out(), "{}", v.value);
    }
};
#endif

} // namespace fmt
