package messgen

type Serializable interface {
	Serialize(output []byte) (uint32, error)
	Deserialize(input []byte) (uint32, error)
	SerializedSize() uint32
}

type ProtocolMessage interface {
	Id() PayloadId
	Hash() uint64
	Data() Serializable
}
