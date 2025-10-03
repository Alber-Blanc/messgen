package tests

import (
	"fmt"
	"github.com/kr/pretty"
	"os"
	"reflect"
	"testing"
)

func TestEncode(t *testing.T) {
	for _, tc := range TEST_DATA {
		t.Run(tc.name, func(t *testing.T) {
			typ := reflect.TypeOf(tc.expected).Elem()

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

			if tc.skipEncode {
				t.Skip("Skip test as Map keys order is not well defined")
				return
			}

			// Read data buffer
			dataPath := fmt.Sprintf("../data/serialized/bin/%s", tc.path)
			data, err := os.ReadFile(dataPath)
			if err != nil {
				panic(fmt.Sprintf("Failed to load test data %s: %s", dataPath, err))
			}

			// Serialize data buffer
			size := tc.expected.SerializedSize()
			actual := make([]byte, size)
			ssize, err := tc.expected.Serialize(actual)
			if err != nil {
				t.Fatalf("Failed to serialize %s: %d", tc.path, err)
			} else if size != ssize {
				t.Fatalf("Serialize unexpected number of bytes: %d != %d", size, ssize)
			}

			// Validate content
			if !reflect.DeepEqual(actual, data) {
				pretty.Ldiff(t, actual, data)
				t.Fatalf("%#v != %#v", actual, data)
			}
		})
	}
}
