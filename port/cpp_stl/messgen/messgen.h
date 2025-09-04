#pragma once

#if __cplusplus >= 202002L
#include "concepts.h"
#endif

#include "traits.h"
#include "reflection.h"

#include <cstdint>
#include <type_traits>

namespace messgen {

template <class Protocol>
constexpr auto members_of() -> std::enable_if_t<is_protocol_v<Protocol>, decltype(members_of(reflect_type<Protocol>))> {
    constexpr auto members = members_of(reflect_type<Protocol>);
    return members;
}

template <class Message>
constexpr auto hash_of(reflect_t<Message>) -> std::enable_if_t<is_message_v<Message>, uint64_t> {
    constexpr auto hash = Message::HASH;
    return hash;
}

template <class Protocol>
constexpr auto hash_of(reflect_t<Protocol>) -> std::enable_if_t<is_protocol_v<Protocol>, uint64_t> {
    auto hash = uint64_t{0};
    auto combine = [&hash](auto... members) { hash = (hash_of(type_of(members)) ^ ...); };
    std::apply(combine, members_of(reflect_type<Protocol>));
    return hash;
}

template <class T>
constexpr auto hash_of() -> std::enable_if_t<is_protocol_v<T> || is_message_v<T>, uint64_t> {
    constexpr auto hash = hash_of(reflect_type<T>);
    return hash;
}

using size_type = uint32_t;

} // namespace messgen
