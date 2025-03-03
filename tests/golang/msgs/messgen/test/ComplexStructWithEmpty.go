package test

import (
	"encoding/binary"
	"fmt"
	"unsafe"
)

var _ = fmt.Print
var _ = binary.LittleEndian

type ComplexStructWithEmpty struct {
	// Group begin: 0 bytes
	E EmptyStruct
	// Group end
	// Group begin: None bytes
	DynamicArray []EmptyStruct
	// Group end
	// Group begin: 0 bytes
	StaticArray [5]EmptyStruct
	// Group end
	// Group begin: None bytes
	MultiArray [][5][]EmptyStruct
	// Group end
	// Group begin: None bytes
	MapEmptyByInt map[int32]EmptyStruct
	// Group end
	// Group begin: None bytes
	MapVecByStr map[string][]EmptyStruct
	// Group end
	// Group begin: 0 bytes
	ArrayOfSizeZero [0]int32
	// Group end
}

func (s *ComplexStructWithEmpty) SerializedSize() uint32 {
	result := 0

	// Count group E
	result += 0

	// Count group DynamicArray
	{
		result += 4
		result += len(s.DynamicArray) * (0)
	}

	// Count group StaticArray
	result += 0

	// Count group MultiArray
	{
		result += 4
		for i0 := 0; i0 < len(s.MultiArray); i0++ {
			for i1 := 0; i1 < len(s.MultiArray[i0]); i1++ {
				result += 4
				result += len(s.MultiArray[i0][i1]) * (0)
			}
		}
	}

	// Count group MapEmptyByInt
	{
		result += 4
		for _, value := range s.MapEmptyByInt {
			// Count key
			{
				result += 4
			}

			// Count value
			{
				result += int(value.SerializedSize())
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
				result += len(value) * (0)
			}
		}
	}

	// Count group ArrayOfSizeZero
	result += 0
	return uint32(result)
}

func (s *ComplexStructWithEmpty) Serialize(output []byte) (uint32, error) {
	selfBytes := (*[80]byte)(unsafe.Pointer(s))
	outputOfs, selfOfs := 0, 0

	// Write group E
	{
		copy(output[outputOfs:(outputOfs+0)], (*selfBytes)[selfOfs:])
		selfOfs += 0 + 0
		outputOfs += 0

	}

	// Write group DynamicArray
	{
		binary.LittleEndian.PutUint32(output[outputOfs:], uint32(len(s.DynamicArray)))
		outputOfs += 4
		uptr := unsafe.Pointer(unsafe.SliceData(s.DynamicArray[0:]))
		bytes := unsafe.Slice((*byte)(uptr), len(s.DynamicArray)*0)
		copy(output[outputOfs:], bytes)
		outputOfs += len(bytes)
	}
	selfOfs += 24

	// Write group StaticArray
	{
		copy(output[outputOfs:(outputOfs+0)], (*selfBytes)[selfOfs:])
		selfOfs += 0 + 0
		outputOfs += 0

	}

	// Write group MultiArray
	{
		binary.LittleEndian.PutUint32(output[outputOfs:], uint32(len(s.MultiArray)))
		outputOfs += 4
		for i0 := 0; i0 < len(s.MultiArray); i0++ {
			for i1 := 0; i1 < len(s.MultiArray[i0]); i1++ {
				binary.LittleEndian.PutUint32(output[outputOfs:], uint32(len(s.MultiArray[i0][i1])))
				outputOfs += 4
				uptr := unsafe.Pointer(unsafe.SliceData(s.MultiArray[i0][i1][0:]))
				bytes := unsafe.Slice((*byte)(uptr), len(s.MultiArray[i0][i1])*0)
				copy(output[outputOfs:], bytes)
				outputOfs += len(bytes)
			}
		}
	}
	selfOfs += 24

	// Write group MapEmptyByInt
	{
		binary.LittleEndian.PutUint32(output[outputOfs:], uint32(len(s.MapEmptyByInt)))
		outputOfs += 4
		for key, value := range s.MapEmptyByInt {
			// write key
			{
				buf := (*[4]byte)(unsafe.Pointer(&key))
				copy(output[outputOfs:], (*buf)[0:4])
				outputOfs += 4
			}

			// write value
			{
				sz, err := value.Serialize(output[outputOfs:])
				if err != nil {
					return uint32(outputOfs), fmt.Errorf("Failed to encode field 'value'")
				}
				outputOfs += int(sz)
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
				bytes := unsafe.Slice((*byte)(uptr), len(value)*0)
				copy(output[outputOfs:], bytes)
				outputOfs += len(bytes)
			}
		}
	}
	selfOfs += 16

	// Write group ArrayOfSizeZero
	{
		copy(output[outputOfs:(outputOfs+0)], (*selfBytes)[selfOfs:])
		selfOfs += 0 + 0
		outputOfs += 0

	}
	return uint32(outputOfs), nil
}

