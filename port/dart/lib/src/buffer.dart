/// Buffer utilities for reading/writing primitives with little-endian encoding
library;

import 'dart:convert';
import 'dart:typed_data';

/// Buffer reader for little-endian data
class BufferReader {
  final Uint8List _buffer;
  int _offset = 0;

  BufferReader(this._buffer);

  int get offset => _offset;
  int get remaining => _buffer.length - _offset;

  void advance(int bytes) {
    _offset += bytes;
  }

  /// Internal helper to validate buffer bounds
  Error? _checkRemaining(int required) {
    if (remaining < required) {
      return StateError('Need $required bytes but only $remaining available');
    }
    return null;
  }

  (int?, Error?) readInt8() {
    final err = _checkRemaining(1);
    if (err != null) return (null, err);

    final value = _buffer[_offset].toSigned(8);
    _offset += 1;
    return (value, null);
  }

  (int?, Error?) readUint8() {
    final err = _checkRemaining(1);
    if (err != null) return (null, err);

    final value = _buffer[_offset];
    _offset += 1;
    return (value, null);
  }

  (int?, Error?) readInt16() {
    final err = _checkRemaining(2);
    if (err != null) return (null, err);

    final value = ByteData.view(_buffer.buffer, _buffer.offsetInBytes + _offset)
        .getInt16(0, Endian.little);
    _offset += 2;
    return (value, null);
  }

  (int?, Error?) readUint16() {
    final err = _checkRemaining(2);
    if (err != null) return (null, err);

    final value = ByteData.view(_buffer.buffer, _buffer.offsetInBytes + _offset)
        .getUint16(0, Endian.little);
    _offset += 2;
    return (value, null);
  }

  (int?, Error?) readInt32() {
    final err = _checkRemaining(4);
    if (err != null) return (null, err);

    final value = ByteData.view(_buffer.buffer, _buffer.offsetInBytes + _offset)
        .getInt32(0, Endian.little);
    _offset += 4;
    return (value, null);
  }

  (int?, Error?) readUint32() {
    final err = _checkRemaining(4);
    if (err != null) return (null, err);

    final value = ByteData.view(_buffer.buffer, _buffer.offsetInBytes + _offset)
        .getUint32(0, Endian.little);
    _offset += 4;
    return (value, null);
  }

  (int?, Error?) readInt64() {
    final err = _checkRemaining(8);
    if (err != null) return (null, err);

    final value = ByteData.view(_buffer.buffer, _buffer.offsetInBytes + _offset)
        .getInt64(0, Endian.little);
    _offset += 8;
    return (value, null);
  }

  (int?, Error?) readUint64() {
    final err = _checkRemaining(8);
    if (err != null) return (null, err);

    final value = ByteData.view(_buffer.buffer, _buffer.offsetInBytes + _offset)
        .getUint64(0, Endian.little);
    _offset += 8;
    return (value, null);
  }

  (double?, Error?) readFloat32() {
    final err = _checkRemaining(4);
    if (err != null) return (null, err);

    final value = ByteData.view(_buffer.buffer, _buffer.offsetInBytes + _offset)
        .getFloat32(0, Endian.little);
    _offset += 4;
    return (value, null);
  }

  (double?, Error?) readFloat64() {
    final err = _checkRemaining(8);
    if (err != null) return (null, err);

    final value = ByteData.view(_buffer.buffer, _buffer.offsetInBytes + _offset)
        .getFloat64(0, Endian.little);
    _offset += 8;
    return (value, null);
  }

  (bool?, Error?) readBool() {
    final (value, err) = readUint8();
    if (err != null) return (null, err);
    return (value != 0, null);
  }

  (String?, Error?) readString() {
    final (length, err) = readUint32();
    if (err != null) return (null, err);

    final dataErr = _checkRemaining(length!);
    if (dataErr != null) return (null, dataErr);

    final bytes = Uint8List.sublistView(_buffer, _offset, _offset + length);
    _offset += length;
    try {
      return (utf8.decode(bytes), null);
    } catch (e) {
      return (null, StateError('Failed to decode UTF-8 string: $e'));
    }
  }

  (Uint8List?, Error?) readBytes() {
    final (length, err) = readUint32();
    if (err != null) return (null, err);

    final dataErr = _checkRemaining(length!);
    if (dataErr != null) return (null, dataErr);

    final bytes = Uint8List.fromList(_buffer.sublist(_offset, _offset + length));
    _offset += length;
    return (bytes, null);
  }

