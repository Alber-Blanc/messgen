#pragma once

#if __cplusplus < 202002L
#error "C++20 or higher is required"
#endif

#include <messgen/bytes.h>
#include <messgen/reflection.h>

#include <concepts>
#include <cstddef>
#include <cstdint>
#include <type_traits>

namespace messgen {
namespace detail {

struct noop_fn {
    template <class T>
    void operator()(T) const noexcept {
    }
};

} // namespace detail

template <class T>
concept enumeration = std::is_enum_v<T> && requires(T t) {
    { enumerators_of(messgen::reflect_object(t)) };
};

template <class Type>
concept serializable = requires(std::remove_cvref_t<Type> msg, uint8_t *buf, messgen::bytes buf_bytes, messgen::Allocator &alloc) {
    { msg.serialized_size() } -> std::same_as<size_t>;
    { msg.serialize(buf) } -> std::same_as<size_t>;
    requires(
        requires {
            { msg.deserialize(buf_bytes) } -> std::same_as<ssize_t>;
            { msg.deserialize_unsafe(buf_bytes.data()) } -> std::same_as<ssize_t>;
        } ||
        requires {
            { msg.deserialize(buf_bytes, alloc) } -> std::same_as<ssize_t>;
            { msg.deserialize_unsafe(buf_bytes.data(), alloc) } -> std::same_as<ssize_t>;
        });
};

template <class Type>
concept type = serializable<Type> && requires(std::remove_cvref_t<Type> msg) {
    { msg.NAME } -> std::convertible_to<std::string_view>;
    { msg.SCHEMA } -> std::convertible_to<std::string_view>;
    { msg.IS_FLAT } -> std::convertible_to<bool>;
};

template <class Type>
concept flat_type = type<Type> && std::remove_cvref_t<Type>::IS_FLAT;

template <class Message>
concept message = type<typename std::remove_cvref_t<Message>::data_type> && requires(std::remove_cvref_t<Message> msg, typename std::remove_cvref_t<Message>::data_type &data, uint8_t *buf) {
    { msg.PROTO_ID } -> std::convertible_to<int>;
    { msg.MESSAGE_ID } -> std::convertible_to<int>;
    { msg.serialized_size() } -> std::same_as<size_t>;
    { msg.serialize(buf) } -> std::same_as<size_t>;
    { msg.deserialize(data) } -> std::same_as<ssize_t>;
    { msg.deserialize_unsafe(data) } -> std::same_as<ssize_t>;
};

template <class Protocol>
concept protocol = requires(std::remove_cvref_t<Protocol> proto, int msg_id, messgen::bytes payload, detail::noop_fn fn) {
    { proto.PROTO_ID } -> std::convertible_to<int>;
    { proto.reflect_message(msg_id, fn) } -> std::same_as<void>;
    { proto.dispatch_message(msg_id, payload, fn) } -> std::same_as<bool>;
};

} // namespace messgen
