package test

import (
	"encoding/binary"
	"fmt"
)

var _ = fmt.Print
var _ = binary.LittleEndian

type EmptyStruct struct {
}

func (s *EmptyStruct) SerializedSize() uint32 {
	result := 0
	return uint32(result)
}

func (s *EmptyStruct) Serialize(output []byte) (uint32, error) {
	outputOfs := 0
	return uint32(outputOfs), nil
}

func (s *EmptyStruct) Deserialize(input []byte) (uint32, error) {
	inputOfs := 0
	return uint32(inputOfs), nil
}
