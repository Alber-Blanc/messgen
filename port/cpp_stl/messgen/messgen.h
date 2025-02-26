#pragma once

#include "concepts.h"
#include "reflection.h"

#include <cstdint>

namespace messgen {

template <protocol Protocol>
consteval auto members_of() {
    return members_of(reflect_type<Protocol>);
}

template <message Message>
consteval int hash_of(reflect_t<Message>) {
    return Message::HASH;
}

template <protocol Protocol>
consteval int hash_of(reflect_t<Protocol>) {
    auto hash = 0;
    auto combine = [&hash](auto... members) { hash = (hash_of(type_of(members)) ^ ...); };
    std::apply(combine, members_of(reflect_type<Protocol>));
    return hash;
}

template <class T>
    requires(protocol<T> || message<T>)
consteval int hash_of() {
    return hash_of(reflect_type<T>);
}

using size_type = uint32_t;

} // namespace messgen
