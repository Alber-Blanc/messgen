/// Core interfaces for Messgen serialization
library;

import 'dart:typed_data';

/// Interface for serializable types
abstract class Serializable {
  /// Serialize the object into the output buffer
  /// Returns the number of bytes written
  int serialize(Uint8List output);

  /// Get the serialized size in bytes
  int serializedSize();

  /// Get the hash of the type
  BigInt hash();
}
