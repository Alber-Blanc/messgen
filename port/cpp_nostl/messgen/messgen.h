#pragma once

#include "messgen/traits.h"
#if __cplusplus >= 202002L
#include "concepts.h"
#endif

#include "MessageInfo.h"
#include "Allocator.h"
#include "reflection.h"

#include <cstdint>
#include <vector>
#include <tuple>

namespace messgen {

template <class T>
struct vector {
    using value_type = T;

    T *_ptr = nullptr;
    size_t _size = 0;

    vector() = default;

    vector(const vector<T> &other) {
        _ptr = other._ptr;
        _size = other._size;
    }

    vector(T *ptr, size_t size)
        : _ptr(ptr),
          _size(size) {
    }

    vector(const T *ptr, size_t size)
        : _ptr(const_cast<T *>(ptr)),
          _size(size) {
    }

    vector(std::vector<T> &v)
        : _ptr(v.begin().base()),
          _size(v.size()) {
    }

    vector(const std::vector<T> &v)
        : _ptr(const_cast<T *>(v.begin().base())),
          _size(v.size()) {
    }

    vector<T> &operator=(const vector<T> &other) {
        _ptr = other._ptr;
        _size = other._size;
        return *this;
    }

    size_t size() const {
        return _size;
    }

    T *begin() {
        return _ptr;
    }

    const T *begin() const {
        return _ptr;
    }

    T *end() {
        return _ptr + _size;
    }

    const T *end() const {
        return _ptr + _size;
    }

    bool operator==(const vector<T> &other) const {
        if (_size != other._size) {
            return false;
        }

        for (size_t i = 0; i < _size; ++i) {
            if (_ptr[i] != other._ptr[i]) {
                return false;
            }
        }

        return true;
    }

    bool operator!=(const vector<T> &other) const {
        return !(*this == other);
    }

    T &operator[](size_t idx) {
        return _ptr[idx];
    }

    const T &operator[](size_t idx) const {
        return _ptr[idx];
    }

    T *data() {
        return _ptr;
    }

    const T *data() const {
        return _ptr;
    }
};

using size_type = uint32_t;

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

/**
 * @brief   Get serialized size (message size + header size)
 * @tparam T    -   message type
 * @param msg   -   message instance
 * @return  number of bytes in serialized message
 */
template <class T>
size_t get_serialized_size(const T & msg) {
    return msg.data.serialized_size() + MessageInfo::HEADER_SIZE;
}

/**
 * @brief Get message info from buffer
 * @param buf           -   buffer with serialized message inside
 * @param buf_len       -   buffer length
 * @param info          -   where to store message info
 * @return  0 in case of success, -1 in case of error
 */
inline int get_message_info(const uint8_t *buf, size_t buf_len, MessageInfo &info) {
    if (buf_len < MessageInfo::HEADER_SIZE) {
        return -1;
    }

    info.msg_id = buf[0];
    info.size = (buf[4] << 24U) |
                (buf[3] << 16U) |
                (buf[2] << 8U)  |
                (buf[1]);

    if (buf_len < info.size + MessageInfo::HEADER_SIZE) {
        return -1;
    }

    info.payload = buf + MessageInfo::HEADER_SIZE;
    return 0;
}


/**
 * @brief Serialize message into a given buffer
 * @tparam T        -   message type
 * @param msg       -   message instance
 * @param buf       -   buffer to serialize into
 * @param buf_len   -   buffer size
 * @return number of bytes written in case of success, -1 in case of error
 */
template<typename T>
int serialize(const T &msg, uint8_t *buf, size_t buf_len) {
    size_t payload_size = msg.data.serialized_size();
    size_t ser_total_size = payload_size + MessageInfo::HEADER_SIZE;

    if (buf_len < ser_total_size) {
        return -1;
    }

    // info.seq and info.cls must be filled by caller
    buf[0] = T::MESSAGE_ID;
    buf[1] = payload_size & 0xFF;
    buf[2] = (payload_size >> 8U) & 0xFF;
    buf[3] = (payload_size >> 16U) & 0xFF;
    buf[4] = (payload_size >> 24U) & 0xFF;

    msg.data.serialize(buf + MessageInfo::HEADER_SIZE);
    return ser_total_size;
}

/**
 * @brief Parse message
 * @tparam T            -   message type
 * @param info          -   message info. See get_message_info.
 * @param msg           -   message instance to parse into
 * @param allocator     -   memory allocator instance
 * @return number of bytes parsed in case of success, -1 in case of error
 */
template<class T>
int parse(const MessageInfo &info, T &msg, Allocator &allocator) {
    if (info.msg_id != T::MESSAGE_ID) {
        return -1;
    }

    return msg.data.deserialize(info.payload, allocator);
}

/**
 * @brief   Iterate over all messages inside a buffer
 * @tparam F            -   Message handler type
 * @param data          -   buffer with messages
 * @param data_size     -   buffer size
 * @param f             -   message handler. Must override operator()(const MessageInfo &)
 * @return  Number of bytes parsed
 */
template <class F>
size_t for_each_message(const uint8_t *data, size_t data_size, F& f) {
    const uint8_t *buf = data;
    size_t remaining = data_size;

    messgen::MessageInfo msg_info{};
    while (0 == get_message_info(buf, remaining, msg_info)) {
        f(msg_info);

        const auto total_size = msg_info.get_total_size();
        buf += total_size;
        remaining -= total_size;
    }

    return buf - data;
}

} // namespace messgen
