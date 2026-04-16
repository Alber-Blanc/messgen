/// Buffer utilities for reading/writing primitives with little-endian encoding
library;

import 'dart:convert';
import 'dart:typed_data';
import 'package:messgen/src/exceptions.dart';

/// Buffer reader for little-endian data
class BufferReader {
  final Uint8List _buffer;
  int _offset = 0;

  BufferReader(this._buffer);

  int get offset => _offset;
  int get remaining => _buffer.length - _offset;
  
  /// Advance the offset by the specified number of bytes
  void advance(int bytes) {
    _offset += bytes;
  }

  void _checkRemaining(int bytes) {
    if (remaining < bytes) {
      throw BufferTooShortException(
          'Need $bytes bytes but only $remaining available',
      );
    }
  }

  int readInt8() {
    _checkRemaining(1);
    final value = _buffer[_offset].toSigned(8);
    _offset += 1;
    return value;
  }

  int readUint8() {
    _checkRemaining(1);
    final value = _buffer[_offset];
    _offset += 1;
    return value;
  }

  int readInt16() {
    _checkRemaining(2);
    final value = ByteData.view(_buffer.buffer, _buffer.offsetInBytes + _offset)
        .getInt16(0, Endian.little);
    _offset += 2;
    return value;
  }

  int readUint16() {
    _checkRemaining(2);
    final value = ByteData.view(_buffer.buffer, _buffer.offsetInBytes + _offset)
        .getUint16(0, Endian.little);
    _offset += 2;
    return value;
  }

  int readInt32() {
    _checkRemaining(4);
    final value = ByteData.view(_buffer.buffer, _buffer.offsetInBytes + _offset)
        .getInt32(0, Endian.little);
    _offset += 4;
    return value;
  }

  int readUint32() {
    _checkRemaining(4);
    final value = ByteData.view(_buffer.buffer, _buffer.offsetInBytes + _offset)
        .getUint32(0, Endian.little);
    _offset += 4;
    return value;
  }

  int readInt64() {
    _checkRemaining(8);
    final value = ByteData.view(_buffer.buffer, _buffer.offsetInBytes + _offset)
        .getInt64(0, Endian.little);
    _offset += 8;
    return value;
  }

  int readUint64() {
    _checkRemaining(8);
    final value = ByteData.view(_buffer.buffer, _buffer.offsetInBytes + _offset)
        .getUint64(0, Endian.little);
    _offset += 8;
    return value;
  }

  double readFloat32() {
    _checkRemaining(4);
    final value = ByteData.view(_buffer.buffer, _buffer.offsetInBytes + _offset)
        .getFloat32(0, Endian.little);
    _offset += 4;
    return value;
  }

  double readFloat64() {
    _checkRemaining(8);
    final value = ByteData.view(_buffer.buffer, _buffer.offsetInBytes + _offset)
        .getFloat64(0, Endian.little);
    _offset += 8;
    return value;
  }

  bool readBool() {
    return readUint8() != 0;
  }

  String readString() {
    final length = readUint32();
    _checkRemaining(length);
    final bytes = Uint8List.sublistView(_buffer, _offset, _offset + length);
    _offset += length;
    // Messgen uses UTF-8 encoding for strings
    return utf8.decode(bytes);
  }

  Uint8List readBytes() {
    final length = readUint32();
    _checkRemaining(length);
    final bytes = Uint8List.fromList(_buffer.sublist(_offset, _offset + length));
    _offset += length;
    return bytes;
  }

  Uint8List readFixedBytes(int length) {
    _checkRemaining(length);
    final bytes = Uint8List.fromList(_buffer.sublist(_offset, _offset + length));
    _offset += length;
    return bytes;
  }
}

/// Buffer writer for little-endian data
class BufferWriter {
  final Uint8List _buffer;
  int _offset = 0;

  BufferWriter(this._buffer);

  int get offset => _offset;
  int get remaining => _buffer.length - _offset;
  
  /// Advance the offset by the specified number of bytes
  void advance(int bytes) {
    _offset += bytes;
  }

  void _checkRemaining(int bytes) {
    if (remaining < bytes) {
      throw BufferTooShortException(
          'Need $bytes bytes but only $remaining available in output buffer',
      );
    }
  }

  void writeInt8(int value) {
    _checkRemaining(1);
    _buffer[_offset] = value.toUnsigned(8);
    _offset += 1;
  }

  void writeUint8(int value) {
    _checkRemaining(1);
    _buffer[_offset] = value;
    _offset += 1;
  }

  void writeInt16(int value) {
    _checkRemaining(2);
    ByteData.view(_buffer.buffer, _buffer.offsetInBytes + _offset)
        .setInt16(0, value, Endian.little);
    _offset += 2;
  }

  void writeUint16(int value) {
    _checkRemaining(2);
    ByteData.view(_buffer.buffer, _buffer.offsetInBytes + _offset)
        .setUint16(0, value, Endian.little);
    _offset += 2;
  }

  void writeInt32(int value) {
    _checkRemaining(4);
    ByteData.view(_buffer.buffer, _buffer.offsetInBytes + _offset)
        .setInt32(0, value, Endian.little);
    _offset += 4;
  }

  void writeUint32(int value) {
    _checkRemaining(4);
    ByteData.view(_buffer.buffer, _buffer.offsetInBytes + _offset)
        .setUint32(0, value, Endian.little);
    _offset += 4;
  }

  void writeInt64(int value) {
    _checkRemaining(8);
    ByteData.view(_buffer.buffer, _buffer.offsetInBytes + _offset)
        .setInt64(0, value, Endian.little);
    _offset += 8;
  }

  void writeUint64(int value) {
    _checkRemaining(8);
    ByteData.view(_buffer.buffer, _buffer.offsetInBytes + _offset)
        .setUint64(0, value, Endian.little);
    _offset += 8;
  }

  void writeFloat32(double value) {
    _checkRemaining(4);
    ByteData.view(_buffer.buffer, _buffer.offsetInBytes + _offset)
        .setFloat32(0, value, Endian.little);
    _offset += 4;
  }

  void writeFloat64(double value) {
    _checkRemaining(8);
    ByteData.view(_buffer.buffer, _buffer.offsetInBytes + _offset)
        .setFloat64(0, value, Endian.little);
    _offset += 8;
  }

  void writeBool(bool value) {
    writeUint8(value ? 1 : 0);
  }

  void writeString(String value) {
    // Messgen uses UTF-8 encoding, but codeUnits work for ASCII subset
    // For full UTF-8 support, use: final bytes = utf8.encode(value);
    final bytes = utf8.encode(value);
    writeUint32(bytes.length);
    _checkRemaining(bytes.length);
    _buffer.setRange(_offset, _offset + bytes.length, bytes);
    _offset += bytes.length;
  }

  void writeBytes(Uint8List value) {
    writeUint32(value.length);
    _checkRemaining(value.length);
    _buffer.setRange(_offset, _offset + value.length, value);
    _offset += value.length;
  }

  void writeFixedBytes(Uint8List value) {
    _checkRemaining(value.length);
    _buffer.setRange(_offset, _offset + value.length, value);
    _offset += value.length;
  }
}
