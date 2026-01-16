#pragma once

#include <sys/types.h>
#include <cstdint>
#include <cstring>
#include <type_traits>

namespace messgen {

class bytes;

template <class T>
struct remove_cvref {
    using type = std::remove_cv_t<std::remove_reference_t<T>>;
};

template <class T>
using remove_cvref_t = typename remove_cvref<T>::type;

template <typename T, typename = void>
struct has_name_member : std::false_type {};

template <typename T>
struct has_name_member<T, std::void_t<decltype(T::NAME)>> : std::bool_constant<std::is_object_v<decltype(T::NAME)>> {};

template <typename T>
inline constexpr bool has_name_member_v = has_name_member<T>::value;

template <typename T, typename = void>
struct has_schema_member : std::false_type {};

template <typename T>
struct has_schema_member<T, std::void_t<decltype(T::SCHEMA)>> : std::bool_constant<std::is_object_v<decltype(T::SCHEMA)>> {};

template <typename T>
inline constexpr bool has_schema_member_v = has_schema_member<T>::value;

template <typename T, typename = void>
struct has_is_flat_member : std::false_type {};

template <typename T>
struct has_is_flat_member<T, std::void_t<decltype(T::IS_FLAT)>> : std::bool_constant<std::is_object_v<decltype(T::IS_FLAT)>> {};

template <typename T>
inline constexpr bool has_is_flat_member_v = has_is_flat_member<T>::value;

template <typename T, typename = void>
struct has_serialized_size_method : std::false_type {};

template <typename T>
struct has_serialized_size_method<T, std::void_t<decltype(static_cast<size_t (T::*)() const>(&T::serialized_size))>> : std::true_type {};

template <typename T>
inline constexpr bool has_serialized_size_method_v = has_serialized_size_method<T>::value;

template <typename T, typename = void>
struct has_serialize_method : std::false_type {};

template <typename T>
struct has_serialize_method<T, std::void_t<decltype(static_cast<size_t (T::*)(uint8_t *) const>(&T::serialize))>> : std::true_type {};

template <typename T>
inline constexpr bool has_serialize_method_v = has_serialize_method<T>::value;

template <typename T, typename = void>
struct has_deserialize_method : std::false_type {};

template <typename T>
struct has_deserialize_method<T, std::void_t<decltype(static_cast<ssize_t (T::*)(messgen::bytes)>(&T::deserialize))>> : std::true_type {};

template <typename T>
inline constexpr bool has_deserialize_method_v = has_deserialize_method<T>::value;

template <typename T, typename = void>
struct has_deserialize_alloc_method : std::false_type {};

class Allocator;

template <typename T>
struct has_deserialize_alloc_method<T, std::void_t<decltype(static_cast<ssize_t (T::*)(messgen::bytes, Allocator &)>(&T::deserialize))>> : std::true_type {
};

template <typename T>
inline constexpr bool has_deserialize_alloc_method_v = has_deserialize_alloc_method<T>::value;

template <class T>
struct is_serializable : std::bool_constant<has_serialized_size_method_v<T> && //
                                            has_serialize_method_v<T> &&       //
                                            (has_deserialize_method_v<T> || has_deserialize_alloc_method_v<T>)> {};

template <class T>
inline constexpr bool is_serializable_v = messgen::is_serializable<T>::value;

template <class T>
struct is_type : std::bool_constant<is_serializable_v<T> && has_name_member_v<T> && has_schema_member_v<T> && has_is_flat_member_v<T>> {};

template <class T>
inline constexpr bool is_type_v = messgen::is_type<T>::value;

template <class T>
struct is_flat_type : std::bool_constant<is_type_v<T> && T::IS_FLAT> {};

template <class T>
inline constexpr bool is_flat_type_v = messgen::is_flat_type<T>::value;

// Forward declaration for detail namespace
namespace detail {
struct noop_fn;
}

// Helper traits for message concept
template <typename T, typename = void>
struct has_proto_id_member : std::false_type {};

template <typename T>
struct has_proto_id_member<T, std::void_t<decltype(T::PROTO_ID)>> : std::bool_constant<std::is_convertible_v<decltype(T::PROTO_ID), int>> {};

template <typename T>
inline constexpr bool has_proto_id_member_v = has_proto_id_member<T>::value;

template <typename T, typename = void>
struct has_message_id_member : std::false_type {};

template <typename T>
struct has_message_id_member<T, std::void_t<decltype(T::MESSAGE_ID)>> : std::bool_constant<std::is_convertible_v<decltype(T::MESSAGE_ID), int>> {};

template <typename T>
inline constexpr bool has_message_id_member_v = has_message_id_member<T>::value;

template <typename T, typename = void>
struct has_data_member : std::false_type {};

template <typename T>
struct has_data_member<T, std::void_t<decltype(std::declval<T>().data)>>
    : std::bool_constant<std::is_convertible_v<decltype(std::declval<T>().data), typename remove_cvref_t<T>::data_type>> {};

template <typename T>
inline constexpr bool has_data_member_v = has_data_member<T>::value;

// Helper traits for protocol concept
template <typename T, typename = void>
struct has_reflect_message_method : std::false_type {};

template <typename T>
struct has_reflect_message_method<T, std::void_t<decltype(std::declval<T>().reflect_message(std::declval<int>(), std::declval<detail::noop_fn>()))>>
    : std::bool_constant<std::is_same_v<void, decltype(std::declval<T>().reflect_message(std::declval<int>(), std::declval<detail::noop_fn>()))>> {};

template <typename T>
inline constexpr bool has_reflect_message_method_v = has_reflect_message_method<T>::value;

template <typename T, typename = void>
struct has_dispatch_message_method : std::false_type {};

template <typename T>
struct has_dispatch_message_method<
    T, std::void_t<decltype(std::declval<T>().dispatch_message(std::declval<int>(), std::declval<messgen::bytes>(), std::declval<detail::noop_fn>()))>>
    : std::bool_constant<std::is_same_v<bool, decltype(std::declval<T>().dispatch_message(std::declval<int>(), std::declval<messgen::bytes>(),
                                                                                          std::declval<detail::noop_fn>()))>> {};

template <typename T>
inline constexpr bool has_dispatch_message_method_v = has_dispatch_message_method<T>::value;

template <typename T, typename = void>
struct has_data_type_member : std::false_type {};

template <typename T>
struct has_data_type_member<T, std::void_t<typename T::data_type>> : std::bool_constant<is_type_v<typename T::data_type>> {};

template <typename T>
inline constexpr bool has_data_type_member_v = has_data_type_member<T>::value;

template <class T>
struct is_message : std::bool_constant<has_data_type_member_v<remove_cvref_t<T>> &&  //
                                       has_proto_id_member_v<remove_cvref_t<T>> &&   //
                                       has_message_id_member_v<remove_cvref_t<T>>/* TODO repair && //
                                       has_data_member_v<remove_cvref_t<T>>*/> {};

template <class T>
inline constexpr bool is_message_v = messgen::is_message<T>::value;

template <class T>
struct is_protocol : std::bool_constant<has_proto_id_member_v<remove_cvref_t<T>> &&        //
                                        has_reflect_message_method_v<remove_cvref_t<T>> && //
                                        has_dispatch_message_method_v<remove_cvref_t<T>>> {};

template <class T>
inline constexpr bool is_protocol_v = messgen::is_protocol<T>::value;

template <typename T, typename = void>
struct has_data_method : std::false_type {};

template <typename T>
struct has_data_method<T, std::void_t<decltype(static_cast<typename T::pointer (T::*)()>(&T::data))>> : std::true_type {};

template <typename T, typename = void>
struct has_size_method : std::false_type {};

template <typename T>
struct has_size_method<T, std::void_t<decltype(static_cast<size_t (T::*)() const>(&T::size))>> : std::true_type {};

template <class T>
struct is_data_view : std::bool_constant<has_data_method<remove_cvref_t<T>>::value && has_size_method<remove_cvref_t<T>>::value> {};

template <class T>
inline constexpr bool is_data_view_v = is_data_view<T>::value;

} // namespace messgen
