package test

import (
	"encoding/binary"
	"fmt"
	"unsafe"
)

var _ = fmt.Print
var _ = binary.LittleEndian

type StructWithEnum struct {
	// Group begin: 17 bytes
	F0 uint64
	F1 int64
	E0 SimpleEnum
	// Group end
	// Padding: 7 bytes

}

func (s *StructWithEnum) SerializedSize() uint32 {
	result := 0

	// Count group F0,F1,E0
	result += 17
	return uint32(result)
}

func (s *StructWithEnum) Serialize(output []byte) (uint32, error) {
	selfBytes := (*[24]byte)(unsafe.Pointer(s))
	outputOfs, selfOfs := 0, 0

	// Write group F0,F1,E0
	{
		copy(output[outputOfs:(outputOfs+17)], (*selfBytes)[selfOfs:])
		selfOfs += 17 + 7
		outputOfs += 17

	}
	return uint32(outputOfs), nil
}

func (s *StructWithEnum) Deserialize(input []byte) (uint32, error) {
	selfBytes := (*[24]byte)(unsafe.Pointer(s))
	inputOfs, selfOfs := 0, 0

	// Read group F0,F1,E0
	{
		copy((*selfBytes)[selfOfs:(selfOfs+17)], input[inputOfs:])
		selfOfs += 17 + 7
		inputOfs += 17
	}
	return uint32(inputOfs), nil
}
