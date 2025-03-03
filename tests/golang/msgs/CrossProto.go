package msgs

import (
	"encoding/binary"
	"example.com/msgs/messgen/test"
	"fmt"
	"unsafe"
)

var _ = fmt.Print
var _ = binary.LittleEndian

type CrossProto struct {
	// Group begin: 9 bytes
	F0     uint64
	Cross0 test.SimpleEnum
	// Group end
	// Padding: 7 bytes

}

func (s *CrossProto) SerializedSize() uint32 {
	result := 0

	// Count group F0,Cross0
	result += 9
	return uint32(result)
}

func (s *CrossProto) Serialize(output []byte) (uint32, error) {
	selfBytes := (*[16]byte)(unsafe.Pointer(s))
	outputOfs, selfOfs := 0, 0

	// Write group F0,Cross0
	{
		copy(output[outputOfs:(outputOfs+9)], (*selfBytes)[selfOfs:])
		selfOfs += 9 + 7
		outputOfs += 9

	}
	return uint32(outputOfs), nil
}

func (s *CrossProto) Deserialize(input []byte) (uint32, error) {
	selfBytes := (*[16]byte)(unsafe.Pointer(s))
	inputOfs, selfOfs := 0, 0

	// Read group F0,Cross0
	{
		copy((*selfBytes)[selfOfs:(selfOfs+9)], input[inputOfs:])
		selfOfs += 9 + 7
		inputOfs += 9
	}
	return uint32(inputOfs), nil
}
