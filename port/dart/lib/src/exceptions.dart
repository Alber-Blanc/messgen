/// Custom exceptions for Messgen
library;

/// Base exception for Messgen errors
class MessgenException implements Exception {
  final String message;

  MessgenException(this.message);

  @override
  String toString() => 'MessgenException: $message';
}

/// Exception thrown when buffer is too short for deserialization
class BufferTooShortException extends MessgenException {
  BufferTooShortException([String? message])
      : super(message ?? 'Buffer is too short for deserialization');
}

/// Exception thrown when serialization fails
class SerializationException extends MessgenException {
  SerializationException(String message) : super(message);
}

/// Exception thrown when deserialization fails
class DeserializationException extends MessgenException {
  DeserializationException(String message) : super(message);
}
