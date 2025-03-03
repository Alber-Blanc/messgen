package test

import (
	"encoding/binary"
	"fmt"
	"unsafe"
)

var _ = fmt.Print
var _ = binary.LittleEndian

type ComplexStruct struct {
	// Group begin: 12 bytes
	F0 uint64
	F1 uint32
	// Group end
	// Padding: 4 bytes

	// Group begin: 8 bytes
	F2 uint64
	// Group end
	// Group begin: 84 bytes
	SArr [2]SimpleStruct
	// Group end
	// Group begin: 32 bytes
	F1Arr [4]int64
	// Group end
	// Group begin: None bytes
	VArr [2]VarSizeStruct
	// Group end
	// Group begin: None bytes
	F2Vec []float64
	// Group end
	// Group begin: None bytes
	EVec []SimpleEnum
	// Group end
	// Group begin: None bytes
	SVec []SimpleStruct
	// Group end
	// Group begin: None bytes
	VVec0 [][]VarSizeStruct
	// Group end
	// Group begin: None bytes
	VVec1 [4][]VarSizeStruct
	// Group end
	// Group begin: None bytes
	VVec2 [][4][]int16
	// Group end
	// Group begin: None bytes
	Str string
	// Group end
	// Group begin: None bytes
	Bs []byte
	// Group end
	// Group begin: None bytes
	StrVec []string
	// Group end
	// Group begin: None bytes
	MapStrByInt map[int32]string
	// Group end
	// Group begin: None bytes
	MapVecByStr map[string][]int32
	// Group end
}

func (s *ComplexStruct) SerializedSize() uint32 {
	result := 0

	// Count group F0,F1
	result += 12

	// Count group F2
	result += 8

	// Count group SArr
	{
		for i0 := 0; i0 < len(s.SArr); i0++ {
			result += int(s.SArr[i0].SerializedSize())
		}
	}

	// Count group F1Arr
	result += 32

	// Count group VArr
	{
		for i0 := 0; i0 < len(s.VArr); i0++ {
			result += int(s.VArr[i0].SerializedSize())
		}
	}

	// Count group F2Vec
	{
		result += 4
		result += len(s.F2Vec) * (8)
	}

	// Count group EVec
	{
		result += 4
		result += len(s.EVec) * (1)
	}

	// Count group SVec
	{
		result += 4
		for i0 := 0; i0 < len(s.SVec); i0++ {
			result += int(s.SVec[i0].SerializedSize())
		}
	}

	// Count group VVec0
	{
		result += 4
		for i0 := 0; i0 < len(s.VVec0); i0++ {
			result += 4
			for i1 := 0; i1 < len(s.VVec0[i0]); i1++ {
				result += int(s.VVec0[i0][i1].SerializedSize())
			}
		}
	}

	// Count group VVec1
	{
		for i0 := 0; i0 < len(s.VVec1); i0++ {
			result += 4
			for i1 := 0; i1 < len(s.VVec1[i0]); i1++ {
				result += int(s.VVec1[i0][i1].SerializedSize())
			}
		}
	}

	// Count group VVec2
	{
		result += 4
		for i0 := 0; i0 < len(s.VVec2); i0++ {
			for i1 := 0; i1 < len(s.VVec2[i0]); i1++ {
				result += 4
				result += len(s.VVec2[i0][i1]) * (2)
			}
		}
	}

	// Count group Str
	{
		result += 4 + len(s.Str)
	}

	// Count group Bs
	{
		result += 4 + len(s.Bs)
	}

	// Count group StrVec
	{
		result += 4
		for i0 := 0; i0 < len(s.StrVec); i0++ {
			result += 4 + len(s.StrVec[i0])
		}
	}

	// Count group MapStrByInt
	{
		result += 4
		for _, value := range s.MapStrByInt {
			// Count key
			{
				result += 4
			}

			// Count value
			{
				result += 4 + len(value)
			}
		}
	}

	// Count group MapVecByStr
	{
		result += 4
		for key, value := range s.MapVecByStr {
			// Count key
			{
				result += 4 + len(key)
			}

			// Count value
			{
				result += 4
				result += len(value) * (4)
			}
		}
	}
	return uint32(result)
}

