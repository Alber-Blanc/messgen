package test

import (
	"encoding/binary"
	"fmt"
	"unsafe"
)

var _ = fmt.Print
var _ = binary.LittleEndian

type FlatStruct struct {
	// Group begin: 40 bytes
	F0 uint64
	F1 int64
	F2 float64
	F3 uint32
	F4 int32
	F5 float32
	F6 uint16
	F7 uint8
	F8 int8
	// Group end
}

func (s *FlatStruct) SerializedSize() uint32 {
	result := 0

	// Count group F0,F1,F2,F3,F4,F5,F6,F7,F8
	result += 40
	return uint32(result)
}

func (s *FlatStruct) Serialize(output []byte) (uint32, error) {
	selfBytes := (*[40]byte)(unsafe.Pointer(s))
	outputOfs, selfOfs := 0, 0

	// Write group F0,F1,F2,F3,F4,F5,F6,F7,F8
	{
		copy(output[outputOfs:(outputOfs+40)], (*selfBytes)[selfOfs:])
		selfOfs += 40 + 0
		outputOfs += 40

	}
	return uint32(outputOfs), nil
}

func (s *FlatStruct) Deserialize(input []byte) (uint32, error) {
	selfBytes := (*[40]byte)(unsafe.Pointer(s))
	inputOfs, selfOfs := 0, 0

	// Read group F0,F1,F2,F3,F4,F5,F6,F7,F8
	{
		copy((*selfBytes)[selfOfs:(selfOfs+40)], input[inputOfs:])
		selfOfs += 40 + 0
		inputOfs += 40
	}
	return uint32(inputOfs), nil
}
