package test

import (
	"encoding/binary"
	"fmt"
	"unsafe"
)

var _ = fmt.Print
var _ = binary.LittleEndian

type SimpleStruct struct {
	// Group begin: 17 bytes
	F0    uint64
	F1    int64
	F1Pad uint8
	// Group end
	// Padding: 7 bytes

	// Group begin: 25 bytes
	F2 float64
	F3 uint32
	F4 int32
	F5 float32
	F6 uint16
	F7 uint8
	F8 int8
	F9 bool
	// Group end
	// Padding: 7 bytes

}

func (s *SimpleStruct) SerializedSize() uint32 {
	result := 0

	// Count group F0,F1,F1Pad
	result += 17

	// Count group F2,F3,F4,F5,F6,F7,F8,F9
	result += 25
	return uint32(result)
}

func (s *SimpleStruct) Serialize(output []byte) (uint32, error) {
	selfBytes := (*[56]byte)(unsafe.Pointer(s))
	outputOfs, selfOfs := 0, 0

	// Write group F0,F1,F1Pad
	{
		copy(output[outputOfs:(outputOfs+17)], (*selfBytes)[selfOfs:])
		selfOfs += 17 + 7
		outputOfs += 17

	}

	// Write group F2,F3,F4,F5,F6,F7,F8,F9
	{
		copy(output[outputOfs:(outputOfs+25)], (*selfBytes)[selfOfs:])
		selfOfs += 25 + 7
		outputOfs += 25

	}
	return uint32(outputOfs), nil
}

func (s *SimpleStruct) Deserialize(input []byte) (uint32, error) {
	selfBytes := (*[56]byte)(unsafe.Pointer(s))
	inputOfs, selfOfs := 0, 0

	// Read group F0,F1,F1Pad
	{
		copy((*selfBytes)[selfOfs:(selfOfs+17)], input[inputOfs:])
		selfOfs += 17 + 7
		inputOfs += 17
	}

	// Read group F2,F3,F4,F5,F6,F7,F8,F9
	{
		copy((*selfBytes)[selfOfs:(selfOfs+25)], input[inputOfs:])
		selfOfs += 25 + 7
		inputOfs += 25
	}
	return uint32(inputOfs), nil
}
