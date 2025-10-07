package tests

import (
	"fmt"
	"os"
	"reflect"
	"testing"

	"github.com/kr/pretty"
)

func TestDecode(t *testing.T) {
	for _, tc := range TEST_DATA {
		t.Run(tc.name, func(t *testing.T) {
			typ := reflect.TypeOf(tc.expected).Elem()

			// Debug
			if testing.Verbose() {
				fmt.Printf("struct %s is %d bytes long {\n", typ.Name(), typ.Size())
				n := typ.NumField()
				for i := 0; i < n; i++ {
					field := typ.Field(i)
					fmt.Printf("\t%s at offset %v, size=%d, align=%d\n",
						field.Name, field.Offset, field.Type.Size(),
						field.Type.Align())
				}
				fmt.Println("}")
			}

			// Read data buffer
			dataPath := fmt.Sprintf("../data/serialized/bin/%s", tc.path)
			data, err := os.ReadFile(dataPath)
			if err != nil {
				panic(fmt.Sprintf("Failed to load test data %s: %s", dataPath, err))
			}

			// Deserialize data buffer
			ptr := reflect.New(typ)
			actual := ptr.Interface().(MessgenStruct)
			if sz, err := actual.Deserialize(data); err != nil {
				t.Fatalf("Faild to deserialize: %s", err)
			} else if int(sz) != len(data) {
				t.Fatalf("Not all bytes been read: %d != %d", sz, len(data))
			}

			// Validate content
			if !reflect.DeepEqual(tc.expected, actual) {
				pretty.Ldiff(t, actual, tc.expected)
				t.Fatalf("%#v != %#v", actual, tc.expected)
			}

			// Validate size ca108: Start field F1Arrlculation
			expectedSize := uint32(len(data))
			if actual.SerializedSize() != expectedSize {
				t.Fatalf("%d != %d", actual.SerializedSize(), expectedSize)
			}
		})
	}
}
