#pragma once

#if __cplusplus >= 202002L
#include "concepts.h"
#include "reflection.h"
#endif

#include <cstdint>

namespace messgen {

#if __cplusplus >= 202002L

template <protocol Protocol>
consteval auto members_of() {
    return members_of(reflect_type<Protocol>);
}

template <message Message>
consteval uint64_t hash_of(reflect_t<Message>) {
    return Message::HASH;
}

template <protocol Protocol>
consteval uint64_t hash_of(reflect_t<Protocol>) {
    auto hash = uint64_t{0};
    auto combine = [&hash](auto... members) { hash = (hash_of(type_of(members)) ^ ...); };
    std::apply(combine, members_of(reflect_type<Protocol>));
    return hash;
}

template <class T>
    requires(protocol<T> || message<T>)
consteval uint64_t hash_of() {
    return hash_of(reflect_type<T>);
}

#endif

using size_type = uint32_t;

} // namespace messgen