  (Uint8List?, Error?) readFixedBytes(int length) {
    final err = _checkRemaining(length);
    if (err != null) return (null, err);

    final bytes = Uint8List.fromList(_buffer.sublist(_offset, _offset + length));
    _offset += length;
    return (bytes, null);
  }
}

/// Buffer writer for little-endian data
class BufferWriter {
  final Uint8List _buffer;
  int _offset = 0;

  BufferWriter(this._buffer);

  int get offset => _offset;
  int get remaining => _buffer.length - _offset;

  void advance(int bytes) {
    _offset += bytes;
  }

  /// Internal helper to validate output buffer space
  Error? _checkRemaining(int required) {
    if (remaining < required) {
      return StateError('Need $required bytes but only $remaining available in output buffer');
    }
    return null;
  }

  Error? writeInt8(int value) {
    final err = _checkRemaining(1);
    if (err != null) return err;

    _buffer[_offset] = value.toUnsigned(8);
    _offset += 1;
    return null;
  }

  Error? writeUint8(int value) {
    final err = _checkRemaining(1);
    if (err != null) return err;

    _buffer[_offset] = value;
    _offset += 1;
    return null;
  }

  Error? writeInt16(int value) {
    final err = _checkRemaining(2);
    if (err != null) return err;

    ByteData.view(_buffer.buffer, _buffer.offsetInBytes + _offset)
        .setInt16(0, value, Endian.little);
    _offset += 2;
    return null;
  }

  Error? writeUint16(int value) {
    final err = _checkRemaining(2);
    if (err != null) return err;

    ByteData.view(_buffer.buffer, _buffer.offsetInBytes + _offset)
        .setUint16(0, value, Endian.little);
    _offset += 2;
    return null;
  }

  Error? writeInt32(int value) {
    final err = _checkRemaining(4);
    if (err != null) return err;

    ByteData.view(_buffer.buffer, _buffer.offsetInBytes + _offset)
        .setInt32(0, value, Endian.little);
    _offset += 4;
    return null;
  }

  Error? writeUint32(int value) {
    final err = _checkRemaining(4);
    if (err != null) return err;

    ByteData.view(_buffer.buffer, _buffer.offsetInBytes + _offset)
        .setUint32(0, value, Endian.little);
    _offset += 4;
    return null;
  }

  Error? writeInt64(int value) {
    final err = _checkRemaining(8);
    if (err != null) return err;

    ByteData.view(_buffer.buffer, _buffer.offsetInBytes + _offset)
        .setInt64(0, value, Endian.little);
    _offset += 8;
    return null;
  }

  Error? writeUint64(int value) {
    final err = _checkRemaining(8);
    if (err != null) return err;

    ByteData.view(_buffer.buffer, _buffer.offsetInBytes + _offset)
        .setUint64(0, value, Endian.little);
    _offset += 8;
    return null;
  }

  Error? writeFloat32(double value) {
    final err = _checkRemaining(4);
    if (err != null) return err;

    ByteData.view(_buffer.buffer, _buffer.offsetInBytes + _offset)
        .setFloat32(0, value, Endian.little);
    _offset += 4;
    return null;
  }

  Error? writeFloat64(double value) {
    final err = _checkRemaining(8);
    if (err != null) return err;

    ByteData.view(_buffer.buffer, _buffer.offsetInBytes + _offset)
        .setFloat64(0, value, Endian.little);
    _offset += 8;
    return null;
  }

  Error? writeBool(bool value) {
    return writeUint8(value ? 1 : 0);
  }

  Error? writeString(String value) {
    final bytes = utf8.encode(value);

    // Check space for length (uint32)
    var err = writeUint32(bytes.length);
    if (err != null) return err;

    // Check space for payload
    err = _checkRemaining(bytes.length);
    if (err != null) return err;

    _buffer.setRange(_offset, _offset + bytes.length, bytes);
    _offset += bytes.length;
    return null;
  }

  Error? writeBytes(Uint8List value) {
    // Check space for length (uint32)
    var err = writeUint32(value.length);
    if (err != null) return err;

    // Check space for payload
    err = _checkRemaining(value.length);
    if (err != null) return err;

    _buffer.setRange(_offset, _offset + value.length, value);
    _offset += value.length;
    return null;
  }

  Error? writeFixedBytes(Uint8List value) {
    final err = _checkRemaining(value.length);
    if (err != null) return err;

    _buffer.setRange(_offset, _offset + value.length, value);
    _offset += value.length;
    return null;
  }
}