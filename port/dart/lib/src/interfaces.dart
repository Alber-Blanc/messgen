/// Core interfaces for Messgen serialization
library;

import 'dart:typed_data';

/// Interface for serializable types
abstract class Serializable {
  /// Serialize the object into the output buffer
  /// Returns the number of bytes written
  int serialize(Uint8List output);

  /// Deserialize the object from the input buffer
  /// Returns the number of bytes read
  int deserialize(Uint8List input);

  /// Get the serialized size in bytes
  int serializedSize();

  /// Get the hash of the type
  BigInt hash();
}
