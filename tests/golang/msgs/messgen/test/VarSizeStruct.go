package test

import (
	"encoding/binary"
	"fmt"
	"unsafe"
)

var _ = fmt.Print
var _ = binary.LittleEndian

type VarSizeStruct struct {
	// Group begin: 8 bytes
	F0 uint64
	// Group end
	// Group begin: None bytes
	F1Vec []int64
	// Group end
	// Group begin: None bytes
	Str string
	// Group end
}

func (s *VarSizeStruct) SerializedSize() uint32 {
	result := 0

	// Count group F0
	result += 8

	// Count group F1Vec
	{
		result += 4
		result += len(s.F1Vec) * (8)
	}

	// Count group Str
	{
		result += 4 + len(s.Str)
	}
	return uint32(result)
}

func (s *VarSizeStruct) Serialize(output []byte) (uint32, error) {
	selfBytes := (*[48]byte)(unsafe.Pointer(s))
	outputOfs, selfOfs := 0, 0

	// Write group F0
	{
		copy(output[outputOfs:(outputOfs+8)], (*selfBytes)[selfOfs:])
		selfOfs += 8 + 0
		outputOfs += 8

	}

	// Write group F1Vec
	{
		binary.LittleEndian.PutUint32(output[outputOfs:], uint32(len(s.F1Vec)))
		outputOfs += 4
		uptr := unsafe.Pointer(unsafe.SliceData(s.F1Vec[0:]))
		bytes := unsafe.Slice((*byte)(uptr), len(s.F1Vec)*8)
		copy(output[outputOfs:], bytes)
		outputOfs += len(bytes)
	}
	selfOfs += 24

	// Write group Str
	{
		binary.LittleEndian.PutUint32(output[outputOfs:], uint32(len(s.Str)))
		tmp := unsafe.StringData(s.Str)
		buf := unsafe.Slice(tmp, len(s.Str))
		copy(output[outputOfs+4:], buf)
		outputOfs += 4 + len(buf)
	}
	selfOfs += 16
	return uint32(outputOfs), nil
}

func (s *VarSizeStruct) Deserialize(input []byte) (uint32, error) {
	selfBytes := (*[48]byte)(unsafe.Pointer(s))
	inputOfs, selfOfs := 0, 0

	// Read group F0
	{
		copy((*selfBytes)[selfOfs:(selfOfs+8)], input[inputOfs:])
		selfOfs += 8 + 0
		inputOfs += 8
	}

	// Read group F1Vec
	{
		size := int(binary.LittleEndian.Uint32(input[inputOfs:]))
		s.F1Vec = make([]int64, size)
		inputOfs += 4
		uptr := unsafe.Pointer(unsafe.SliceData(s.F1Vec[0:]))
		bytes := unsafe.Slice((*byte)(uptr), size*8)
		copy(bytes, input[inputOfs:])
		inputOfs += len(bytes)
	}
	selfOfs += 24

	// Read group Str
	{
		size := int(binary.LittleEndian.Uint32(input[inputOfs:]))
		tmp := make([]byte, size)
		copy(tmp, input[inputOfs+4:])
		s.Str = string(tmp)
		inputOfs += (4 + size)
	}
	selfOfs += 16
	return uint32(inputOfs), nil
}
