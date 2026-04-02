/// Core types for Messgen protocol
library;

/// Protocol identifier type
class ProtocolId {
  final int _value;

  const ProtocolId(this._value);

  int get value => _value;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is ProtocolId && runtimeType == other.runtimeType && _value == other._value;

  @override
  int get hashCode => _value.hashCode;

  @override
  String toString() => 'ProtocolId($_value)';
}

/// Message identifier type
class MessageId {
  final int _value;

  const MessageId(this._value);

  int get value => _value;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is MessageId && runtimeType == other.runtimeType && _value == other._value;

  @override
  int get hashCode => _value.hashCode;

  @override
  String toString() => 'MessageId($_value)';
}

/// Combined payload identifier
class PayloadId {
  final ProtocolId protocol;
  final MessageId message;

  const PayloadId(this.protocol, this.message);

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is PayloadId &&
          runtimeType == other.runtimeType &&
          protocol == other.protocol &&
          message == other.message;

  @override
  int get hashCode => Object.hash(protocol, message);

  @override
  String toString() => '${protocol.value}:${message.value}';
}
