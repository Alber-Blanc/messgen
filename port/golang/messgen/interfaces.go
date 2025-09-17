package messgen

type Serializable interface {
	Serialize(output []byte) (uint32, error)
	Deserialize(input []byte) (uint32, error)
	SerializedSize() uint32
	MessageHash() uint64
}

type ProtocolMessage interface {
	Id() PayloadId
	MessageHash() uint64
	Data() Serializable
}