func (s *ComplexStruct) Serialize(output []byte) (uint32, error) {
	selfBytes := (*[576]byte)(unsafe.Pointer(s))
	outputOfs, selfOfs := 0, 0

	// Write group F0,F1
	{
		copy(output[outputOfs:(outputOfs+12)], (*selfBytes)[selfOfs:])
		selfOfs += 12 + 4
		outputOfs += 12

	}

	// Write group F2
	{
		copy(output[outputOfs:(outputOfs+8)], (*selfBytes)[selfOfs:])
		selfOfs += 8 + 0
		outputOfs += 8

	}

	// Write group SArr
	{
		for i0 := 0; i0 < len(s.SArr); i0++ {
			sz, err := s.SArr[i0].Serialize(output[outputOfs:])
			if err != nil {
				return uint32(outputOfs), fmt.Errorf("Failed to encode field 's.SArr[i0]'")
			}
			outputOfs += int(sz)
		}
	}
	selfOfs += 112

	// Write group F1Arr
	{
		copy(output[outputOfs:(outputOfs+32)], (*selfBytes)[selfOfs:])
		selfOfs += 32 + 0
		outputOfs += 32

	}

	// Write group VArr
	{
		for i0 := 0; i0 < len(s.VArr); i0++ {
			sz, err := s.VArr[i0].Serialize(output[outputOfs:])
			if err != nil {
				return uint32(outputOfs), fmt.Errorf("Failed to encode field 's.VArr[i0]'")
			}
			outputOfs += int(sz)
		}
	}
	selfOfs += 96

	// Write group F2Vec
	{
		binary.LittleEndian.PutUint32(output[outputOfs:], uint32(len(s.F2Vec)))
		outputOfs += 4
		uptr := unsafe.Pointer(unsafe.SliceData(s.F2Vec[0:]))
		bytes := unsafe.Slice((*byte)(uptr), len(s.F2Vec)*8)
		copy(output[outputOfs:], bytes)
		outputOfs += len(bytes)
	}
	selfOfs += 24

	// Write group EVec
	{
		binary.LittleEndian.PutUint32(output[outputOfs:], uint32(len(s.EVec)))
		outputOfs += 4
		uptr := unsafe.Pointer(unsafe.SliceData(s.EVec[0:]))
		bytes := unsafe.Slice((*byte)(uptr), len(s.EVec)*1)
		copy(output[outputOfs:], bytes)
		outputOfs += len(bytes)
	}
	selfOfs += 24

	// Write group SVec
	{
		binary.LittleEndian.PutUint32(output[outputOfs:], uint32(len(s.SVec)))
		outputOfs += 4
		for i0 := 0; i0 < len(s.SVec); i0++ {
			sz, err := s.SVec[i0].Serialize(output[outputOfs:])
			if err != nil {
				return uint32(outputOfs), fmt.Errorf("Failed to encode field 's.SVec[i0]'")
			}
			outputOfs += int(sz)
		}
	}
	selfOfs += 24

	// Write group VVec0
	{
		binary.LittleEndian.PutUint32(output[outputOfs:], uint32(len(s.VVec0)))
		outputOfs += 4
		for i0 := 0; i0 < len(s.VVec0); i0++ {
			binary.LittleEndian.PutUint32(output[outputOfs:], uint32(len(s.VVec0[i0])))
			outputOfs += 4
			for i1 := 0; i1 < len(s.VVec0[i0]); i1++ {
				sz, err := s.VVec0[i0][i1].Serialize(output[outputOfs:])
				if err != nil {
					return uint32(outputOfs), fmt.Errorf("Failed to encode field 's.VVec0[i0][i1]'")
				}
				outputOfs += int(sz)
			}
		}
	}
	selfOfs += 24

	// Write group VVec1
	{
		for i0 := 0; i0 < len(s.VVec1); i0++ {
			binary.LittleEndian.PutUint32(output[outputOfs:], uint32(len(s.VVec1[i0])))
			outputOfs += 4
			for i1 := 0; i1 < len(s.VVec1[i0]); i1++ {
				sz, err := s.VVec1[i0][i1].Serialize(output[outputOfs:])
				if err != nil {
					return uint32(outputOfs), fmt.Errorf("Failed to encode field 's.VVec1[i0][i1]'")
				}
				outputOfs += int(sz)
			}
		}
	}
	selfOfs += 96

	// Write group VVec2
	{
		binary.LittleEndian.PutUint32(output[outputOfs:], uint32(len(s.VVec2)))
		outputOfs += 4
		for i0 := 0; i0 < len(s.VVec2); i0++ {
			for i1 := 0; i1 < len(s.VVec2[i0]); i1++ {
				binary.LittleEndian.PutUint32(output[outputOfs:], uint32(len(s.VVec2[i0][i1])))
				outputOfs += 4
				uptr := unsafe.Pointer(unsafe.SliceData(s.VVec2[i0][i1][0:]))
				bytes := unsafe.Slice((*byte)(uptr), len(s.VVec2[i0][i1])*2)
				copy(output[outputOfs:], bytes)
				outputOfs += len(bytes)
			}
		}
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

	// Write group Bs
	{
		binary.LittleEndian.PutUint32(output[outputOfs:], uint32(len(s.Bs)))
		tmp := unsafe.SliceData(s.Bs)
		buf := unsafe.Slice(tmp, len(s.Bs)*24)
		copy(output[outputOfs+4:], buf)
		outputOfs += 4 + len(s.Bs)
	}
	selfOfs += 24

	// Write group StrVec
	{
		binary.LittleEndian.PutUint32(output[outputOfs:], uint32(len(s.StrVec)))
		outputOfs += 4
		for i0 := 0; i0 < len(s.StrVec); i0++ {
			binary.LittleEndian.PutUint32(output[outputOfs:], uint32(len(s.StrVec[i0])))
			tmp := unsafe.StringData(s.StrVec[i0])
			buf := unsafe.Slice(tmp, len(s.StrVec[i0]))
			copy(output[outputOfs+4:], buf)
			outputOfs += 4 + len(buf)
		}
	}
	selfOfs += 24

	// Write group MapStrByInt
	{
		binary.LittleEndian.PutUint32(output[outputOfs:], uint32(len(s.MapStrByInt)))
		outputOfs += 4
		for key, value := range s.MapStrByInt {
			// write key
			{
				buf := (*[4]byte)(unsafe.Pointer(&key))
				copy(output[outputOfs:], (*buf)[0:4])
				outputOfs += 4
			}

			// write value
			{
				binary.LittleEndian.PutUint32(output[outputOfs:], uint32(len(value)))
				tmp := unsafe.StringData(value)
				buf := unsafe.Slice(tmp, len(value))
				copy(output[outputOfs+4:], buf)
				outputOfs += 4 + len(buf)
			}
		}
	}
	selfOfs += 16

	// Write group MapVecByStr
	{
		binary.LittleEndian.PutUint32(output[outputOfs:], uint32(len(s.MapVecByStr)))
		outputOfs += 4
		for key, value := range s.MapVecByStr {
			// write key
			{
				binary.LittleEndian.PutUint32(output[outputOfs:], uint32(len(key)))
				tmp := unsafe.StringData(key)
				buf := unsafe.Slice(tmp, len(key))
				copy(output[outputOfs+4:], buf)
				outputOfs += 4 + len(buf)
			}

			// write value
			{
				binary.LittleEndian.PutUint32(output[outputOfs:], uint32(len(value)))
				outputOfs += 4
				uptr := unsafe.Pointer(unsafe.SliceData(value[0:]))
				bytes := unsafe.Slice((*byte)(uptr), len(value)*4)
				copy(output[outputOfs:], bytes)
				outputOfs += len(bytes)
			}
		}
	}
	selfOfs += 16
	return uint32(outputOfs), nil
}

func (s *ComplexStruct) Deserialize(input []byte) (uint32, error) {
	selfBytes := (*[576]byte)(unsafe.Pointer(s))
	inputOfs, selfOfs := 0, 0

	// Read group F0,F1
	{
		copy((*selfBytes)[selfOfs:(selfOfs+12)], input[inputOfs:])
		selfOfs += 12 + 4
		inputOfs += 12
	}

	// Read group F2
	{
		copy((*selfBytes)[selfOfs:(selfOfs+8)], input[inputOfs:])
		selfOfs += 8 + 0
		inputOfs += 8
	}

	// Read group SArr
	{
		size := len(s.SArr)
		for i0 := 0; i0 < size; i0++ {
			sz, err := s.SArr[i0].Deserialize(input[inputOfs:])
			if err != nil {
				return uint32(inputOfs), fmt.Errorf("Failed to decode field 's.SArr[i0]'")
			}
			inputOfs += int(sz)
		}
	}
	selfOfs += 112

	// Read group F1Arr
	{
		copy((*selfBytes)[selfOfs:(selfOfs+32)], input[inputOfs:])
		selfOfs += 32 + 0
		inputOfs += 32
	}

	// Read group VArr
	{
		size := len(s.VArr)
		for i0 := 0; i0 < size; i0++ {
			sz, err := s.VArr[i0].Deserialize(input[inputOfs:])
			if err != nil {
				return uint32(inputOfs), fmt.Errorf("Failed to decode field 's.VArr[i0]'")
			}
			inputOfs += int(sz)
		}
	}
	selfOfs += 96

	// Read group F2Vec
	{
		size := int(binary.LittleEndian.Uint32(input[inputOfs:]))
		s.F2Vec = make([]float64, size)
		inputOfs += 4
		uptr := unsafe.Pointer(unsafe.SliceData(s.F2Vec[0:]))
		bytes := unsafe.Slice((*byte)(uptr), size*8)
		copy(bytes, input[inputOfs:])
		inputOfs += len(bytes)
	}
	selfOfs += 24

	// Read group EVec
	{
		size := int(binary.LittleEndian.Uint32(input[inputOfs:]))
		s.EVec = make([]SimpleEnum, size)
		inputOfs += 4
		uptr := unsafe.Pointer(unsafe.SliceData(s.EVec[0:]))
		bytes := unsafe.Slice((*byte)(uptr), size*1)
		copy(bytes, input[inputOfs:])
		inputOfs += len(bytes)
	}
	selfOfs += 24

	// Read group SVec
	{
		size := int(binary.LittleEndian.Uint32(input[inputOfs:]))
		s.SVec = make([]SimpleStruct, size)
		inputOfs += 4
		for i0 := 0; i0 < size; i0++ {
			sz, err := s.SVec[i0].Deserialize(input[inputOfs:])
			if err != nil {
				return uint32(inputOfs), fmt.Errorf("Failed to decode field 's.SVec[i0]'")
			}
			inputOfs += int(sz)
		}
	}
	selfOfs += 24

	// Read group VVec0
	{
		size := int(binary.LittleEndian.Uint32(input[inputOfs:]))
		s.VVec0 = make([][]VarSizeStruct, size)
		inputOfs += 4
		for i0 := 0; i0 < size; i0++ {
			size := int(binary.LittleEndian.Uint32(input[inputOfs:]))
			s.VVec0[i0] = make([]VarSizeStruct, size)
			inputOfs += 4
			for i1 := 0; i1 < size; i1++ {
				sz, err := s.VVec0[i0][i1].Deserialize(input[inputOfs:])
				if err != nil {
					return uint32(inputOfs), fmt.Errorf("Failed to decode field 's.VVec0[i0][i1]'")
				}
				inputOfs += int(sz)
			}
		}
	}
	selfOfs += 24

	// Read group VVec1
	{
		size := len(s.VVec1)
		for i0 := 0; i0 < size; i0++ {
			size := int(binary.LittleEndian.Uint32(input[inputOfs:]))
			s.VVec1[i0] = make([]VarSizeStruct, size)
			inputOfs += 4
			for i1 := 0; i1 < size; i1++ {
				sz, err := s.VVec1[i0][i1].Deserialize(input[inputOfs:])
				if err != nil {
					return uint32(inputOfs), fmt.Errorf("Failed to decode field 's.VVec1[i0][i1]'")
				}
				inputOfs += int(sz)
			}
		}
	}
	selfOfs += 96

	// Read group VVec2
	{
		size := int(binary.LittleEndian.Uint32(input[inputOfs:]))
		s.VVec2 = make([][4][]int16, size)
		inputOfs += 4
		for i0 := 0; i0 < size; i0++ {
			size := len(s.VVec2[i0])
			for i1 := 0; i1 < size; i1++ {
				size := int(binary.LittleEndian.Uint32(input[inputOfs:]))
				s.VVec2[i0][i1] = make([]int16, size)
				inputOfs += 4
				uptr := unsafe.Pointer(unsafe.SliceData(s.VVec2[i0][i1][0:]))
				bytes := unsafe.Slice((*byte)(uptr), size*2)
				copy(bytes, input[inputOfs:])
				inputOfs += len(bytes)
			}
		}
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

	// Read group Bs
	{
		size := int(binary.LittleEndian.Uint32(input[inputOfs:]))
		s.Bs = make([]byte, size)
		copy(s.Bs, input[inputOfs+4:])
		inputOfs += (4 + size)
	}
	selfOfs += 24

	// Read group StrVec
	{
		size := int(binary.LittleEndian.Uint32(input[inputOfs:]))
		s.StrVec = make([]string, size)
		inputOfs += 4
		for i0 := 0; i0 < size; i0++ {
			size := int(binary.LittleEndian.Uint32(input[inputOfs:]))
			tmp := make([]byte, size)
			copy(tmp, input[inputOfs+4:])
			s.StrVec[i0] = string(tmp)
			inputOfs += (4 + size)
		}
	}
	selfOfs += 24

	// Read group MapStrByInt
	{
		size := int(binary.LittleEndian.Uint32(input[inputOfs:]))
		s.MapStrByInt = make(map[int32]string, size)
		inputOfs += 4

		var key int32
		for i0 := 0; i0 < size; i0++ {
			// read key
			{
				buf := (*[4]byte)(unsafe.Pointer(&key))
				copy((*buf)[0:4], input[inputOfs:])
				inputOfs += 4
			}

			// read value
			{
				var value string
				size := int(binary.LittleEndian.Uint32(input[inputOfs:]))
				tmp := make([]byte, size)
				copy(tmp, input[inputOfs+4:])
				value = string(tmp)
				inputOfs += (4 + size)
				s.MapStrByInt[key] = value
			}
		}
	}
	selfOfs += 16

	// Read group MapVecByStr
	{
		size := int(binary.LittleEndian.Uint32(input[inputOfs:]))
		s.MapVecByStr = make(map[string][]int32, size)
		inputOfs += 4

		var key string
		for i0 := 0; i0 < size; i0++ {
			// read key
			{
				size := int(binary.LittleEndian.Uint32(input[inputOfs:]))
				tmp := make([]byte, size)
				copy(tmp, input[inputOfs+4:])
				key = string(tmp)
				inputOfs += (4 + size)
			}

			// read value
			{
				var value []int32
				size := int(binary.LittleEndian.Uint32(input[inputOfs:]))
				value = make([]int32, size)
				inputOfs += 4
				uptr := unsafe.Pointer(unsafe.SliceData(value[0:]))
				bytes := unsafe.Slice((*byte)(uptr), size*4)
				copy(bytes, input[inputOfs:])
				inputOfs += len(bytes)
				s.MapVecByStr[key] = value
			}
		}
	}
	selfOfs += 16
	return uint32(inputOfs), nil
}