func (s *ComplexStructWithEmpty) Deserialize(input []byte) (uint32, error) {
	selfBytes := (*[80]byte)(unsafe.Pointer(s))
	inputOfs, selfOfs := 0, 0

	// Read group E
	{
		copy((*selfBytes)[selfOfs:(selfOfs+0)], input[inputOfs:])
		selfOfs += 0 + 0
		inputOfs += 0
	}

	// Read group DynamicArray
	{
		size := int(binary.LittleEndian.Uint32(input[inputOfs:]))
		s.DynamicArray = make([]EmptyStruct, size)
		inputOfs += 4
		uptr := unsafe.Pointer(unsafe.SliceData(s.DynamicArray[0:]))
		bytes := unsafe.Slice((*byte)(uptr), size*0)
		copy(bytes, input[inputOfs:])
		inputOfs += len(bytes)
	}
	selfOfs += 24

	// Read group StaticArray
	{
		copy((*selfBytes)[selfOfs:(selfOfs+0)], input[inputOfs:])
		selfOfs += 0 + 0
		inputOfs += 0
	}

	// Read group MultiArray
	{
		size := int(binary.LittleEndian.Uint32(input[inputOfs:]))
		s.MultiArray = make([][5][]EmptyStruct, size)
		inputOfs += 4
		for i0 := 0; i0 < size; i0++ {
			size := len(s.MultiArray[i0])
			for i1 := 0; i1 < size; i1++ {
				size := int(binary.LittleEndian.Uint32(input[inputOfs:]))
				s.MultiArray[i0][i1] = make([]EmptyStruct, size)
				inputOfs += 4
				uptr := unsafe.Pointer(unsafe.SliceData(s.MultiArray[i0][i1][0:]))
				bytes := unsafe.Slice((*byte)(uptr), size*0)
				copy(bytes, input[inputOfs:])
				inputOfs += len(bytes)
			}
		}
	}
	selfOfs += 24

	// Read group MapEmptyByInt
	{
		size := int(binary.LittleEndian.Uint32(input[inputOfs:]))
		s.MapEmptyByInt = make(map[int32]EmptyStruct, size)
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
				var value EmptyStruct
				sz, err := value.Deserialize(input[inputOfs:])
				if err != nil {
					return uint32(inputOfs), fmt.Errorf("Failed to decode field 'value'")
				}
				inputOfs += int(sz)
				s.MapEmptyByInt[key] = value
			}
		}
	}
	selfOfs += 16

	// Read group MapVecByStr
	{
		size := int(binary.LittleEndian.Uint32(input[inputOfs:]))
		s.MapVecByStr = make(map[string][]EmptyStruct, size)
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
				var value []EmptyStruct
				size := int(binary.LittleEndian.Uint32(input[inputOfs:]))
				value = make([]EmptyStruct, size)
				inputOfs += 4
				uptr := unsafe.Pointer(unsafe.SliceData(value[0:]))
				bytes := unsafe.Slice((*byte)(uptr), size*0)
				copy(bytes, input[inputOfs:])
				inputOfs += len(bytes)
				s.MapVecByStr[key] = value
			}
		}
	}
	selfOfs += 16

	// Read group ArrayOfSizeZero
	{
		copy((*selfBytes)[selfOfs:(selfOfs+0)], input[inputOfs:])
		selfOfs += 0 + 0
		inputOfs += 0
	}
	return uint32(inputOfs), nil
}
